"use client";

import { useCallback, useRef, useState } from "react";

/**
 * `/admin/api/ai/govde` uç noktasından gelen NDJSON akışını okur.
 *
 * Sunucu her satırda bir olay gönderiyor: `{type:"text"}`, `{type:"error"}`, `{type:"done"}`.
 * Akış başladıktan sonra HTTP durum kodu değiştirilemediği için hata da bir olay olarak
 * geliyor — o yüzden hem HTTP durumunu hem olay akışını ayrı ayrı ele almak gerekiyor.
 */

type StreamEvent =
  | { type: "text"; text: string }
  | { type: "error"; message: string }
  | { type: "done"; usage: unknown };

export type StreamInput = { title: string; areaSlug: string; instruction?: string };

export type UseBodyStream = {
  /** Akış sürerken biriken metin. Üretim bitene kadar forma YAZILMAZ. */
  text: string;
  streaming: boolean;
  error: string | null;
  /** Akışın başladığı an (ms) — yükleme ekranındaki süre sayacı bunu kullanır. */
  startedAt: number | null;
  /**
   * Metin akarken forma yazılmaz; tamamlandığında `onComplete` ile tek seferde teslim edilir.
   *
   * Neden: (1) kullanıcı üretim boyunca yükleme ekranı görmek istiyor, (2) yarım markdown'ı
   * görsel editöre (TipTap) akıtmak her parçada yeniden ayrıştırma gerektirir ve imleci
   * zıplatır. İkisi birden bu tasarımı zorunlu kılıyor.
   */
  start: (input: StreamInput, options?: { onComplete?: (text: string) => void }) => Promise<void>;
  stop: () => void;
  setText: (value: string) => void;
  reset: () => void;
};

export function useBodyStream(): UseBodyStream {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setText("");
    setError(null);
  }, []);

  const start = useCallback(
    async (input: StreamInput, options?: { onComplete?: (text: string) => void }) => {
      // Önceki akış sürüyorsa iptal et — iki akış aynı metne yazmasın.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStreaming(true);
      setError(null);
      setText("");
      setStartedAt(Date.now());

      // Biriken metin ref'te tutulur: `text` state'i asenkron güncellendiği için akış
      // bitiminde `onComplete`'e geçilecek tam metni state'ten okumak yarış koşulu yaratır.
      let collected = "";
      let failed = false;

      try {
        const response = await fetch("/admin/api/ai/govde", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: controller.signal,
        });

        if (!response.ok) {
          const detail = await response.json().catch(() => null);
          setError(
            (detail as { error?: string } | null)?.error ??
              `Sunucu ${response.status} döndü. Tekrar deneyin.`,
          );
          failed = true;
          return;
        }
        if (!response.body) {
          setError("Sunucu boş yanıt verdi. Tekrar deneyin.");
          failed = true;
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Son parça yarım bir satır olabilir; onu tamponda bırak.
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let event: StreamEvent;
            try {
              event = JSON.parse(line) as StreamEvent;
            } catch {
              continue; // bozuk satırı sessizce atla, akışı bozmayalım
            }
            if (event.type === "text") {
              collected += event.text;
              // Yükleme ekranı ilerlemeyi (karakter sayısını) gösterebilsin diye state de
              // güncellenir; forma yazma işi bitişte `onComplete` ile yapılır.
              setText(collected);
            } else if (event.type === "error") {
              setError(event.message);
              failed = true;
            }
          }
        }
      } catch (err) {
        // Kullanıcı "Durdur"a bastıysa bu bir hata değil; yarım metin teslim edilmez.
        if (err instanceof DOMException && err.name === "AbortError") {
          failed = true;
          return;
        }
        setError("Bağlantı kesildi. Tekrar deneyin.");
        failed = true;
      } finally {
        setStreaming(false);
        setStartedAt(null);
        abortRef.current = null;
        // Metin yalnızca eksiksiz tamamlandıysa teslim edilir — yarım bir makale forma
        // yazılıp kullanıcıyı "bu kadar mı?" diye düşündürmesin.
        if (!failed && collected.trim()) options?.onComplete?.(collected);
      }
    },
    [],
  );

  return { text, streaming, error, startedAt, start, stop, setText, reset };
}
