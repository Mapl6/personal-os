import { describe, expect, it } from "vitest";
import { normalizeText, zwnjVariants } from "@/lib/text/normalize";

describe("normalizeText", () => {
  it("maps Arabic letters to Persian", () => {
    expect(normalizeText("علي")).toBe("علی");
    expect(normalizeText("كتاب")).toBe("کتاب");
    expect(normalizeText("مدرسة")).toBe("مدرسه");
    expect(normalizeText("مؤمن")).toBe("مومن");
    expect(normalizeText("أحمد")).toBe("احمد");
  });

  it("removes diacritics and tatweel", () => {
    expect(normalizeText("کِتاب")).toBe("کتاب");
    expect(normalizeText("کـتاب")).toBe("کتاب");
  });

  it("unifies Persian and Arabic digits to Latin", () => {
    expect(normalizeText("۱۴۰۵")).toBe("1405");
    expect(normalizeText("١٤٠٥")).toBe("1405");
  });

  it("lowercases Latin and strips accents", () => {
    expect(normalizeText("Café AU LAIT")).toBe("cafe au lait");
  });

  it("leaves plain Persian untouched", () => {
    expect(normalizeText("سلام دنیا")).toBe("سلام دنیا");
  });
});

describe("zwnjVariants", () => {
  it("returns joined and space-split forms", () => {
    expect(zwnjVariants("می‌خوانم")).toEqual(["میخوانم", "می خوانم"]);
  });

  it("is a no-op without a zero-width non-joiner", () => {
    expect(zwnjVariants("کتاب")).toEqual(["کتاب", "کتاب"]);
  });
});
