"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArticleBody } from "@/components/site/ArticleBody";
import { buildExtensions } from "@/lib/editor/extensions";
import { docToMarkdown, markdownToDoc, type TiptapDoc } from "@/lib/editor/markdown-doc";
import { analyzeSeo } from "@/lib/seo/score";
import { buildVerificationReport } from "@/lib/ai/citations";
import { GenerationOverlay } from "./GenerationOverlay";
import { LinkDialog, type LinkTargetOption } from "./LinkDialog";

/**
 * Makale gövdesi editörü — üç görünüm: Görsel (TipTap), Kaynak (markdown), Önizleme.
 *
 * Tek doğruluk kaynağı markdown metnidir; görsel editör yalnızca bir düzenleme yüzeyi.
 * Böylece kaydetme, AI, SEO skoru ve atıf dedektörü katmanlarının hiçbiri değişmedi.
 *
 * Önizleme, sitenin GERÇEK `ArticleBody` bileşenini kullanır — önizlemede görülen ile
 * yayınlanan birebir aynıdır, ayrı bir önizleme renderer'ı bakımı yoktur.
 */

type View = "gorsel" | "kaynak" | "onizleme";

const TABS: { id: View; label: string }[] = [
  { id: "gorsel", label: "Görsel" },
  { id: "kaynak", label: "Markdown" },
  { id: "onizleme", label: "Önizleme" },
];

