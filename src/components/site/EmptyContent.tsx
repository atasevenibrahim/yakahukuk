/**
 * Genel sayfalarda liste boşken gösterilen blok.
 *
 * Neden var: içerik admin panelinden yönetiliyor ve bir liste tamamen boşaltılabiliyor
 * (ekip üyelerinin hepsi silindiğinde tam olarak bu yaşandı). O durumda sayfa sessizce boş
 * bir ızgara basıyor ve ziyaretçiye site bozukmuş gibi görünüyordu. `ArticlesBrowser`'daki
 * boş-durum kartıyla aynı dil kullanılır.
 */
export function EmptyContent({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-line bg-surface px-8 py-[72px] text-center">
      <span className="inline-block h-[18px] w-[18px] rotate-45 border-[1.5px] border-gold" />
      <p className="mt-5 text-base font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-[420px] text-[14.5px] leading-relaxed text-muted">{text}</p>
    </div>
  );
}
