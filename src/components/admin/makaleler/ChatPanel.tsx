"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chatEdit } from "@/lib/ai/article";
import {
  PROBLEM_LABELS,
  applyEdit,
  checkEdit,
  type ArticleFields,
  type CheckedEdit,
} from "@/lib/ai/edit-ops";
import { findCitations } from "@/lib/ai/citations";
import { diffSummary, diffWords } from "@/lib/editor/diff";

/**
 * Makaleyi konuşarak düzenleme paneli.
 *
 * Tasarımın özü: yapay zeka metni DEĞİŞTİRMEZ, değişiklik ÖNERİR. Her öneri ayrı bir kart
 * olarak gelir — gerekçesi, öncesi/sonrası diff'i ve kendi "Uygula / Atla" düğmeleriyle.
 * Metin kullanıcı onaylayana kadar olduğu gibi kalır. Bu, projenin baştan beri sürdürdüğü
 * "hiçbir alan sessizce ezilmez" ilkesinin sohbetteki karşılığı.
 */

const TARGET_LABELS: Record<string, string> = {
  body: "Gövde",
  title: "Başlık",
  excerpt: "Özet",
  metaTitle: "Meta başlık",
  metaDescription: "Meta açıklama",
  tags: "Etiketler",
  focusKeyword: "Odak kelime",
};

type CardState = "pending" | "applied" | "skipped" | "stale";
type EditCard = CheckedEdit & { cardId: string; state: CardState };

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; edits: EditCard[] };

/** Bir düzenleme metne YENİ bir atıf sokuyor mu? Yayın kapısını sohbetle delmeyi engeller. */
function newCitations(before: string, after: string): string[] {
  const had = new Set(findCitations(before).map((c) => c.key));
  return findCitations(after)
    .filter((c) => !had.has(c.key))
    .map((c) => c.match);
}

