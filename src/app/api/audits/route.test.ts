import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../../../__tests__/setup";

const { GET } = await import("./route");

function createRequest(url: string) {
  return new Request(
    url.startsWith("http") ? url : `http://localhost:3000${url}`
  ) as unknown as import("next/server").NextRequest;
}

describe("GET /api/audits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated audits with defaults (page 1, limit 20)", async () => {
    const audits = [{ id: "a1", action: "PUBLISH" }];
    mockPrisma.auditLog.findMany.mockResolvedValue(audits);
    mockPrisma.auditLog.count.mockResolvedValue(1);

    const response = await GET(createRequest("/api/audits"));
    const data = await response.json();

    expect(data.audits).toEqual(audits);
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(20);
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
      })
    );
  });

  it("supports custom page and limit", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(50);

    const response = await GET(createRequest("/api/audits?page=3&limit=10"));
    const data = await response.json();

    expect(data.page).toBe(3);
    expect(data.limit).toBe(10);
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20, // (3-1) * 10
        take: 10,
      })
    );
  });

  it("filters by valid action when provided", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    await GET(createRequest("/api/audits?action=PUBLISH"));

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { action: "PUBLISH" },
      })
    );
  });

  it("returns 400 for invalid action filter", async () => {
    const response = await GET(createRequest("/api/audits?action=INVALID"));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid action filter");
  });

  it("uses empty where when no action filter", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    await GET(createRequest("/api/audits"));

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    );
  });

  it("orders by timestamp descending", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    await GET(createRequest("/api/audits"));

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { timestamp: "desc" },
      })
    );
  });

  it("includes user and skill relations", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);

    await GET(createRequest("/api/audits"));

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          user: { select: { name: true, image: true } },
          skill: { select: { name: true, slug: true } },
        },
      })
    );
  });
});
