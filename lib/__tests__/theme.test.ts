import { describe, it, expect } from "vitest";
import { getTheme } from "../theme";

describe("getTheme", () => {
  describe("day mode", () => {
    const theme = getTheme(false);

    it("returns night: false", () => {
      expect(theme.night).toBe(false);
    });

    it("uses white RGB", () => {
      expect(theme.rgb).toBe("255,255,255");
    });

    it("tint returns rgba with white", () => {
      expect(theme.tint(1)).toBe("rgba(255,255,255,1)");
      expect(theme.tint(0.5)).toBe("rgba(255,255,255,0.5)");
      expect(theme.tint(0)).toBe("rgba(255,255,255,0)");
    });
  });

  describe("night mode", () => {
    const theme = getTheme(true);

    it("returns night: true", () => {
      expect(theme.night).toBe(true);
    });

    it("uses red RGB", () => {
      expect(theme.rgb).toBe("180,40,20");
    });

    it("tint returns rgba with red", () => {
      expect(theme.tint(1)).toBe("rgba(180,40,20,1)");
      expect(theme.tint(0.5)).toBe("rgba(180,40,20,0.5)");
    });

    it("has no blue component", () => {
      const [, , b] = theme.rgb.split(",").map(Number);
      expect(b).toBeLessThan(50);
    });
  });
});