export function ChatPanel({
  fields,
  onApply,
  selection,
  storageKey,
}: {
  fields: ArticleFields;
  /** Onaylanan düzenlemenin sonucunu forma yazar. */
  onApply: (next: ArticleFields) => void;
  /** Editörde seçili metin (varsa) — asistan yalnızca oraya odaklanır. */
  selection?: string;
  /** localStorage anahtarı; makale id'si bazlı. */
  storageKey: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const key = `yaka:chat:${storageKey}`;

  // Konuşma geçmişi localStorage'da; sekme kapansa da kaybolmuyor (taslak kurtarmayla aynı desen).
  useEffect(() => {
    // localStorage yalnızca tarayıcıda var, mount sonrası okunmak zorunda. Tek seferlik
    // okuma; döngü yaratmaz. (`set-state-in-effect` bu meşru durumu da yakalıyor.)
    const saved = window.localStorage.getItem(key);
    let parsed: ChatMessage[] | null = null;
    if (saved) {
      try {
        parsed = JSON.parse(saved) as ChatMessage[];
      } catch {
        /* bozuk kayıt — yok say */
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (parsed) setMessages(parsed);
    setRestored(true);
  }, [key]);

  useEffect(() => {
    if (!restored) return;
    window.localStorage.setItem(key, JSON.stringify(messages));
  }, [messages, key, restored]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  /** Sunucuya gönderilecek konuşma geçmişi — düzenleme kartları değil, yalnızca metinler. */
  const history = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        text: m.text,
      })),
    [messages],
  );

  async function send() {
    const instruction = input.trim();
    if (!instruction || busy) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: instruction };
    setMessages((cur) => [...cur, userMessage]);
    setInput("");
    setBusy(true);
    setError(null);

    const result = await chatEdit({ instruction, history, fields, selection });
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessages((cur) => [
      ...cur,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: result.data.reply,
        edits: result.data.edits.map((e) => ({
          ...e,
          cardId: crypto.randomUUID(),
          state: e.status.ok ? ("pending" as const) : ("stale" as const),
        })),
      },
    ]);
  }

  function setCardState(cardId: string, state: CardState) {
    setMessages((cur) =>
      cur.map((m) =>
        m.role === "assistant"
          ? { ...m, edits: m.edits.map((e) => (e.cardId === cardId ? { ...e, state } : e)) }
          : m,
      ),
    );
  }

  function handleApply(card: EditCard) {
    // Kart üretildiğinden beri metin değişmiş olabilir; uygulamadan önce yeniden doğrula.
    const next = applyEdit(card, fields);
    if (!next) {
      setCardState(card.cardId, "stale");
      return;
    }
    onApply(next);
    setCardState(card.cardId, "applied");
  }

  function handleApplyAll(messageId: string) {
    const message = messages.find((m) => m.id === messageId);
    if (!message || message.role !== "assistant") return;

    // Sırayla uygula; her adımda güncel alanlar üzerinden yeniden doğrulanır.
    let working = fields;
    const applied: string[] = [];
    const stale: string[] = [];
    for (const card of message.edits) {
      if (card.state !== "pending") continue;
      const next = applyEdit(card, working);
      if (next) {
        working = next;
        applied.push(card.cardId);
      } else {
        stale.push(card.cardId);
      }
    }
    if (applied.length > 0) onApply(working);
    setMessages((cur) =>
      cur.map((m) =>
        m.role === "assistant"
          ? {
              ...m,
              edits: m.edits.map((e) =>
                applied.includes(e.cardId)
                  ? { ...e, state: "applied" }
                  : stale.includes(e.cardId)
                    ? { ...e, state: "stale" }
                    : e,
              ),
            }
          : m,
      ),
    );
  }

  function clearChat() {
    setMessages([]);
    window.localStorage.removeItem(key);
  }

  return (
    <div className="flex h-full flex-col rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(28,34,48,0.05)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <h2 className="m-0 flex items-center gap-2 text-sm font-bold">
          <span aria-hidden>✨</span> Makale asistanı
        </h2>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="ml-auto rounded border border-line px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
          >
            Sohbeti temizle
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3.5">
        {messages.length === 0 && (
          <div className="rounded border border-dashed border-line px-4 py-6 text-center">
            <p className="m-0 text-[12.5px] font-semibold text-ink">
              Makaleyi konuşarak düzenleyin.
            </p>
            <p className="m-0 mt-1.5 text-[11.5px] leading-relaxed text-muted">
              Örnek: &quot;İkinci bölümü kısalt&quot;, &quot;girişi daha sade yaz&quot;,
              &quot;başlığı 55 karakterin altına indir&quot;.
            </p>
            <p className="m-0 mt-2.5 text-[11px] leading-relaxed text-muted">
              Önerilen değişiklikleri tek tek onaylarsınız; metin siz onaylamadan değişmez.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3.5">
          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="self-end rounded-lg bg-ink px-3.5 py-2 text-[12.5px] leading-relaxed text-cream" style={{ maxWidth: "85%" }}>
                {message.text}
              </div>
            ) : (
              <div key={message.id} className="flex flex-col gap-2">
                <div className="rounded-lg bg-[#FAF8F3] px-3.5 py-2 text-[12.5px] leading-relaxed text-ink" style={{ maxWidth: "92%" }}>
                  {message.text}
                </div>

                {message.edits.length > 0 && (
                  <>
                    {message.edits.some((e) => e.state === "pending") && (
                      <button
                        type="button"
                        onClick={() => handleApplyAll(message.id)}
                        className="self-start rounded bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-cream transition-colors hover:bg-gold"
                      >
                        Tümünü uygula (
                        {message.edits.filter((e) => e.state === "pending").length})
                      </button>
                    )}
                    {message.edits.map((card) => (
                      <EditCardView
                        key={card.cardId}
                        card={card}
                        fields={fields}
                        onApply={() => handleApply(card)}
                        onSkip={() => setCardState(card.cardId, "skipped")}
                      />
                    ))}
                  </>
                )}
              </div>
            ),
          )}

          {busy && (
            <div className="flex items-center gap-2.5 rounded-lg bg-[#FAF8F3] px-3.5 py-2.5">
              <span
                aria-hidden
                className="inline-block h-3 w-3 animate-spin rounded-sm border-[1.5px] border-line border-t-gold"
              />
              <span className="text-[12px] text-muted">Makale okunuyor ve düzenleme hazırlanıyor…</span>
            </div>
          )}
        </div>

        {error && (
          <p
            className="m-0 mt-3 rounded border px-3 py-2 text-[11.5px] leading-relaxed"
            style={{ borderColor: "#E8C5C1", background: "#FBF1F0", color: "#A23A32" }}
          >
            {error}
          </p>
        )}
      </div>

      <div className="border-t border-line px-4 py-3">
        {selection?.trim() && (
          <p
            className="m-0 mb-2 overflow-hidden text-ellipsis whitespace-nowrap rounded border px-2.5 py-1.5 text-[11px]"
            style={{ borderColor: "#9C7C4A", background: "rgba(156,124,74,.07)", color: "#9C7C4A" }}
            title={selection}
          >
            Seçili metin üzerinde çalışılacak: “{selection.trim().slice(0, 60)}
            {selection.trim().length > 60 ? "…" : ""}”
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder="Ne değiştirelim? (Enter ile gönder)"
            className="min-w-0 flex-1 resize-y rounded border border-line bg-white px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-gold"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || !input.trim()}
            className="rounded bg-ink px-4 py-2.5 text-[12.5px] font-semibold text-cream transition-colors hover:bg-gold disabled:opacity-50"
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}

