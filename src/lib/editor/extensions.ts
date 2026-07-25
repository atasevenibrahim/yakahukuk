import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Editörün eklenti yapılandırması.
 *
 * En önemli kısım StarterKit'in KISITLANMASI. Sitenin renderer'ı (`lib/markdown.ts`) kasıtlı
 * olarak dar bir küme basıyor; açık bırakılan her fazladan düğüm, kullanıcının editörde
 * oluşturup sitede kaybolduğunu göreceği içerik demek olurdu. Bu yüzden renderer'ın basmadığı
 * her şey burada kapatılır.
 */

/** `[DOĞRULANACAK: …]` işaretçisi — `lib/ai/citations.ts`'teki desenle aynı. */
const MARKER_RE = /\[DOĞRULANACAK:?[^\]]*\]/g;

/**
 * İşaretçileri editör içinde kırmızı vurgular. Yapay zekanın "bunu bilmiyorum" dediği yerler
 * yazının içinde kaybolmasın diye — yayın kapısı da tam olarak bunlara bakıyor.
 */
export const VerificationMarker = Extension.create({
  name: "verificationMarker",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              for (const match of node.text.matchAll(MARKER_RE)) {
                if (match.index === undefined) continue;
                const from = pos + match.index;
                decorations.push(
                  Decoration.inline(from, from + match[0].length, {
                    class: "yaka-marker",
                  }),
                );
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

/**
 * Renderer'a kısıtlanmış StarterKit.
 *
 * Kapatılanlar ve sebepleri:
 * - `codeBlock` / `code`: renderer kod basmıyor
 * - `horizontalRule`: renderer yatay çizgi basmıyor
 * - `strike` / `underline`: markdown lehçemizde karşılığı yok
 * - `hardBreak`: `parseMarkdown` bir blok içindeki satırları tek paragrafa birleştiriyor,
 *   yani zorla satır sonu sessizce kaybolurdu
 * - başlıklar yalnızca 2 ve 3: sayfadaki h1 makale başlığı
 */
export function buildExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      codeBlock: false,
      code: false,
      horizontalRule: false,
      strike: false,
      underline: false,
      hardBreak: false,
      link: {
        openOnClick: false,
        autolink: false,
        // Renderer'ın `safeHref` kuralıyla aynı: yalnızca site içi yollar ve http(s).
        protocols: ["http", "https"],
        isAllowedUri: (url: string) => /^(\/|#|https?:\/\/)/i.test(url),
      },
    }),
    VerificationMarker,
  ];
}
