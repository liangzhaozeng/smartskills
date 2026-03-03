import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Use unique keys per test to avoid state leaking
  });

  it("allows requests within the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = rateLimit(key, { limit: 5 });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks count across multiple calls", () => {
    const key = `test-track-${Date.now()}`;
    rateLimit(key, { limit: 3 });
    rateLimit(key, { limit: 3 });
    const result = rateLimit(key, { limit: 3 });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks requests over the limit", () => {
    const key = `test-block-${Date.now()}`;
    rateLimit(key, { limit: 2 });
    rateLimit(key, { limit: 2 });
    const result = rateLimit(key, { limit: 2 });

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("uses default limit of 60", () => {
    const key = `test-default-${Date.now()}`;
    const result = rateLimit(key);

    expect(result.remaining).toBe(59);
  });
});
