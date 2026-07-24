import type { ArticleBlock } from "@/content/articles";

/**
 * Makale gövdesi için basit pseudo-markdown: `# başlık`, `- liste öğesi`, `> alıntı`,
 * düz paragraf. Bloklar boş satırla ayrılır. Admin editöründeki düz <textarea> bununla
 * ArticleBlock[]'a çevrilir — gerçek bir zengin metin editörü yerine (mockup'ın kendi
 * araç çubuğu da işlevsiz/temsili), mevcut render bileşenine dokunmadan çalışır.
 */
export function encodeArticleBody(blocks: ArticleBlock[]): string {
  return blocks
    .map((b) => {
      if (b.type === "heading") return `# ${b.text}`;
      if (b.type === "quote") return `> ${b.text}`;
      if (b.type === "list") return b.items.map((item) => `- ${item}`).join("\n");
      return b.text;
    })
    .join("\n\n");
}

export function decodeArticleBody(text: string): ArticleBlock[] {
  const chunks = text
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);

  return chunks.map((chunk): ArticleBlock => {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.every((l) => l.startsWith("- "))) {
      return { type: "list", items: lines.map((l) => l.slice(2).trim()) };
    }
    if (lines.length === 1 && lines[0].startsWith("# ")) {
      return { type: "heading", text: lines[0].slice(2).trim() };
    }
    if (lines.every((l) => l.startsWith("> "))) {
      return { type: "quote", text: lines.map((l) => l.slice(2).trim()).join(" ") };
    }
    return { type: "paragraph", text: lines.join(" ") };
  });
}
