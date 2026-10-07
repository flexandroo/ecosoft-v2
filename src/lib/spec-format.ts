// Display normalisation for product characteristics imported from the Ecosoft
// export. The data itself is free text with mixed conventions (°C written with a
// Cyrillic "С", "м3", "1.5" vs "1,5", "55‒65" vs "150 - 160", lowercase values,
// repeated rows); this module only unifies how it is shown. It never changes the
// meaning of a value. scripts/audit-specs.mjs reports what still needs fixing
// in the data itself.

export type Spec = { label: string; value: string };

const NUM = String.raw`\d+(?:[.,]\d+)?`;

function tidy(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/℃/g, "°C")
    .replace(/°\s*[СC](?![a-zа-яіїєґ])/gi, "°C") // Cyrillic С → Latin C
    .replace(/(?<![a-zа-яіїєґ])м([23])(?=$|[\s,./)])/gi, (_, d: string) => (d === "3" ? "м³" : "м²"))
    .trim();
}

/** Characteristic name in one spelling ("Температура води, °С" → "…, °C", trailing "*" dropped). */
export function formatSpecLabel(label: string): string {
  return tidy(label).replace(/\s*\*+$/, "").replace(/\s+,/g, ",");
}

/** Characteristic value with unified ranges, decimal commas and sentence case. */
export function formatSpecValue(value: string): string {
  let v = tidy(value);
  // Ranges: "55‒65", "150 - 160", "70–75" → "55–65".
  v = v.replace(new RegExp(`(${NUM})\\s*[-‒–—]\\s*(${NUM})`, "g"), "$1–$2");
  // Pairs such as working/maximum: "1,0 / 1,2" → "1,0/1,2".
  v = v.replace(new RegExp(`(${NUM})\\s*/\\s*(${NUM})`, "g"), "$1/$2");
  // Decimal point → comma (Ukrainian convention), only between digits.
  v = v.replace(/(\d)\.(\d)/g, "$1,$2");
  // Sentence case for words ("під мийкою" → "Під мийкою"); units like "л/хв" stay as they are.
  if (/^[а-яіїєґ]/.test(v) && !/^(л|мл|мм|см|кг|г|шт|мкм|бар|год|хв)(?![а-яіїєґ])/.test(v)) v = v[0].toUpperCase() + v.slice(1);
  return v;
}

/** Specs ready to display: normalised text, empty rows and repeated names dropped. */
export function formatSpecs(specs: Spec[] | undefined): Spec[] {
  const seen = new Set<string>();
  const out: Spec[] = [];
  for (const spec of specs ?? []) {
    const label = formatSpecLabel(spec.label);
    const value = formatSpecValue(String(spec.value ?? ""));
    const key = label.toLowerCase();
    if (!label || !value || seen.has(key)) continue;
    seen.add(key);
    out.push({ label, value });
  }
  return out;
}
