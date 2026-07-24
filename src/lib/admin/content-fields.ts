/** Admin İçerik'in jenerik liste+form ekranını süren alan tanımları. */
export type FieldKind = "text" | "textarea" | "lines" | "select" | "number";

export type FieldOption = { value: string; label: string };

export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  localized: boolean;
  options?: FieldOption[];
  rows?: number;
  hint?: string;
  readOnly?: boolean;
};

/** Çok satırlı metni boş satırları atarak dizeye çevirir (ör. paragraf/etiket listesi). */
export function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function arrayToLines(items: string[]): string {
  return items.join("\n");
}

/** "dönem — açıklama" satırlarını { period, text } dizisine çevirir (Ekip → Eğitim). */
export function linesToEducation(text: string): { period: string; text: string }[] {
  return linesToArray(text).map((line) => {
    const idx = line.indexOf("—");
    if (idx === -1) return { period: "", text: line };
    return { period: line.slice(0, idx).trim(), text: line.slice(idx + 1).trim() };
  });
}

export function educationToLines(items: { period: string; text: string }[]): string {
  return items.map((e) => (e.period ? `${e.period} — ${e.text}` : e.text)).join("\n");
}

/** "no | başlık | metin" satırlarını { no, title, text } dizisine çevirir (Yasal → Maddeler). */
export function linesToSections(
  text: string,
): { no: string; title: string; text: string }[] {
  return linesToArray(text).map((line, i) => {
    const parts = line.split("|").map((p) => p.trim());
    return {
      no: parts[0] || String(i + 1).padStart(2, "0"),
      title: parts[1] || "",
      text: parts.slice(2).join("|").trim(),
    };
  });
}

export function sectionsToLines(items: { no: string; title: string; text: string }[]): string {
  return items.map((s) => `${s.no} | ${s.title} | ${s.text}`).join("\n");
}
