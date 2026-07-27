import type { LocalizedArticle } from "@/content/articles";
import { Card } from "@/components/ui/Card";
import { ArticleCover } from "@/components/site/ArticleCover";

/**
 * Makale kartı ızgarası. Arşiv sayfaları (kategori/etiket) bunu kullanır; makale listesindeki
 * `ArticlesBrowser` filtreleme yüzünden istemci bileşeni olmak zorunda, bu ise sunucuda render
 * edilir — arşivler böylece JS göndermeden tamamen statik kalıyor.
 */
export function ArticleGrid({ articles }: { articles: LocalizedArticle[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <a key={article.slug} href={article.href} className="block text-ink">
          <Card hover className="h-full overflow-hidden">
            <ArticleCover
              size="card"
              category={article.category}
              title={article.title}
              readMinutes={article.readMinutes}
              imageUrl={article.coverImageUrl}
            />
            <div className="p-6">
              <span className="font-mono text-[11px] tracking-[2px] text-gold">
                {article.category}
              </span>
              <h3 className="mt-2.5 text-lg font-semibold leading-[1.4] text-balance">
                {article.title}
              </h3>
              <p className="mt-3 font-mono text-[11.5px] text-muted">
                {article.date} · {article.readMinutes} DK OKUMA
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{article.excerpt}</p>
            </div>
          </Card>
        </a>
      ))}
    </div>
  );
}
