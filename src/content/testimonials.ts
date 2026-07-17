import type { Locale, Localized } from "./types";
import { pick } from "./types";

export type Testimonial = {
  rating: number;
  t: Localized<{ quote: string; author: string }>;
};

export const testimonials: Testimonial[] = [
  {
    rating: 5,
    t: {
      tr: {
        quote:
          "Sürecin her adımında ne olduğunu bilerek ilerledik. Sorularımız hiç yanıtsız kalmadı.",
        author: "A. K. — TİCARET HUKUKU",
      },
    },
  },
  {
    rating: 5,
    t: {
      tr: {
        quote:
          "Dosyamıza gösterilen titizlik gerçekten güven vericiydi. İyi ki kapılarını çalmışız.",
        author: "S. D. — AİLE HUKUKU",
      },
    },
  },
  {
    rating: 5,
    t: {
      tr: {
        quote:
          "Net, sakin ve her zaman ulaşılabilir bir ekip. Tavsiye etmekten çekinmem.",
        author: "M. Y. — SİGORTA HUKUKU",
      },
    },
  },
];

export function localizedTestimonials(locale: Locale) {
  return testimonials.map((item) => ({
    rating: item.rating,
    ...pick(item.t, locale),
  }));
}
