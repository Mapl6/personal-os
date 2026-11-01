/**
 * Search normalisation for mixed Persian / Arabic / English text.
 *
 * - Arabic letter variants → Persian (ي ى → ی, ك → ک, ة → ه, ۀ → ه, ؤ → و, أ إ آ ٱ → ا)
 * - diacritics (harakat, superscript alef, Latin accents) and tatweel removed
 * - zero-width non-joiner / joiner and other format characters removed,
 *   so "می‌خوانم" and "میخوانم" match
 * - Persian and Arabic-Indic digits → ASCII, so "۱۴۰۵" and "1405" match
 * - case folded
 *
 * `normalizeWithMap` also returns, for every output character, the index of
 * the input character it came from, so matches can be highlighted in the
 * original text.
 */

const LETTERS: Record<string, string> = {
  "ي": "ی",
  "ى": "ی",
  "ئ": "ی",
  "ك": "ک",
  "ة": "ه",
  "ۀ": "ه",
  "ؤ": "و",
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
};

// U+064B–U+065F harakat, U+0670 superscript alef, U+06D6–U+06ED Quranic marks, U+0640 tatweel.
const DROP = /[ً-ٰٟۖ-ۭـ​-‏‪-‮⁦-⁩﻿]/;
const COMBINING = /[̀-ͯ]/;

function digit(ch: string): string | null {
  const c = ch.charCodeAt(0);
  if (c >= 0x06f0 && c <= 0x06f9) return String(c - 0x06f0);
  if (c >= 0x0660 && c <= 0x0669) return String(c - 0x0660);
  return null;
}

export function normalizeWithMap(input: string): { text: string; map: number[] } {
  let text = "";
  const map: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (DROP.test(ch)) continue;
    let out = LETTERS[ch] ?? digit(ch);
    if (out == null) {
      // Latin accents: é → e. Decompose and drop combining marks.
      out = ch.normalize("NFD");
      if (out.length > 1) out = [...out].filter((c) => !COMBINING.test(c)).join("");
      else if (COMBINING.test(out)) continue;
      out = out.toLowerCase();
    }
    for (const o of out) {
      text += o;
      map.push(i);
    }
  }
  return { text, map };
}

export function normalize(input: string): string {
  return normalizeWithMap(input).text;
}

/** Splits a query into normalised terms (whitespace separated, empty dropped). */
export function terms(query: string): string[] {
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean);
}
