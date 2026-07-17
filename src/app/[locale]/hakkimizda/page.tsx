import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Card } from "@/components/ui/Card";
import { Diamond } from "@/components/ui/Diamond";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Reveal } from "@/components/site/Reveal";
import { DarkCTA } from "@/components/site/DarkCTA";
import { localizedTeam } from "@/content/team";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

const arrowLink =
  "border-b border-gold pb-0.5 text-[15px] font-semibold text-gold";

const values = [
  { icon: "diamond" as const, title: "Dik duruş", text: "Masada da salonda da geri adım atmayız; duruşumuz her zaman nettir." },
  { icon: "circle" as const, title: "Gizlilik", text: "Bize emanet edilen her bilgi, meslek sırrı titizliğiyle korunur." },
  { icon: "square" as const, title: "Titizlik", text: "Dilekçeden duruşmaya her ayrıntı, terzi işi bir özenle hazırlanır." },
  { icon: "dot" as const, title: "Şeffaflık", text: "Süreci, riski ve olasılıkları açıkça söyleriz; sürpriz sevmeyiz." },
  { icon: "corner" as const, title: "Ulaşılabilirlik", text: "7/24 ulaşılabiliriz; sorunuz hiçbir zaman yanıtsız kalmaz." },
  { icon: "rounded" as const, title: "Sadelik", text: "Hukuku ağdalı değil, anlaşılır bir dille anlatırız." },
];