export function ArticleEditor({
  value,
  onChange,
  linkTargets,
  /** localStorage taslak anahtarı — makale id'si ya da "yeni". */
  draftKey,
  generation,
}: {
  value: string;
  onChange: (markdown: string) => void;
  linkTargets: LinkTargetOption[];
  draftKey: string;
  /** Yapay zeka gövdeyi üretirken editörün yerine yükleme ekranı basılır. */
  generation?: { active: boolean; startedAt: number | null; charCount: number; onCancel: () => void };
}) {
  const [view, setView] = useState<View>("gorsel");
  const [focusMode, setFocusMode] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findTerm, setFindTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [recovered, setRecovered] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  /** Seçim üzerinde beliren balıncak menünün konumu (editör kabına göre). */
  const [bubble, setBubble] = useState<{ top: number; left: number } | null>(null);
  /** "/" ile açılan blok ekleme menüsü. */
  const [slash, setSlash] = useState<{ top: number; left: number; query: string } | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const shellRef = useRef<HTMLDivElement>(null);

  /**
   * Editörden gelen değişikliği markdown'a çevirip yukarı bildirir. `value` prop'u da
   * bu yüzden değişeceği için, kendi yazdığımız metni tekrar editöre yüklememek adına
   * son yazdığımız markdown ref'te saklanır.
   */
  const lastEmitted = useRef(value);

  const editor = useEditor({
    extensions: buildExtensions(),
    content: markdownToDoc(value),
    immediatelyRender: false, // Next SSR hidrasyon uyuşmazlığını önler
    editorProps: {
      attributes: {
        class: "yaka-prose focus:outline-none",
      },
    },
    onUpdate({ editor: current }) {
      const { markdown, warnings: w } = docToMarkdown(current.getJSON() as TiptapDoc);
      lastEmitted.current = markdown;
      setWarnings(w);
      onChange(markdown);
    },
  });

  /**
   * Balıncak menü ve "/" menüsünün konumu.
   *
   * TipTap v3'te BubbleMenu bir React bileşeni değil, DOM elemanı isteyen bir eklenti —
   * `useEditor` ile sıra sorunu çıkarıyor. Kendi konumlandırmamızı yazmak hem daha az
   * hareketli parça hem de "/" menüsüyle aynı mekanizmayı paylaşmamızı sağlıyor.
   */
  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const shell = shellRef.current;
      if (!shell) return;
      const { state, view } = editor;
      const { from, to, empty } = state.selection;
      const shellBox = shell.getBoundingClientRect();

      // Seçim varsa balıncak menü
      if (!empty && editor.isFocused) {
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        setBubble({
          top: Math.min(start.top, end.top) - shellBox.top - 44,
          left: (start.left + end.right) / 2 - shellBox.left,
        });
      } else {
        setBubble(null);
      }

      // İmlecin bulunduğu paragrafta "/" ile başlayan bir sorgu var mı
      const textBefore = state.doc.textBetween(Math.max(0, from - 40), from, "\n", "\n");
      const match = /(?:^|\n)\/([\p{L}]*)$/u.exec(textBefore);
      if (empty && match && editor.isFocused) {
        const caret = view.coordsAtPos(from);
        setSlash({
          top: caret.bottom - shellBox.top + 6,
          left: caret.left - shellBox.left,
          query: match[1],
        });
        setSlashIndex(0);
      } else {
        setSlash(null);
      }
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    editor.on("blur", () => {
      setBubble(null);
      setSlash(null);
    });
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  // Dışarıdan gelen değişiklik (AI üretimi, kaynak sekmesinde düzenleme) editöre yansıtılır.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(markdownToDoc(value), { emitUpdate: false });
  }, [editor, value]);

  // --- Taslak koruma -------------------------------------------------------
  const storageKey = `yaka:draft:${draftKey}`;

  useEffect(() => {
    // localStorage yalnızca tarayıcıda var; sunucuda render edilirken okunamaz, bu yüzden
    // mount sonrası okunmak zorunda. Tek seferlik okuma, döngü yaratmaz.
    const saved = window.localStorage.getItem(storageKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved && saved !== value && saved.trim()) setRecovered(saved);
    // `value` kasıtlı olarak bağımlılıkta yok: kurtarma yalnızca açılışta bir kez sorulur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (value.trim()) window.localStorage.setItem(storageKey, value);
    }, 1000);
    return () => clearTimeout(id);
  }, [value, storageKey]);

  // --- Sayaçlar ------------------------------------------------------------
  const stats = useMemo(() => {
    const seo = analyzeSeo({
      title: "",
      slug: "",
      body: value,
      excerpt: "",
      metaTitle: "",
      metaDescription: "",
      focusKeyword: "",
      baseUrl: "",
    });
    const markers = buildVerificationReport(value).placeholders.length;
    return { words: seo.wordCount, minutes: seo.readMinutes, readability: seo.readability, markers };
  }, [value]);

  const outline = useMemo(
    () =>
      value
        .split("\n")
        .map((line) => /^(#{2,3})\s+(.*)$/.exec(line.trim()))
        .filter((m): m is RegExpExecArray => m !== null)
        .map((m) => ({ level: m[1].length, text: m[2] })),
    [value],
  );

  /** Anahattan bir başlığa tıklanınca imleci oraya taşır (görsel modda). */
  const jumpToHeading = useCallback(
    (text: string) => {
      if (!editor) {
        setView("kaynak");
        return;
      }
      setView("gorsel");
      let target: number | null = null;
      editor.state.doc.descendants((node, pos) => {
        if (target !== null) return false;
        if (node.type.name === "heading" && node.textContent === text) target = pos + 1;
        return true;
      });
      if (target !== null) editor.chain().focus().setTextSelection(target).scrollIntoView().run();
    },
    [editor],
  );

  /** Sıradaki [DOĞRULANACAK] işaretçisine gider — yayın kapısını kapatmak için. */
  const jumpToNextMarker = useCallback(() => {
    if (!editor) return;
    setView("gorsel");
    const { from } = editor.state.selection;
    const positions: number[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      for (const m of node.text.matchAll(/\[DOĞRULANACAK:?[^\]]*\]/gu)) {
        if (m.index !== undefined) positions.push(pos + m.index);
      }
    });
    if (positions.length === 0) return;
    const next = positions.find((p) => p > from) ?? positions[0];
    editor.chain().focus().setTextSelection(next + 1).scrollIntoView().run();
  }, [editor]);

  function applyFindReplace() {
    if (!findTerm) return;
    onChange(value.split(findTerm).join(replaceTerm));
  }

  const insertLink = useCallback(
    (href: string, label: string) => {
      if (!editor) return;
      const { empty } = editor.state.selection;
      if (empty) {
        editor.chain().focus().insertContent(`<a href="${href}">${label}</a>`).run();
      } else {
        editor.chain().focus().setLink({ href }).run();
      }
    },
    [editor],
  );


  /** "/" menüsündeki komutlar — hepsi renderer'ın desteklediği bloklar. */
  const slashCommands = useMemo(
    () => [
      { label: "Başlık", hint: "Bölüm başlığı (H2)", run: (e: Editor) => e.chain().focus().setNode("heading", { level: 2 }).run() },
      { label: "Alt başlık", hint: "H3", run: (e: Editor) => e.chain().focus().setNode("heading", { level: 3 }).run() },
      { label: "Liste", hint: "Madde işaretli", run: (e: Editor) => e.chain().focus().toggleBulletList().run() },
      { label: "Sıralı liste", hint: "1. 2. 3.", run: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
      { label: "Alıntı", hint: "Vurgulu blok", run: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
      { label: "Paragraf", hint: "Düz metin", run: (e: Editor) => e.chain().focus().setParagraph().run() },
    ],
    [],
  );

  const slashMatches = useMemo(() => {
    if (!slash) return [];
    const q = slash.query.toLocaleLowerCase("tr");
    return q ? slashCommands.filter((c) => c.label.toLocaleLowerCase("tr").includes(q)) : slashCommands;
  }, [slash, slashCommands]);


  /** Seçilen komutu uygular ve yazılan "/sorgu" metnini siler. */
  const runSlash = useCallback(
    (index: number) => {
      if (!editor || !slash) return;
      const command = slashMatches[index];
      if (!command) return;
      const { from } = editor.state.selection;
      const deleteFrom = from - slash.query.length - 1; // "/" + sorgu
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
      command.run(editor);
      setSlash(null);
    },
    [editor, slash, slashMatches],
  );

  /** Klavye: Ctrl/Cmd+K bağlantı, "/" menüsünde ok tuşları ve Enter. */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && editor?.isFocused) {
        e.preventDefault();
        setLinkOpen(true);
        return;
      }
      const count = slashMatches.length;
      if (slash === null || count === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => (i + 1) % count);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((i) => (i - 1 + count) % count);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        runSlash(slashIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSlash(null);
      }
    };
    // Bağımlılıklar değiştikçe dinleyici yeniden bağlanır; menü açıkken birkaç kez olur,
    // maliyeti ihmal edilebilir ve ref senkronizasyonundan çok daha anlaşılır.
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editor, slash, slashMatches.length, slashIndex, runSlash]);

  return (
    <div
      className={
        focusMode
          ? "fixed inset-0 z-[95] flex flex-col overflow-auto bg-cream p-8"
          : "flex flex-col"
      }
    >
      {recovered && (
        <div
          className="mb-3 flex flex-wrap items-center gap-3 rounded border px-3.5 py-2.5"
          style={{ borderColor: "#9C7C4A", background: "rgba(156,124,74,.07)" }}
        >
          <span className="text-[12.5px] text-ink">
            Bu makalenin kaydedilmemiş bir taslağı tarayıcıda duruyor.
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(recovered);
              setRecovered(null);
            }}
            className="rounded bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-cream"
          >
            Taslağı geri yükle
          </button>
          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem(storageKey);
              setRecovered(null);
            }}
            className="rounded border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-muted"
          >
            Yoksay
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded border border-line">
        {/* Sekmeler + araçlar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-[#FAF8F3] px-2 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`rounded px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                view === tab.id ? "bg-ink text-cream" : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {view === "gorsel" && editor && (
            <>
              <span className="mx-1 h-5 w-px bg-line" />
              <ToolButton editor={editor} label="H2" onClick={(e) => e.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} />
              <ToolButton editor={editor} label="H3" onClick={(e) => e.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} />
              <ToolButton editor={editor} label="B" bold onClick={(e) => e.chain().focus().toggleBold().run()} active={editor.isActive("bold")} />
              <ToolButton editor={editor} label="I" italic onClick={(e) => e.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} />
              <ToolButton editor={editor} label="≡" onClick={(e) => e.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} />
              <ToolButton editor={editor} label="1." onClick={(e) => e.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} />
              <ToolButton editor={editor} label="❝" onClick={(e) => e.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} />
              <ToolButton editor={editor} label="🔗" onClick={() => setLinkOpen(true)} active={editor.isActive("link")} />
            </>
          )}

          <span className="ml-auto flex items-center gap-1">
            <SmallButton label="Anahat" active={outlineOpen} onClick={() => setOutlineOpen((v) => !v)} />
            <SmallButton label="Bul" active={findOpen} onClick={() => setFindOpen((v) => !v)} />
            <SmallButton
              label={focusMode ? "Çık" : "Odak"}
              active={focusMode}
              onClick={() => setFocusMode((v) => !v)}
            />
          </span>
        </div>

        {findOpen && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-3 py-2">
            <input
              type="text"
              value={findTerm}
              onChange={(e) => setFindTerm(e.target.value)}
              placeholder="Bul"
              className="h-9 w-40 rounded border border-line px-2.5 text-[12.5px] outline-none focus:border-gold"
            />
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Değiştir"
              className="h-9 w-40 rounded border border-line px-2.5 text-[12.5px] outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={applyFindReplace}
              disabled={!findTerm}
              className="rounded border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-muted hover:border-gold hover:text-gold disabled:opacity-50"
            >
              Tümünü değiştir ({findTerm ? value.split(findTerm).length - 1 : 0})
            </button>
          </div>
        )}

        <div className="flex">
          {outlineOpen && (
            <nav className="w-52 flex-none border-r border-line bg-[#FAF8F3] p-3">
              <p className="m-0 mb-2 font-mono text-[9.5px] tracking-[1.5px] text-muted">ANAHAT</p>
              {outline.length === 0 ? (
                <p className="m-0 text-[11.5px] text-muted">Henüz başlık yok.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {outline.map((h, i) => (
                    <li key={`${i}-${h.text}`} style={{ paddingLeft: h.level === 3 ? 12 : 0 }}>
                      <button
                        type="button"
                        onClick={() => jumpToHeading(h.text)}
                        title={h.text}
                        className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-[11.5px] text-ink transition-colors hover:text-gold"
                      >
                        {h.text}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </nav>
          )}

          <div ref={shellRef} className="relative min-w-0 flex-1">
            {/* Seçim üzerinde beliren hızlı biçim menüsü */}
            {view === "gorsel" && bubble && editor && !slash && (
              <div
                className="absolute z-30 flex -translate-x-1/2 items-center gap-0.5 rounded border border-line bg-ink px-1 py-1 shadow-[0_6px_20px_rgba(28,34,48,0.25)]"
                style={{ top: bubble.top, left: bubble.left }}
              >
                <BubbleButton label="B" bold active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
                <BubbleButton label="I" italic active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
                <BubbleButton label="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
                <BubbleButton label="🔗" active={editor.isActive("link")} onClick={() => setLinkOpen(true)} />
              </div>
            )}

            {/* "/" ile blok ekleme menüsü */}
            {view === "gorsel" && slash && slashMatches.length > 0 && (
              <div
                className="absolute z-30 w-56 overflow-hidden rounded border border-line bg-white shadow-[0_10px_30px_rgba(28,34,48,0.2)]"
                style={{ top: slash.top, left: slash.left }}
              >
                {slashMatches.map((c, i) => (
                  <button
                    key={c.label}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runSlash(i);
                    }}
                    onMouseEnter={() => setSlashIndex(i)}
                    className={`flex w-full items-baseline gap-2 px-3 py-2 text-left transition-colors ${
                      i === slashIndex ? "bg-[#FAF8F3]" : ""
                    }`}
                  >
                    <span className="text-[12.5px] font-semibold text-ink">{c.label}</span>
                    <span className="ml-auto font-mono text-[10px] text-muted">{c.hint}</span>
                  </button>
                ))}
              </div>
            )}

            {generation?.active && generation.startedAt !== null ? (
              <div className="p-3">
                <GenerationOverlay
                  startedAt={generation.startedAt}
                  charCount={generation.charCount}
                  onCancel={generation.onCancel}
                />
              </div>
            ) : (
              <>
            {view === "gorsel" && <EditorContent editor={editor} />}

            {view === "kaynak" && (
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={focusMode ? 30 : 18}
                className="w-full resize-y border-none bg-white px-4 py-4 font-mono text-[13.5px] leading-[1.75] text-ink outline-none"
              />
            )}

            {view === "onizleme" && (
              <div className="bg-white px-6 py-6">
                {value.trim() ? (
                  <ArticleBody markdown={value} />
                ) : (
                  <p className="m-0 text-sm text-muted">Önizlenecek metin yok.</p>
                )}
              </div>
            )}
              </>
            )}
          </div>
        </div>

        {/* Alt bant: gerçek sayaçlar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-[#FAF8F3] px-3 py-2 font-mono text-[10.5px] text-muted">
          <span>{stats.words} kelime</span>
          <span>{stats.minutes} dk okuma</span>
          <span>okunabilirlik {stats.readability.score} · {stats.readability.label}</span>
          {stats.markers > 0 && (
            <button
              type="button"
              onClick={jumpToNextMarker}
              className="font-mono text-[10.5px] font-semibold text-[#A23A32] underline underline-offset-2"
              title="Sıradaki doğrulanacak bilgiye git"
            >
              {stats.markers} doğrulanacak bilgi →
            </button>
          )}
          {warnings.length > 0 && (
            <span className="ml-auto text-[#9C7C4A]" title={warnings.join("\n")}>
              {warnings.length} biçim uyarısı
            </span>
          )}
        </div>
      </div>

      <LinkDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        targets={linkTargets}
        onSelect={insertLink}
      />
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  active,
  editor,
  bold,
  italic,
}: {
  label: string;
  onClick: (editor: Editor) => void;
  active: boolean;
  editor: Editor;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(editor)}
      className={`flex h-[30px] min-w-[32px] items-center justify-center rounded px-1.5 text-[13px] transition-colors ${
        active ? "bg-ink text-cream" : "text-muted hover:bg-white hover:text-ink"
      }`}
      style={{ fontWeight: bold ? 700 : undefined, fontStyle: italic ? "italic" : undefined }}
    >
      {label}
    </button>
  );
}

function BubbleButton({
  label,
  active,
  onClick,
  bold,
  italic,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      // mousedown'da engelle: tıklarken editör odağı ve seçim kaybolmasın.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-[12.5px] transition-colors ${
        active ? "bg-gold text-white" : "text-cream hover:bg-[#2A3242]"
      }`}
      style={{ fontWeight: bold ? 700 : undefined, fontStyle: italic ? "italic" : undefined }}
    >
      {label}
    </button>
  );
}

function SmallButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
        active ? "bg-ink text-cream" : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
