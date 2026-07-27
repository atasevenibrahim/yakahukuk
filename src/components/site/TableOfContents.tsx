import { buildToc } from "@/lib/seo/toc";

/**
 * Makale içindekiler tablosu.
 *
 * Sunucu bileşeni — etkileşim yok, saf çapa bağlantıları. Başlık id'leri `ArticleBody` ile
 * aynı kuraldan (`lib/seo/toc.ts`) üretildiği için bağlantılar tutuyor.
 *
 * Yalnızca üç ve üzeri başlık varsa gösterilir; iki başlıklı kısa bir yazıda içindekiler
 * gürültüden ibaret olur.
 */
export function TableOfContents({ markdown, title }: { markdown: string; title: string }) {
  const entries = buildToc(markdown);
  if (entries.length < 3) return null;

  return (
    <nav
      aria-label={title}
      className="rounded-md border border-line bg-surface px-6 py-5"
    >
      <p className="m-0 mb-3 font-mono text-[11px] tracking-[2px] text-gold">
        {title.toLocaleUpperCase("tr")}
      </p>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {entries.map((entry) => (
          <li key={entry.id} style={{ paddingLeft: entry.level === 3 ? 16 : 0 }}>
            <a
              href={`#${entry.id}`}
              className="text-[14.5px] leading-relaxed text-ink transition-colors hover:text-gold"
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
