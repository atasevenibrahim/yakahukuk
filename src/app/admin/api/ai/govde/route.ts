import { getPathname } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { logAudit, readRequestInfo } from "@/lib/auth/audit";
import { getArticlesRaw } from "@/content/articles";
import { getPracticeAreasRaw } from "@/content/practice-areas";
import { AiError, completeStream, type AiUsage } from "@/lib/ai/provider";
import { bodySystemPrompt, type LinkTarget } from "@/lib/ai/prompts";

/**
 * Makale gövdesinin akışlı üretimi.
 *
 * Neden Server Action değil: Server Action'lar tek bir değer döndürür, parça parça metin
 * akıtamaz. Uzun çıktıda istek zaman aşımına düşmesin ve kullanıcı metnin yazıldığını görsün
 * diye Route Handler + `ReadableStream` kullanılıyor (Next 16 `route.md`'deki async-iterator →
 * stream deseni; ek bir kütüphaneye gerek yok).
 *
 * Neden `/admin/api/...` altında: oturum çerezi `path: "/admin"` ile yazılıyor
 * (`src/lib/auth/session.ts`). Kök `/api/...` altındaki bir uç noktaya tarayıcı bu çerezi HİÇ
 * göndermez, dolayısıyla oturum kontrolü her zaman başarısız olurdu. `/admin` altında olması
 * ayrıca `src/proxy.ts` matcher'ının (next-intl) ve `robots.ts`'in kapsamı dışında bırakıyor.
 */

const MODULE_LABEL = "MAKALELER";

/** İstemciye NDJSON olarak akan olaylar. */
type StreamEvent =
  | { type: "text"; text: string }
  | { type: "error"; message: string }
  | { type: "done"; usage: AiUsage | null };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function linkTargets(): Promise<LinkTarget[]> {
  const [areas, articles] = await Promise.all([getPracticeAreasRaw(), getArticlesRaw()]);
  return [
    ...areas.map((a) => ({
      title: a.t.tr.title,
      href: getPathname({
        href: { pathname: "/calisma-alanlari/[slug]", params: { slug: a.slug } },
        locale: "tr" as const,
      }),
    })),
    ...articles.map((a) => ({
      title: a.t.tr.title,
      href: getPathname({
        href: { pathname: "/makaleler/[slug]", params: { slug: a.slug } },
        locale: "tr" as const,
      }),
    })),
  ];
}

export async function POST(request: Request): Promise<Response> {
  // 1) Kimlik. Akış başlamadan önce yapılır ki gerçek bir HTTP durum kodu dönebilsin —
  //    yanıt gövdesi akmaya başladıktan sonra status değiştirilemez.
  const user = await getSessionUser();
  if (!user) return json({ error: "Yetkisiz erişim: oturum bulunamadı." }, 401);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Geçersiz istek gövdesi." }, 400);
  }

  const { title, areaSlug, instruction } = (payload ?? {}) as {
    title?: unknown;
    areaSlug?: unknown;
    instruction?: unknown;
  };

  if (typeof title !== "string" || title.trim().length < 5) {
    return json({ error: "Başlık gerekli." }, 400);
  }
  if (typeof areaSlug !== "string" || !areaSlug) {
    return json({ error: "Çalışma alanı gerekli." }, 400);
  }

  const areas = await getPracticeAreasRaw();
  const area = areas.find((a) => a.slug === areaSlug);
  if (!area) return json({ error: "Seçilen çalışma alanı bulunamadı." }, 400);

  const targets = await linkTargets();
  const system = bodySystemPrompt(
    {
      slug: area.slug,
      title: area.t.tr.title,
      href: getPathname({
        href: { pathname: "/calisma-alanlari/[slug]", params: { slug: area.slug } },
        locale: "tr",
      }),
    },
    targets,
  );

  const extra =
    typeof instruction === "string" && instruction.trim()
      ? `\n\nEk talimat: ${instruction.trim()}`
      : "";
  const prompt = `Makale başlığı: ${title.trim()}${extra}`;

  // İstek bağlamı akış geri çağrısında güvenilir olmadığı için başlıklar şimdi okunuyor.
  const requestInfo = await readRequestInfo();

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, event: StreamEvent) => {
    controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
  };

  const stream = new ReadableStream({
    async start(controller) {
      // Nesne sarmalayıcı: `let usage = null` olsaydı TypeScript, atama yalnızca geri çağrının
      // içinde yapıldığı için değişkeni `null`'a daraltıp kullanım yerinde `never` üretirdi.
      const usageRef: { current: AiUsage | null } = { current: null };
      try {
        for await (const chunk of completeStream({
          system,
          prompt,
          thinking: "medium",
          temperature: 0.85,
          maxOutputTokens: 16000,
          signal: request.signal,
          onUsage: (u) => {
            usageRef.current = u;
          },
        })) {
          send(controller, { type: "text", text: chunk });
        }
        send(controller, { type: "done", usage: usageRef.current });
      } catch (err) {
        // Akış başladıktan sonra HTTP durumu değiştirilemez; hata olay olarak iletilir ve
        // istemci bunu kırmızı bir uyarıya çevirir. Yazılmış olan metin ekranda kalır.
        const message =
          err instanceof AiError
            ? err.userMessage
            : "Metin üretilirken beklenmeyen bir hata oluştu. Tekrar deneyin.";
        if (!(err instanceof AiError)) console.error("[ai] gövde akışı hatası:", err);
        send(controller, { type: "error", message });
      } finally {
        controller.close();
        // Denetim kaydı akışı bloklamamalı; hata olursa yalnızca loglanır.
        void logAudit({
          actorId: user.id,
          action: "ai_article_generated",
          module: MODULE_LABEL,
          detail: usageRef.current
            ? `${usageRef.current.totalTokens} token (girdi ${usageRef.current.promptTokens} / çıktı ${usageRef.current.outputTokens})`
            : "akış tamamlanmadı",
          request: requestInfo,
        }).catch((err) => console.error("[ai] denetim kaydı yazılamadı:", err));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Ters proxy'lerin yanıtı tamponlayıp akışı anlamsız kılmasını engeller.
      "X-Accel-Buffering": "no",
    },
  });
}