const timeline = [
  {
    no: "01",
    title: "Kuruluş",
    year: "[YIL — yer tutucu]",
    text: "Büro, Ankara Beştepe'de kuruldu. [Yer tutucu metin — admin panelinden düzenlenecek.]",
    last: false,
  },
  {
    no: "02",
    title: "Ekibin büyümesi",
    year: "[YIL — yer tutucu]",
    text: "Çalışma alanları çeşitlendi, ekip genişledi. [Yer tutucu metin.]",
    last: false,
  },
  {
    no: "03",
    title: "Bugün",
    year: "2026",
    text: "On iki çalışma alanında, 7/24 ulaşılabilir bir ekiple hizmet veriyoruz.",
    last: true,
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  const t = await getTranslations("nav");
  return { title: t("about"), alternates: alternates("/hakkimizda") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("actions");
  const team = localizedTeam(locale as Locale).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <Container className="pt-20">
        <div className="max-w-[720px]">
          <Eyebrow label="HAKKIMIZDA" draw className="animate-rise" />
          <h1 className="mt-[22px] font-serif text-[40px] font-medium leading-[1.08] text-balance sm:text-[52px] md:text-[60px]">
            Sağlam bir duruşun arkasında, titiz bir ekip.
          </h1>
          <p className="mt-[22px] text-lg leading-relaxed text-pretty text-muted">
            YAKA Hukuk &amp; Danışmanlık, Ankara Beştepe&apos;de müvekkillerine on
            iki çalışma alanında hizmet verir. Bizim için hukuk, güvenin ta
            kendisidir.
          </p>
        </div>
      </Container>

      {/* Hikâyemiz */}
      <Reveal className="pt-24">
        <Container className="grid grid-cols-1 items-center gap-12 md:grid-cols-[0.95fr_1.05fr] md:gap-[72px]">
          <PlaceholderImage
            label="büro / ekip fotoğrafı gelecek"
            className="h-[320px] md:h-[420px]"
          />
          <div>
            <Eyebrow label="HİKÂYEMİZ" />
            <h2 className="mt-[18px] font-serif text-[32px] font-medium leading-[1.15] text-balance sm:text-[40px]">
              Adını bir deyimden alan büro.
            </h2>
            <p className="mt-5 text-base leading-[1.7] text-pretty text-muted">
              Türkçede &quot;yakası düzgün&quot; olmak; dürüst, saygın ve güvenilir
              olmak demektir. Büromuz bu deyimi kendine isim, bu anlayışı kendine
              ilke edindi.{" "}
              <mark className="rounded-[3px] bg-[#EFEAE0] px-1 text-ink">
                [Bu metin yer tutucudur; kuruluş hikâyesi admin panelinden
                düzenlenecektir.]
              </mark>
            </p>
            <p className="mt-4 text-base leading-[1.7] text-pretty text-muted">
              Kurulduğumuz günden bu yana her dosyayı bir terzinin kumaşa
              yaklaştığı özenle ele alıyor; müvekkillerimizin yanında dik, düzgün
              ve ulaşılabilir duruyoruz.
            </p>
          </div>
        </Container>
      </Reveal>

      {/* Vizyon / Misyon */}
      <Reveal className="pt-28">
        <Container className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="p-10">
            <span className="font-mono text-xs tracking-[3px] text-gold">VİZYON</span>
            <h3 className="mt-3.5 font-serif text-[30px] font-medium">
              Güvenin sağlam adresi olmak.
            </h3>
            <p className="mt-3.5 text-[15.5px] leading-[1.7] text-pretty text-muted">
              Ankara&apos;da ve ötesinde, &quot;yakası düzgün hukuk&quot; denince
              akla ilk gelen büro olmak; hukuki desteği herkes için anlaşılır ve
              erişilebilir kılmak.
            </p>
          </Card>
          <Card className="p-10">
            <span className="font-mono text-xs tracking-[3px] text-gold">MİSYON</span>
            <h3 className="mt-3.5 font-serif text-[30px] font-medium">
              Hakkı, titizlikle savunmak.
            </h3>
            <p className="mt-3.5 text-[15.5px] leading-[1.7] text-pretty text-muted">
              Her müvekkilin dosyasını aynı özenle ele almak; süreci şeffaf
              yürütmek, ulaşılabilir kalmak ve hakkı sonuna kadar savunmak.
            </p>
          </Card>
        </Container>
      </Reveal>

      {/* Değerlerimiz */}
      <Reveal className="pt-28">
        <Container>
          <Eyebrow label="DEĞERLERİMİZ" center />
          <h2 className="mb-12 mt-4 text-center font-serif text-[36px] font-medium sm:text-[42px]">
            Bizi biz yapan ilkeler
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <Card key={value.title} hover accent className="p-8">
                <Diamond variant={value.icon} className="mb-5 ml-0.5 mt-0.5" />
                <h3 className="m-0 text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                  {value.text}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </Reveal>

      {/* Geçmişimiz */}
      <Reveal className="pt-28">
        <Container>
          <Eyebrow label="GEÇMİŞİMİZ" />
          <h2 className="mb-12 mt-[18px] font-serif text-[36px] font-medium sm:text-[42px]">
            Yıllar içinde YAKA
          </h2>
          <div className="flex max-w-[760px] flex-col">
            {timeline.map((item) => (
              <div
                key={item.no}
                className="grid grid-cols-[64px_24px_1fr] gap-x-5 sm:grid-cols-[120px_24px_1fr]"
              >
                <span className="pt-0.5 text-right font-mono text-sm text-gold">
                  {item.no}
                </span>
                <span className="flex flex-col items-center">
                  <span
                    className={`mt-1.5 h-[9px] w-[9px] flex-none rotate-45 border-[1.5px] border-gold ${item.last ? "bg-gold" : ""}`}
                  />
                  {!item.last && (
                    <span className="mt-1.5 w-px flex-1 bg-line" />
                  )}
                </span>
                <div className={item.last ? "" : "pb-10"}>
                  <h3 className="m-0 text-lg font-semibold">
                    {item.title}
                    <span className="ml-2 font-mono text-xs font-normal text-muted">
                      {item.year}
                    </span>
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-pretty text-muted">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Reveal>

      {/* Ekip önizleme */}
      <Reveal className="pt-28">
        <Container>
          <div className="mb-9 flex items-end justify-between gap-6">
            <div>
              <Eyebrow label="EKİBİMİZ" />
              <h2 className="mt-[18px] font-serif text-[36px] font-medium leading-[1.15] sm:text-[42px]">
                Dosyanızın arkasındaki isimler
              </h2>
            </div>
            <Link href="/ekip" className={`mb-2 hidden flex-none sm:inline-block ${arrowLink}`}>
              {t("allTeam")}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <Link
                key={member.slug}
                href={{ pathname: "/ekip/[slug]", params: { slug: member.slug } }}
                className="block text-ink"
              >
                <Card hover className="h-full overflow-hidden">
                  <PlaceholderImage
                    label="portre"
                    className="h-[260px] rounded-none border-0 border-b border-line"
                  />
                  <div className="px-6 py-[22px]">
                    <h3 className="font-serif text-2xl font-semibold">
                      {member.name}
                    </h3>
                    <p className="mb-3 mt-1 text-[13.5px] text-muted">
                      {member.roleShort}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line px-2.5 py-1 font-mono text-[10.5px] tracking-[1px] text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Reveal>

      <DarkCTA
        title="Bizi daha yakından tanıyın."
        text="Ön görüşme için randevu oluşturun; ekibimiz aynı gün içinde dönüş yapar."
        buttonLabel={t("book")}
      />
    </>
  );
}
