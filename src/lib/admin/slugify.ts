const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i",
  İ: "i", i: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
};

/** Türkçe karakterleri sadeleştirip URL/slug-güvenli bir metin üretir. */
export function slugify(input: string): string {
  const ascii = input
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("");
  return ascii
    .toLocaleLowerCase("en-US")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "kayit";
}

/** Verilen taban slug bir listede zaten varsa -2, -3 ... ekleyerek benzersizleştirir. */
export function uniqueSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}
