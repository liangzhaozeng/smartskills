import { describe, it, expect } from "vitest";
import { formatCount } from "./utils";

describe("formatCount", () => {
  it("returns plain number for values under 1000", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1)).toBe("1");
    expect(formatCount(42)).toBe("42");
    expect(formatCount(999)).toBe("999");
  });

  it("formats thousands with K suffix", () => {
    expect(formatCount(1000)).toBe("1.0K");
    expect(formatCount(1500)).toBe("1.5K");
    expect(formatCount(10000)).toBe("10.0K");
    expect(formatCount(99900)).toBe("99.9K");
  });

  it("formats millions with M suffix", () => {
    expect(formatCount(1_000_000)).toBe("1.0M");
    expect(formatCount(1_500_000)).toBe("1.5M");
    expect(formatCount(10_000_000)).toBe("10.0M");
  });

  it("handles the K/M boundary correctly", () => {
    // 999,999 should still show as K (not yet a million)
    expect(formatCount(999_999)).toBe("1000.0K");
    // 1,000,000 is the first M value
    expect(formatCount(1_000_000)).toBe("1.0M");
  });

  it("handles negative numbers", () => {
    // Negative numbers fall through to toString
    expect(formatCount(-1)).toBe("-1");
    expect(formatCount(-1000)).toBe("-1000");
  });
});
