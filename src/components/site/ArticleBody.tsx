import { parseMarkdown, type ArticleNode, type InlineSpan } from "@/lib/markdown";

/**
 * Makale gövdesini markdown metninden render eder. Sunucu bileşeni — etkileşim yok.
 *
 * Paragraf/başlık/liste/alıntı stilleri, göç öncesi `ArticleBlock[]` render'ıyla birebir aynı
 * tutulmuştur; h3, sıralı liste ve satır içi biçimlendirme yeni eklenenler.
 */

function Spans({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((span, i) => {
        if (span.type === "strong") {
          return (
            <strong key={i} className="font-semibold text-ink">
              {span.text}
            </strong>
          );
        }
        if (span.type === "em") {
          return (
            <em key={i} className="italic">
              {span.text}
            </em>
          );
        }
        if (span.type === "link") {
          const external = /^https?:\/\//i.test(span.href);
          return (
            <a
              key={i}
              href={span.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-gold underline decoration-gold/40 underline-offset-2 transition-colors hover:decoration-gold"
            >
              {span.text}
            </a>
          );
        }
        return <span key={i}>{span.text}</span>;
      })}
    </>
  );
}

function Node({ node, first }: { node: ArticleNode; first: boolean }) {
  if (node.type === "heading") {
    const className =
      node.level === 2
        ? `font-serif text-[28px] font-medium sm:text-[30px] ${first ? "" : "mt-10"}`
        : `font-serif text-[22px] font-semibold sm:text-[24px] ${first ? "" : "mt-8"}`;
    return node.level === 2 ? (
      <h2 className={className}>
        <Spans spans={node.spans} />
      </h2>
    ) : (
      <h3 className={className}>
        <Spans spans={node.spans} />
      </h3>
    );
  }

  if (node.type === "list") {
    const items = node.items.map((spans, i) => (
      <li key={i} className="text-[16.5px] leading-relaxed text-muted">
        <Spans spans={spans} />
      </li>
    ));
    const className = `flex flex-col gap-2.5 pl-[22px] ${first ? "" : "mt-5"}`;
    return node.ordered ? (
      <ol className={`${className} list-decimal`}>{items}</ol>
    ) : (
      <ul className={`${className} list-disc`}>{items}</ul>
    );
  }

  if (node.type === "quote") {
    return (
      <div
        className={`rounded-md border border-line border-l-2 border-l-gold bg-surface px-8 py-7 ${first ? "" : "mt-10"}`}
      >
        <p className="m-0 font-serif text-[22px] italic leading-[1.5] text-pretty text-ink">
          &ldquo;
          <Spans spans={node.spans} />
          &rdquo;
        </p>
      </div>
    );
  }

  return (
    <p
      className={`text-[17px] leading-[1.7] text-pretty text-ink ${first ? "" : "mt-4"}`}
    >
      <Spans spans={node.spans} />
    </p>
  );
}

export function ArticleBody({ markdown }: { markdown: string }) {
  const nodes = parseMarkdown(markdown);
  return (
    <div>
      {nodes.map((node, i) => (
        <Node key={i} node={node} first={i === 0} />
      ))}
    </div>
  );
}
