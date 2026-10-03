import { describe, expect, it } from "vitest";
import { normalizeText } from "@/lib/text/normalize";

describe("normalizeText NFKD-first hamza splitting", () => {
  it("splits precomposed hamza forms before mapping", () => {
    // ئ (U+0626) → ي + hamza above: yeh maps to ی, loose hamza is removed.
    expect(normalizeText("مس\u0626له")).toBe("مس\u06CCله");
    // ۀ (U+06C0) → U+06D5 + hamza above: loose hamza is removed.
    expect(normalizeText("خان\u06C0")).toBe("خان\u0647"); // ۀ → ه, search mein match karega
  });

  it("maps alef maksura to Persian yeh", () => {
    expect(normalizeText("عل\u0649")).toBe("عل\u06CC");
  });
});
