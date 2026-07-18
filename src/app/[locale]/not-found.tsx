import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default async function NotFound() {
  const tNav = await getTranslations("nav");

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <div className="max-w-[560px]">
        <div className="font-mono text-[13px] tracking-[4px] text-gold">HATA 404</div>
        <div className="mt-3 font-serif text-[96px] font-medium leading-none text-ink sm:text-[130px] md:text-[150px]">
          4<span className="text-gold">0</span>4
        </div>
        <div className="mt-6 flex items-center justify-center gap-3.5">
          <span className="relative block h-px w-11 bg-gold">
            <span
              aria-hidden
              className="absolute -top-1 right-[11px] block h-px w-2.5 rotate-[-45deg] bg-gold"
            />
          </span>
        </div>
        <h1 className="mt-6 font-serif text-[28px] font-medium leading-tight text-balance sm:text-[36px]">
          Aradığınız sayfa dosyalarımızda yok.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-pretty text-muted">
          Bağlantı taşınmış ya da hiç var olmamış olabilir. Ama merak etmeyin —
          kaybolan sayfaları da buluruz.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <Button href="/">Ana sayfaya dön</Button>
          <Button href="/iletisim" variant="outline">
            Bize ulaşın
          </Button>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-sm">
          <Link
            href="/calisma-alanlari"
            className="border-b border-line pb-0.5 text-muted hover:border-gold hover:text-gold"
          >
            {tNav("practiceAreas")}
          </Link>
          <Link
            href="/makaleler"
            className="border-b border-line pb-0.5 text-muted hover:border-gold hover:text-gold"
          >
            {tNav("articles")}
          </Link>
          <Link
            href="/sss"
            className="border-b border-line pb-0.5 text-muted hover:border-gold hover:text-gold"
          >
            {tNav("faq")}
          </Link>
        </div>
      </div>
    </Container>
  );
}
