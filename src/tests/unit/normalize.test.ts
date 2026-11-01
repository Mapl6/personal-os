import { describe, expect, it } from "vitest";
import { normalize, normalizeWithMap, terms } from "@/lib/text/normalize";

describe("normalize", () => {
  it("ignores ZWNJ so half-spaced words match", () => {
    expect(normalize("می‌خوانم")).toBe(normalize("میخوانم"));
    expect(normalize("کتاب‌ها")).toBe("کتابها");
  });
  it("maps Arabic letter forms to Persian", () => {
    expect(normalize("كتاب علي")).toBe("کتاب علی");
    expect(normalize("مدرسة")).toBe("مدرسه");
    expect(normalize("أحمد إيران آب")).toBe("احمد ایران اب");
  });
  it("drops diacritics and tatweel", () => {
    expect(normalize("كَتَبَ")).toBe("کتب");
    expect(normalize("خـــوب")).toBe("خوب");
    expect(normalize("Café Ünïcode")).toBe("cafe unicode");
  });
  it("unifies digits", () => {
    expect(normalize("۱۴۰۵")).toBe("1405");
    expect(normalize("٢٠٢٦")).toBe("2026");
  });
  it("maps output back to input positions", () => {
    const input = "می‌خوانم";
    const { text, map } = normalizeWithMap(input);
    const at = text.indexOf("خوان");
    expect(input.slice(map[at], map[at + 3] + 1)).toBe("خوان");
  });
  it("splits terms", () => {
    expect(terms("  Read  کتاب‌ها ")).toEqual(["read", "کتابها"]);
  });
});
