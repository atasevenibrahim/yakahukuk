import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Diamond } from "@/components/ui/Diamond";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Reveal } from "@/components/site/Reveal";
import { DarkCTA } from "@/components/site/DarkCTA";
import { TestimonialsCarousel } from "@/components/site/TestimonialsCarousel";
import { localizedPracticeAreas } from "@/content/practice-areas";
import { localizedArticles } from "@/content/articles";
import { localizedTestimonials } from "@/content/testimonials";
import { site } from "@/content/site";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

const arrowLink =
  "border-b border-gold pb-0.5 text-[15px] font-semibold text-gold";

const values = [
  {
    icon: "diamond" as const,
    title: "Dik duruş",
    text: "Hakkınızı savunurken geri adım atmayız; masada da salonda da duruşumuz nettir.",
  },
  {
    icon: "circle" as const,
    title: "Gizlilik",
    text: "Bize emanet ettiğiniz her bilgi, meslek sırrı titizliğiyle korunur.",
  },
  {
    icon: "square" as const,
    title: "Titizlik",
    text: "Dilekçeden duruşmaya her ayrıntı, terzi işi bir özenle hazırlanır.",
  },
];

const steps = [
  { no: "01", title: "Görüşme", text: "Sizi dinler, dosyanızı ve beklentinizi anlarız." },
  { no: "02", title: "Değerlendirme", text: "Hukuki durumu ve olasılıkları açıkça ortaya koyarız." },
  { no: "03", title: "Strateji", text: "Yol haritasını birlikte belirler, adımları planlarız." },
  { no: "04", title: "Takip", text: "Süreç boyunca sizi düzenli olarak bilgilendiririz." },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  return { alternates: alternates("/") };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("actions");

  const featured = localizedPracticeAreas(locale as Locale).filter(
    (area) => area.featured,
  );
  const articles = localizedArticles(locale as Locale).slice(0, 3);
  const testimonials = localizedTestimonials(locale as Locale);

  return (
    <>
      {/* Hero */}
      <Container className="grid grid-cols-1 items-center gap-12 pt-[88px] md:grid-cols-[1.05fr_0.95fr] md:gap-[72px]">
        <div>
          <Eyebrow label={site.location} draw className="animate-rise" />
          <h1 className="mt-6 font-serif text-[44px] font-medium leading-[1.05] text-balance sm:text-[56px] md:text-[68px]">
            Dik duruş,
            <br />
            dürüst hukuk.
          </h1>
          <p className="mt-6 max-w-[480px] text-lg leading-relaxed text-pretty text-muted">
            YAKA Hukuk &amp; Danışmanlık, hakkınızı sakin ve sağlam bir duruşla
            savunur. Süreci bilerek ilerlersiniz; işin titizliği bize aittir.
          </p>
          <div className="mt-9 flex flex-wrap gap-3.5">
            <Button size="lg">{t("book")}</Button>
            <Button variant="outline" size="lg">
              {t("viewAreas")}
            </Button>
          </div>
        </div>
        <PlaceholderImage
          label="ofis / mimari görsel — fotoğraf gelecek"
          className="h-[360px] md:h-[480px]"
        />
      </Container>

      {/* İstatistik şeridi */}
      <Container className="pt-14">
        <div className="relative border-t border-line">
          <span
            aria-hidden
            className="absolute left-1/2 top-[-4px] h-[7px] w-[7px] -translate-x-1/2 rotate-45 border-b border-r border-gold bg-cream"
          />
          <div className="flex flex-wrap justify-center gap-x-14 gap-y-2 pt-[22px] font-mono text-[13px] tracking-[1.5px] text-muted">
            <span>
              <span className="text-gold">12</span> ÇALIŞMA ALANI
            </span>
            <span className="text-line">·</span>
            <span>{site.location}</span>
            <span className="text-line">·</span>
            <span>
              <span className="text-gold">7/24</span> ULAŞILABİLİR
            </span>
          </div>
        </div>
      </Container>

      {/* YAKA kimdir */}
      <Reveal className="pt-28">
        <Container className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20">
          <div>
            <Eyebrow label="YAKA KİMDİR" />
            <h2 className="mt-5 font-serif text-[36px] font-medium leading-[1.15] text-balance sm:text-[42px]">
              Yakası düzgün bir hukuk anlayışı.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-pretty text-muted">
              Adımızı, dürüstlüğün ve saygınlığın halk dilindeki karşılığından
              alıyoruz. Ankara Beştepe&apos;deki büromuzda her dosyaya aynı terzi
              titizliğiyle yaklaşır, müvekkilimizin yanında dik ve düzgün dururuz.
            </p>
            <Link href="/hakkimizda" className={`mt-6 inline-block ${arrowLink}`}>
              {t("aboutMore")}
            </Link>
          </div>
          <div className="flex flex-col gap-7">
            {values.map((value, index) => (
              <div key={value.title}>
                {index > 0 && <div className="mb-7 border-t border-line" />}
                <div className="flex items-start gap-5">
                  <Diamond variant={value.icon} className="mt-1.5" />
                  <div>
                    <h3 className="m-0 text-lg font-semibold">{value.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                      {value.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Reveal>

      {/* Öne çıkan çalışma alanları */}
      <Reveal className="pt-28">
        <Container>
          <div className="mb-9 flex items-end justify-between gap-6">
            <div>
              <Eyebrow label="ÇALIŞMA ALANLARI" />
              <h2 className="mt-4 font-serif text-[36px] font-medium leading-[1.15] sm:text-[42px]">
                Öne çıkan alanlarımız
              </h2>
            </div>
            <a href="#" className={`mb-2 hidden flex-none sm:inline-block ${arrowLink}`}>
              {t("allAreasLink")}
            </a>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((area) => (
              <a key={area.slug} href={area.href} className="block text-ink">
                <Card hover accent className="h-full p-7">
                  <Diamond variant={area.icon} className="mb-5 ml-0.5 mt-0.5" />
                  <h3 className="m-0 text-[19px] font-semibold">{area.title}</h3>
                  <p className="mb-4 mt-2 text-[14.5px] leading-relaxed text-muted">
                    {area.excerpt}
                  </p>
                  <span className="text-sm font-semibold text-gold">
                    {t("details")}
                  </span>
                </Card>
              </a>
            ))}
          </div>
        </Container>
      </Reveal>

      {/* Çalışma sürecimiz */}
      <Reveal className="pt-28">
        <Container>
          <Eyebrow label="ÇALIŞMA SÜRECİMİZ" center />
          <h2 className="mb-12 mt-4 text-center font-serif text-[36px] font-medium sm:text-[42px]">
            Nasıl çalışırız?
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.no} className="border-t border-line pt-6">
                <span className="font-mono text-[13px] tracking-[2px] text-gold">
                  {step.no}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Reveal>

      {/* Makaleler */}
      <Reveal className="pt-28">
        <Container>
          <div className="mb-9 flex items-end justify-between gap-6">
            <div>
              <Eyebrow label="MAKALELER" />
              <h2 className="mt-4 font-serif text-[36px] font-medium leading-[1.15] sm:text-[42px]">
                Güncel yazılarımız
              </h2>
            </div>
            <a href="#" className={`mb-2 hidden flex-none sm:inline-block ${arrowLink}`}>
              {t("allArticles")}
            </a>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <a key={article.slug} href={article.href} className="block text-ink">
                <Card hover className="h-full overflow-hidden">
                  <PlaceholderImage
                    label="kapak görseli"
                    className="h-[170px] rounded-none border-0 border-b border-line"
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
                    <p className="mt-2.5 text-sm leading-relaxed text-muted">
                      {article.excerpt}
                    </p>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </Container>
      </Reveal>

      {/* Müvekkil yorumları */}
      <Reveal className="pt-28">
        <Container className="max-w-[840px] text-center">
          <Eyebrow label="MÜVEKKİL YORUMLARI" center />
          <TestimonialsCarousel items={testimonials} />
        </Container>
      </Reveal>

      <DarkCTA
        title="Hakkınız için ilk adımı atın."
        text="Ön görüşme için randevu oluşturun; ekibimiz aynı gün içinde dönüş yapar."
        buttonLabel={t("book")}
      />
    </>
  );
}
