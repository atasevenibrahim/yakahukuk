import { parseMarkdown, type ArticleNode, type InlineSpan } from "@/lib/markdown";

/**
 * Markdown ↔ TipTap (ProseMirror JSON) dönüşümü.
 *
 * Gövdenin tek doğruluk kaynağı markdown METNİ olarak kalır — DB'de o saklanır, AI onu üretir,
 * SEO skoru ve atıf dedektörü onu okur. Görsel editör yalnızca bir düzenleme yüzeyi; açılırken
 * `markdownToDoc`, kapanırken `docToMarkdown` çalışır. Böylece kaydetme/AI/SEO katmanlarının
 * hiçbiri değişmek zorunda kalmıyor.
 *
 * Ayrıştırma tarafında yeni kod yok: mevcut `parseMarkdown` kullanılır, yani editörün gördüğü
 * yapı ile sitenin bastığı yapı tanım gereği aynı.
 *
 * BİLİNEN SINIRLAR (renderer'ın kendi sınırları, bkz. lib/markdown.ts):
 * - Aynı metinde kalın+italik ya da kalın+bağlantı birlikte temsil edilemez; serileştirmede
 *   biri düşer ve `warnings` ile bildirilir.
 * - Markdown'da kaçış (`\*`) desteklenmediği için metinde geçen düz `**` veya `[` karakterleri
 *   gidiş-dönüşte biçimlendirmeye dönüşebilir.
 * - İç içe listeler düz listeye indirgenir.
 */

export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export type TiptapDoc = { type: "doc"; content: DocNode[] };

/** `lib/markdown.ts`'teki `safeHref` ile aynı kural — editör tarafında da şema kaçağı olmasın. */
function safeHref(href: string): string | null {
  if (href.startsWith("/") || href.startsWith("#")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  return null;
}

// ---------------------------------------------------------------------------
// markdown → TipTap
// ---------------------------------------------------------------------------

function spansToInline(spans: InlineSpan[]): DocNode[] {
  const out: DocNode[] = [];
  for (const span of spans) {
    // ProseMirror boş metin düğümü kabul etmez.
    if (!span.text) continue;
    switch (span.type) {
      case "strong":
        out.push({ type: "text", text: span.text, marks: [{ type: "bold" }] });
        break;
      case "em":
        out.push({ type: "text", text: span.text, marks: [{ type: "italic" }] });
        break;
      case "link": {
        const href = safeHref(span.href);
        if (href) {
          out.push({ type: "text", text: span.text, marks: [{ type: "link", attrs: { href } }] });
        } else {
          out.push({ type: "text", text: span.text });
        }
        break;
      }
      default:
        out.push({ type: "text", text: span.text });
    }
  }
  return out;
}

function nodeToDoc(node: ArticleNode): DocNode {
  switch (node.type) {
    case "heading":
      return {
        type: "heading",
        attrs: { level: node.level },
        content: spansToInline(node.spans),
      };
    case "list":
      return {
        type: node.ordered ? "orderedList" : "bulletList",
        content: node.items.map((item) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: spansToInline(item) }],
        })),
      };
    case "quote":
      return {
        type: "blockquote",
        content: [{ type: "paragraph", content: spansToInline(node.spans) }],
      };
    default:
      return { type: "paragraph", content: spansToInline(node.spans) };
  }
}

export function markdownToDoc(markdown: string): TiptapDoc {
  const nodes = parseMarkdown(markdown).map(nodeToDoc);
  // Tamamen boş gövdede ProseMirror en az bir blok bekler.
  return { type: "doc", content: nodes.length > 0 ? nodes : [{ type: "paragraph" }] };
}

// ---------------------------------------------------------------------------
// TipTap → markdown
// ---------------------------------------------------------------------------

export type SerializeResult = { markdown: string; warnings: string[] };

function inlineToMarkdown(content: DocNode[] | undefined, warnings: string[]): string {
  if (!content) return "";
  let out = "";

  for (const node of content) {
    if (node.type !== "text" || !node.text) continue;
    const marks = node.marks ?? [];
    const bold = marks.some((m) => m.type === "bold");
    const italic = marks.some((m) => m.type === "italic");
    const linkMark = marks.find((m) => m.type === "link");

    if (linkMark) {
      const raw = String(linkMark.attrs?.href ?? "");
      const href = safeHref(raw);
      if (!href) {
        warnings.push(`Güvenli olmayan bağlantı adresi düz metne çevrildi: ${raw}`);
        out += node.text;
        continue;
      }
      if (bold || italic) {
        // Ayrıştırıcı bağlantı metninin içindeki biçimlendirmeyi çözmüyor; vurgu düşer.
        warnings.push(`"${node.text}" bağlantısındaki kalın/italik biçim korunamadı.`);
      }
      out += `[${node.text}](${href})`;
      continue;
    }

    if (bold && italic) {
      warnings.push(`"${node.text}" hem kalın hem italik; yalnızca kalın korundu.`);
      out += `**${node.text}**`;
    } else if (bold) {
      out += `**${node.text}**`;
    } else if (italic) {
      out += `*${node.text}*`;
    } else {
      out += node.text;
    }
  }

  return out;
}

/** İç içe listeleri düz listeye indirger — renderer iç içe liste basmıyor. */
function listItemsToLines(node: DocNode, warnings: string[]): string[] {
  const lines: string[] = [];
  for (const item of node.content ?? []) {
    if (item.type !== "listItem") continue;
    for (const child of item.content ?? []) {
      if (child.type === "paragraph") {
        lines.push(inlineToMarkdown(child.content, warnings));
      } else if (child.type === "bulletList" || child.type === "orderedList") {
        warnings.push("İç içe liste düz listeye indirgendi.");
        lines.push(...listItemsToLines(child, warnings));
      }
    }
  }
  return lines;
}

function blockToMarkdown(node: DocNode, warnings: string[]): string | null {
  switch (node.type) {
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      const hashes = level >= 3 ? "###" : "##";
      const text = inlineToMarkdown(node.content, warnings);
      return text ? `${hashes} ${text}` : null;
    }
    case "paragraph": {
      const text = inlineToMarkdown(node.content, warnings);
      return text || null;
    }
    case "bulletList": {
      const lines = listItemsToLines(node, warnings).filter(Boolean);
      return lines.length ? lines.map((l) => `- ${l}`).join("\n") : null;
    }
    case "orderedList": {
      const lines = listItemsToLines(node, warnings).filter(Boolean);
      return lines.length ? lines.map((l, i) => `${i + 1}. ${l}`).join("\n") : null;
    }
    case "blockquote": {
      const parts: string[] = [];
      for (const child of node.content ?? []) {
        const text = inlineToMarkdown(child.content, warnings);
        if (text) parts.push(text);
      }
      return parts.length ? parts.map((p) => `> ${p}`).join("\n") : null;
    }
    default:
      warnings.push(`Sitede gösterilemeyen "${node.type}" bloğu atlandı.`);
      return null;
  }
}

export function docToMarkdown(doc: TiptapDoc | DocNode): SerializeResult {
  const warnings: string[] = [];
  const blocks: string[] = [];

  for (const node of doc.content ?? []) {
    const block = blockToMarkdown(node, warnings);
    if (block) blocks.push(block);
  }

  return { markdown: blocks.join("\n\n"), warnings };
}
