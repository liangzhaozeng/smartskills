import { describe, it, expect, vi } from "vitest";

// Mock redis as unavailable to test memory fallback
vi.mock("./redis", () => ({
  redis: null,
}));

const { rateLimit } = await import("./rate-limit");

describe("rateLimit (memory fallback)", () => {
  it("allows requests within the limit", async () => {
    const key = `test-allow-${Date.now()}`;
    const result = await rateLimit(key, { limit: 5 });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks count across multiple calls", async () => {
    const key = `test-track-${Date.now()}`;
    await rateLimit(key, { limit: 3 });
    await rateLimit(key, { limit: 3 });
    const result = await rateLimit(key, { limit: 3 });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks requests over the limit", async () => {
    const key = `test-block-${Date.now()}`;
    await rateLimit(key, { limit: 2 });
    await rateLimit(key, { limit: 2 });
    const result = await rateLimit(key, { limit: 2 });

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("uses default limit of 60", async () => {
    const key = `test-default-${Date.now()}`;
    const result = await rateLimit(key);

    expect(result.remaining).toBe(59);
  });
});
