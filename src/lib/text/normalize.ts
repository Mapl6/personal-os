/**
 * Persian-aware text normalisation for full-text search.
 *
 * All text is normalised the same way before indexing and before querying,
 * so that Arabic-script variants, diacritics and digit scripts match.
 */

const ARABIC_TO_PERSIAN: Record<string, string> = {
  "ى": "ی",
  "ي": "ی",
  "ك": "ک",
  "ة": "ه",
  "ە": "ه", // U+06D5 (NFKD of ۀ) → ه
  "ؤ": "و",
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Zero-width non-joiner. */
export const ZWNJ = "‌";

function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const p = PERSIAN_DIGITS.indexOf(d);
    if (p >= 0) return String(p);
    return String(ARABIC_DIGITS.indexOf(d));
  });
}

/**
 * Normalise text for search: Arabic letters → Persian, diacritics/tatweel
 * removed, digits unified to Latin, Latin lowercased with accents stripped.
 */
export function normalizeText(input: string): string {
  // NFKD first: split precomposed characters (e.g. ئ → ي + hamza above)
  // so letter mapping and diacritic removal see the decomposed parts.
  let out = input.normalize("NFKD");
  // Arabic → Persian letters (ى = alef maksura U+0649)
out = out.replace(/[يكىةەؤأإآ]/g, (ch) => ARABIC_TO_PERSIAN[ch] ?? ch);
  // Remove diacritics (Arabic harakat) and tatweel (kashida)
  out = out.replace(/[ً-ٰٟـ]/g, "");
  // Digits → Latin
  out = toLatinDigits(out);
  // Latin: lowercase + strip accents (NFKD already applied above)
  out = out.replace(/[̀-ͯ]/g, "").toLowerCase();
  return out;
}

/**
 * Return both the joined and space-split forms of words containing a
 * zero-width non-joiner, e.g. "می‌خوانم" → ["میخوانم", "می خوانم"].
 */
export function zwnjVariants(input: string): [joined: string, split: string] {
  const joined = input.split(ZWNJ).join("");
  const split = input.split(ZWNJ).join(" ");
  return [joined, split];
}
