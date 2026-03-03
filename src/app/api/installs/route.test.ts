import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../../../__tests__/setup";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => Promise.resolve({ success: true, remaining: 29 }),
  getRateLimitKey: () => "test-ip",
}));

const { POST } = await import("./route");

function createRequest(body: object) {
  return new Request("http://localhost:3000/api/installs", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/installs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when skillSlug is missing", async () => {
    const response = await POST(createRequest({ source: "CLI" }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when source is missing", async () => {
    const response = await POST(createRequest({ skillSlug: "test" }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when source is invalid", async () => {
    const response = await POST(createRequest({ skillSlug: "test", source: "INVALID" }));

    expect(response.status).toBe(400);
  });

  it("returns 404 when skill not found", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue(null);

    const response = await POST(createRequest({ skillSlug: "nonexistent", source: "CLI" }));

    expect(response.status).toBe(404);
  });

  it("creates install event and increments installCount atomically for CLI source", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1" });
    mockPrisma.installEvent.create.mockResolvedValue({});
    mockPrisma.skill.update.mockResolvedValue({});

    const response = await POST(
      createRequest({ skillSlug: "test-skill", source: "CLI" })
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.installEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          skillId: "s1",
          source: "CLI",
          userId: null,
        }),
      })
    );
    expect(mockPrisma.skill.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { installCount: { increment: 1 } },
    });
  });

  it("increments clickCount for WEB_CLICK source", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1" });
    mockPrisma.installEvent.create.mockResolvedValue({});
    mockPrisma.skill.update.mockResolvedValue({});

    await POST(createRequest({ skillSlug: "test-skill", source: "WEB_CLICK" }));

    expect(mockPrisma.skill.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { clickCount: { increment: 1 } },
    });
  });

  it("records userId when provided", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1" });
    mockPrisma.installEvent.create.mockResolvedValue({});
    mockPrisma.skill.update.mockResolvedValue({});

    await POST(
      createRequest({ skillSlug: "test-skill", source: "CLI", userId: "user-1" })
    );

    expect(mockPrisma.installEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1" }),
      })
    );
  });

  it("sets userId to null when not provided", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1" });
    mockPrisma.installEvent.create.mockResolvedValue({});
    mockPrisma.skill.update.mockResolvedValue({});

    await POST(createRequest({ skillSlug: "test-skill", source: "CLI" }));

    expect(mockPrisma.installEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: null }),
      })
    );
  });
});
