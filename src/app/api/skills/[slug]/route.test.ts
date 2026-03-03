import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, mockGetServerSession } from "../../../../__tests__/setup";

const { GET, PUT, DELETE } = await import("./route");

function createRequest(url: string, options?: RequestInit) {
  return new Request(
    url.startsWith("http") ? url : `http://localhost:3000${url}`,
    options
  ) as unknown as import("next/server").NextRequest;
}

function createContext(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("GET /api/skills/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns skill with author and files when found", async () => {
    const skill = {
      id: "s1",
      slug: "test-skill",
      name: "Test Skill",
      author: { id: "u1", name: "Author", image: null },
      files: [],
    };
    mockPrisma.skill.findUnique.mockResolvedValue(skill);

    const response = await GET(createRequest("/api/skills/test-skill"), createContext("test-skill"));
    const data = await response.json();

    expect(data.slug).toBe("test-skill");
    expect(data.author).toBeDefined();
  });

  it("returns 404 when skill not found", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue(null);

    const response = await GET(createRequest("/api/skills/nonexistent"), createContext("nonexistent"));

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Skill not found");
  });
});

describe("PUT /api/skills/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await PUT(
      createRequest("/api/skills/test", { method: "PUT", body: JSON.stringify({}) }),
      createContext("test")
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when skill not found", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue(null);

    const response = await PUT(
      createRequest("/api/skills/nonexistent", { method: "PUT", body: JSON.stringify({}) }),
      createContext("nonexistent")
    );

    expect(response.status).toBe(404);
  });

  it("returns 403 when user is neither author nor admin", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u2", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", authorId: "u1" });

    const response = await PUT(
      createRequest("/api/skills/test", { method: "PUT", body: JSON.stringify({}) }),
      createContext("test")
    );

    expect(response.status).toBe(403);
  });

  it("allows author to update their own skill", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", authorId: "u1" });
    mockPrisma.skill.update.mockResolvedValue({ id: "s1", name: "Updated" });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const response = await PUT(
      createRequest("/api/skills/test", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      }),
      createContext("test")
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.skill.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Updated" }),
      })
    );
  });

  it("allows admin to update any skill", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u2", role: "ADMIN" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", authorId: "u1" });
    mockPrisma.skill.update.mockResolvedValue({ id: "s1" });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const response = await PUT(
      createRequest("/api/skills/test", {
        method: "PUT",
        body: JSON.stringify({ description: "new desc" }),
      }),
      createContext("test")
    );

    expect(response.status).toBe(200);
  });

  it("only admin can set verified field", async () => {
    // Non-admin author tries to verify
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", authorId: "u1" });
    mockPrisma.skill.update.mockResolvedValue({ id: "s1" });
    mockPrisma.auditLog.create.mockResolvedValue({});

    await PUT(
      createRequest("/api/skills/test", {
        method: "PUT",
        body: JSON.stringify({ verified: true }),
      }),
      createContext("test")
    );

    // verified should NOT be in the update data for non-admin
    const updateCall = mockPrisma.skill.update.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("verified");
  });

  it("admin can set verified field", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u2", role: "ADMIN" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", authorId: "u1" });
    mockPrisma.skill.update.mockResolvedValue({ id: "s1" });
    mockPrisma.auditLog.create.mockResolvedValue({});

    await PUT(
      createRequest("/api/skills/test", {
        method: "PUT",
        body: JSON.stringify({ verified: true }),
      }),
      createContext("test")
    );

    const updateCall = mockPrisma.skill.update.mock.calls[0][0];
    expect(updateCall.data).toHaveProperty("verified", true);
  });

  it("creates VERIFY audit action when verified field is present", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u2", role: "ADMIN" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", authorId: "u1" });
    mockPrisma.skill.update.mockResolvedValue({ id: "s1" });
    mockPrisma.auditLog.create.mockResolvedValue({});

    await PUT(
      createRequest("/api/skills/test", {
        method: "PUT",
        body: JSON.stringify({ verified: true }),
      }),
      createContext("test")
    );

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "VERIFY" }),
      })
    );
  });

  it("creates UPDATE audit action for normal updates", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", authorId: "u1" });
    mockPrisma.skill.update.mockResolvedValue({ id: "s1" });
    mockPrisma.auditLog.create.mockResolvedValue({});

    await PUT(
      createRequest("/api/skills/test", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      }),
      createContext("test")
    );

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "UPDATE" }),
      })
    );
  });
});

describe("DELETE /api/skills/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await DELETE(createRequest("/api/skills/test"), createContext("test"));

    expect(response.status).toBe(401);
  });

  it("returns 404 when skill not found", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue(null);

    const response = await DELETE(createRequest("/api/skills/test"), createContext("test"));

    expect(response.status).toBe(404);
  });

  it("returns 403 when user is neither author nor admin", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u2", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", authorId: "u1", name: "Test" });

    const response = await DELETE(createRequest("/api/skills/test"), createContext("test"));

    expect(response.status).toBe(403);
  });

  it("allows author to delete their skill", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", authorId: "u1", name: "Test" });
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockPrisma.skill.delete.mockResolvedValue({});

    const response = await DELETE(createRequest("/api/skills/test"), createContext("test"));
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "DELETE" }),
      })
    );
    expect(mockPrisma.skill.delete).toHaveBeenCalledWith({ where: { id: "s1" } });
  });

  it("allows admin to delete any skill", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u2", role: "ADMIN" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "s1", authorId: "u1", name: "Test" });
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockPrisma.skill.delete.mockResolvedValue({});

    const response = await DELETE(createRequest("/api/skills/test"), createContext("test"));

    expect(response.status).toBe(200);
  });
});
