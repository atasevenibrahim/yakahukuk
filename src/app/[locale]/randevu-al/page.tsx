import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RandevuWizard, type DayOption } from "@/components/site/RandevuWizard";
import { getUpcomingDaySlots } from "@/lib/booking";
import { localizedPracticeAreas } from "@/content/practice-areas";
import { getSiteSettings, phoneHref } from "@/lib/site-settings";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/metadata";

// Gerçek zamanlı müsaitlik verisi okuyor (AvailabilityRule/BlockedDate/Appointment) — build
// anında statik olarak dondurulursa slot listesi hiç güncellenmez. Her istekte taze render edilir.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: "Randevu Al", alternates: alternates("/randevu-al", locale as Locale) };
}

export default async function RandevuAlPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [areas, upcoming, settings] = await Promise.all([
    localizedPracticeAreas(locale as Locale),
    getUpcomingDaySlots(5),
    getSiteSettings(),
  ]);
  const areaTitles = areas.map((a) => a.title);

  const dayFmt = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
  });
  const dateFmt = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "short",
  });

  const days: DayOption[] = upcoming.days.map((d) => ({
    dateKey: d.dateKey,
    dayLabel: dayFmt.format(d.date).replace(".", "").toLocaleUpperCase("tr"),
    dateLabel: dateFmt.format(d.date).replace(".", "").toLocaleUpperCase("tr"),
    allSlots: d.allSlots,
    slots: d.slots,
  }));

  return (
    <Container className="max-w-[880px] pb-24 pt-16">
      <div className="text-center">
        <Eyebrow label="RANDEVU" draw center className="animate-rise" />
        <h1 className="mt-5 font-serif text-[40px] font-medium leading-[1.08] text-balance sm:text-[54px]">
          Görüşmeyi planlayalım.
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          Üç adımda randevunuzu oluşturun; talebiniz onaylandığında bilgilendirilirsiniz.
        </p>
      </div>

      {/* Müsaitlik okunamadıysa boş takvim GÖSTERİLMEZ: bu, ziyaretçiye "hiç boş yer yok"
          demek olurdu. Bunun yerine telefona yönlendirilir — talep tamamen kaybolmasın. */}
      {upcoming.degraded ? (
        <div
          className="mt-12 rounded-md border px-6 py-8 text-center"
          style={{ borderColor: "#9C7C4A", background: "rgba(156,124,74,.07)" }}
        >
          <p className="m-0 text-[15px] font-semibold text-ink">
            Çevrimiçi randevu sistemi şu an geçici olarak kullanılamıyor.
          </p>
          <p className="m-0 mt-2.5 text-[14px] leading-relaxed text-muted">
            Teknik bir aksaklık nedeniyle uygun saatleri gösteremiyoruz. Randevunuzu telefonla
            oluşturabilir ya da kısa süre sonra tekrar deneyebilirsiniz.
          </p>
          <a
            href={phoneHref(settings.phone)}
            className="mt-5 inline-block rounded bg-ink px-6 py-3 text-[14px] font-semibold text-cream transition-colors hover:bg-gold"
          >
            {settings.phone}
          </a>
        </div>
      ) : (
        <RandevuWizard
          practiceAreaTitles={areaTitles}
          days={days}
          phone={settings.phone}
          phoneHref={phoneHref(settings.phone)}
        />
      )}
    </Container>
  );
}
