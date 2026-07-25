/**
 * Makale gövdesi için dar kapsamlı markdown ayrıştırıcısı.
 *
 * Gövde DB'de markdown metni olarak saklanır; burada render-zamanı bir AST'e çevrilir.
 * Kasıtlı olarak sınırlı: yalnızca bir hukuk bürosu makalesinin ihtiyaç duyduğu yapılar
 * desteklenir. **Ham HTML hiçbir zaman ayrıştırılmaz ve geçirilmez** — çıktı React metin
 * düğümü olarak basıldığı için XSS yüzeyi yoktur, sanitizasyona gerek kalmaz.
 *
 * Desteklenen:
 *   ## Başlık        → h2        (tek `#` de h2'ye düşer; sayfadaki h1 makale başlığıdır)
 *   ### Alt başlık   → h3
 *   - madde          → sırasız liste
 *   1. madde         → sıralı liste
 *   > alıntı         → alıntı bloğu
 *   düz satır(lar)   → paragraf
 *   **kalın**  *italik*  _italik_  [metin](/yol)
 *
 * Bloklar boş satırla ayrılır.
 */

export type InlineSpan =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "em"; text: string }
  | { type: "link"; text: string; href: string };

export type ArticleNode =
  | { type: "paragraph"; spans: InlineSpan[] }
  | { type: "heading"; level: 2 | 3; spans: InlineSpan[] }
  | { type: "list"; ordered: boolean; items: InlineSpan[][] }
  | { type: "quote"; spans: InlineSpan[] };

// Link | **kalın** | *italik* | _italik_ — sırası önemli: `**` alternatifi `*`'tan önce gelmeli.
const INLINE_RE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g;

const ORDERED_ITEM_RE = /^\d+[.)]\s+/;

/**
 * Yalnızca site-içi yollara ve http(s) adreslerine izin verilir. `javascript:`, `data:` gibi
 * şemalar link olarak kabul edilmez — o durumda metin düz metin olarak kalır.
 */
function safeHref(href: string): string | null {
  if (href.startsWith("/") || href.startsWith("#")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  return null;
}

function pushText(spans: InlineSpan[], text: string): void {
  if (!text) return;
  const last = spans[spans.length - 1];
  if (last?.type === "text") last.text += text;
  else spans.push({ type: "text", text });
}

/** Satır içi biçimlendirmeyi span dizisine çevirir. */
export function parseInline(input: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let cursor = 0;

  for (const match of input.matchAll(INLINE_RE)) {
    const start = match.index;
    pushText(spans, input.slice(cursor, start));

    const [raw, linkText, linkHref, strong, emStar, emUnderscore] = match;
    if (linkText !== undefined && linkHref !== undefined) {
      const href = safeHref(linkHref);
      if (href) spans.push({ type: "link", text: linkText, href });
      else pushText(spans, raw); // güvenli olmayan şema → düz metin
    } else if (strong !== undefined) {
      spans.push({ type: "strong", text: strong });
    } else {
      const emphasis = emStar ?? emUnderscore;
      if (emphasis !== undefined) spans.push({ type: "em", text: emphasis });
    }

    cursor = start + raw.length;
  }

  pushText(spans, input.slice(cursor));
  return spans;
}

function headingLevel(line: string): { level: 2 | 3; text: string } | null {
  const match = /^(#{1,6})\s+(.*)$/.exec(line);
  if (!match) return null;
  // Sayfadaki h1 makale başlığı olduğu için gövdede h1 üretilmez: # ve ## → h2, ###+ → h3.
  return { level: match[1].length >= 3 ? 3 : 2, text: match[2].trim() };
}

/** Markdown metnini render edilebilir düğüm dizisine çevirir. */
export function parseMarkdown(source: string): ArticleNode[] {
  const chunks = source
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const nodes: ArticleNode[] = [];

  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    if (lines.every((line) => line.startsWith("- ") || line.startsWith("* "))) {
      nodes.push({
        type: "list",
        ordered: false,
        items: lines.map((line) => parseInline(line.slice(2).trim())),
      });
      continue;
    }

    if (lines.every((line) => ORDERED_ITEM_RE.test(line))) {
      nodes.push({
        type: "list",
        ordered: true,
        items: lines.map((line) => parseInline(line.replace(ORDERED_ITEM_RE, "").trim())),
      });
      continue;
    }

    if (lines.every((line) => line.startsWith(">"))) {
      const text = lines.map((line) => line.replace(/^>\s?/, "").trim()).join(" ");
      nodes.push({ type: "quote", spans: parseInline(text) });
      continue;
    }

    const heading = lines.length === 1 ? headingLevel(lines[0]) : null;
    if (heading) {
      nodes.push({ type: "heading", level: heading.level, spans: parseInline(heading.text) });
      continue;
    }

    // Paragraf: tek satıra birleştirilir (markdown'ın yumuşak satır sonu davranışı).
    nodes.push({ type: "paragraph", spans: parseInline(lines.join(" ")) });
  }

  return nodes;
}

/** Biçimlendirmeyi atarak düz metin döner — kelime sayımı, özet ve SEO denetimi için. */
export function markdownToPlainText(source: string): string {
  return parseMarkdown(source)
    .map((node) => {
      if (node.type === "list") {
        return node.items.map((item) => item.map((s) => s.text).join("")).join(" ");
      }
      return node.spans.map((s) => s.text).join("");
    })
    .join("\n\n");
}