function EditCardView({
  card,
  fields,
  onApply,
  onSkip,
}: {
  card: EditCard;
  fields: ArticleFields;
  onApply: () => void;
  onSkip: () => void;
}) {
  // Kart üretildiğinden beri metin değişmiş olabilir — güncel duruma göre yeniden doğrula.
  const live = useMemo(() => checkEdit(card, fields), [card, fields]);
  const stale = card.state === "stale" || !live.status.ok;

  const parts = useMemo(
    () => (live.status.ok ? diffWords(live.status.before, live.status.after) : []),
    [live],
  );
  const summary = useMemo(() => diffSummary(parts), [parts]);
  const added = useMemo(
    () => (live.status.ok ? newCitations(live.status.before, live.status.after) : []),
    [live],
  );

  const border =
    card.state === "applied" ? "#CDE0D4" : stale ? "#E8C5C1" : card.state === "skipped" ? "#E4DFD5" : "#E4DFD5";

  return (
    <div
      className="rounded border px-3 py-2.5"
      style={{ borderColor: border, background: card.state === "skipped" ? "#FAFAF8" : "#FFFFFF", opacity: card.state === "skipped" ? 0.6 : 1 }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[9px] tracking-[1px] text-gold">
          {(TARGET_LABELS[card.target] ?? card.target).toLocaleUpperCase("tr")}
          {card.target === "body" && card.block !== undefined ? ` · BLOK ${card.block + 1}` : ""}
        </span>
        {live.status.ok && (
          <span className="font-mono text-[9.5px] text-muted">
            +{summary.added} / −{summary.removed} kelime
          </span>
        )}
        {card.state === "applied" && (
          <span className="ml-auto font-mono text-[9.5px] font-semibold text-[#3F7A5B]">
            UYGULANDI
          </span>
        )}
        {card.state === "skipped" && (
          <span className="ml-auto font-mono text-[9.5px] text-muted">ATLANDI</span>
        )}
      </div>

      <p className="m-0 mt-1.5 text-[11.5px] italic leading-relaxed text-muted">{card.reason}</p>

      {stale ? (
        <p
          className="m-0 mt-2 rounded px-2.5 py-1.5 text-[11px] leading-relaxed"
          style={{ background: "#FBF1F0", color: "#A23A32" }}
        >
          {live.status.ok
            ? "Bu düzenleme artık uygulanamıyor."
            : PROBLEM_LABELS[live.status.problem]}
        </p>
      ) : (
        <p className="m-0 mt-2 rounded bg-[#FAF8F3] px-2.5 py-2 text-[12px] leading-relaxed">
          {parts.map((part, i) =>
            part.type === "same" ? (
              <span key={i}>{part.text}</span>
            ) : part.type === "added" ? (
              <span key={i} style={{ background: "rgba(63,122,91,.16)", color: "#2F5C45" }}>
                {part.text}
              </span>
            ) : (
              <span
                key={i}
                style={{ background: "rgba(162,58,50,.12)", color: "#A23A32", textDecoration: "line-through" }}
              >
                {part.text}
              </span>
            ),
          )}
        </p>
      )}

      {added.length > 0 && (
        <p
          className="m-0 mt-2 rounded px-2.5 py-1.5 text-[11px] leading-relaxed"
          style={{ background: "#FBF1F0", color: "#A23A32" }}
        >
          Bu düzenleme metne doğrulanmamış bilgi ekliyor: {added.join(", ")}. Uygularsanız
          yayınlamadan önce kaynaktan teyit etmeniz gerekir.
        </p>
      )}

      {card.state === "pending" && !stale && (
        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={onApply}
            className="rounded bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-cream transition-colors hover:bg-gold"
          >
            Uygula
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
          >
            Atla
          </button>
        </div>
      )}
    </div>
  );
}
