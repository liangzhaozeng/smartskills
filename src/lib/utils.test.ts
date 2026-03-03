import { describe, it, expect } from "vitest";
import { formatCount, hotScore } from "./utils";

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

  it("rounds up to M at the K/M boundary", () => {
    expect(formatCount(999_950)).toBe("1.0M");
    expect(formatCount(999_999)).toBe("1.0M");
    expect(formatCount(1_000_000)).toBe("1.0M");
  });

  it("keeps K suffix below the rounding threshold", () => {
    expect(formatCount(999_949)).toBe("999.9K");
  });

  it("handles negative numbers", () => {
    expect(formatCount(-1)).toBe("-1");
    expect(formatCount(-1000)).toBe("-1000");
  });
});

describe("hotScore", () => {
  it("returns higher score for newer skills with same installs", () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 24 * 3600000);

    const scoreNew = hotScore(10, oneHourAgo);
    const scoreOld = hotScore(10, oneDayAgo);

    expect(scoreNew).toBeGreaterThan(scoreOld);
  });

  it("returns higher score for more installs at same age", () => {
    const created = new Date(Date.now() - 3600000);

    const scoreMany = hotScore(100, created);
    const scoreFew = hotScore(10, created);

    expect(scoreMany).toBeGreaterThan(scoreFew);
  });

  it("returns 0 when there are no installs", () => {
    expect(hotScore(0, new Date())).toBe(0);
  });

  it("accepts string dates", () => {
    const score = hotScore(10, new Date().toISOString());
    expect(score).toBeGreaterThan(0);
  });
});
