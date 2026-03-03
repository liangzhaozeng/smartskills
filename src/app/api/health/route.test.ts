import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../../../__tests__/setup";

const { GET } = await import("./route");

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns healthy when database is reachable", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks.database).toBe("healthy");
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });

  it("returns unhealthy when database is unreachable", async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error("Connection refused"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.database).toBe("unhealthy");
  });

  it("reports redis as not_configured when no REDIS_URL", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(data.checks.redis).toBe("not_configured");
  });

  it("includes pod and node metadata", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty("pod");
    expect(data).toHaveProperty("node");
    expect(data).toHaveProperty("uptime");
  });
});
