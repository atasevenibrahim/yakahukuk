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
  text: string;
  streaming: boolean;
  error: string | null;
  /**
   * `onDelta` verildiğinde her parça çağrıya da iletilir. Bu, akışı hook'un kendi state'i
   * yerine doğrudan çağıranın veri kaynağına (ör. makale formuna) yazmayı sağlar — böylece
   * iki ayrı state'i efektle senkronlamak ve buna bağlı render döngüsü riski ortadan kalkar.
   * Geri çağrı `start` çağrıldığı anda kapanışa alınır, yani her zaman güncel.
   */
  start: (input: StreamInput, options?: { onDelta?: (delta: string) => void }) => Promise<void>;
  stop: () => void;
  setText: (value: string) => void;
  reset: () => void;
};

export function useBodyStream(): UseBodyStream {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    async (input: StreamInput, options?: { onDelta?: (delta: string) => void }) => {
      // Önceki akış sürüyorsa iptal et — iki akış aynı metne yazmasın.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStreaming(true);
      setError(null);
      setText("");

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
          return;
        }
        if (!response.body) {
          setError("Sunucu boş yanıt verdi. Tekrar deneyin.");
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
              setText((current) => current + event.text);
              options?.onDelta?.(event.text);
            } else if (event.type === "error") {
              setError(event.message);
            }
          }
        }
      } catch (err) {
        // Kullanıcı "Durdur"a bastıysa bu bir hata değil.
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Bağlantı kesildi. Tekrar deneyin — yazılan metin ekranda kaldı.");
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [],
  );

  return { text, streaming, error, start, stop, setText, reset };
}
