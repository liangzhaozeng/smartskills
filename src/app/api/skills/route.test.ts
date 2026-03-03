import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, mockGetServerSession } from "../../../__tests__/setup";

// Mock slugify
vi.mock("slugify", () => ({
  default: (str: string, opts?: { lower?: boolean; strict?: boolean }) => {
    let s = str;
    if (opts?.lower) s = s.toLowerCase();
    if (opts?.strict) s = s.replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
    return s.replace(/\s+/g, "-");
  },
}));

vi.mock("@/lib/validations", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/validations")>();
  return mod;
});

const { GET, POST } = await import("./route");

function createRequest(url: string, options?: RequestInit) {
  return new Request(url.startsWith("http") ? url : `http://localhost:3000${url}`, options) as unknown as import("next/server").NextRequest;
}

describe("GET /api/skills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns skills sorted by installCount (all-time) by default", async () => {
    const skills = [{ id: "1", name: "Skill A", installCount: 100 }];
    mockPrisma.skill.findMany.mockResolvedValue(skills);
    mockPrisma.skill.count.mockResolvedValue(1);

    const response = await GET(createRequest("/api/skills"));
    const data = await response.json();

    expect(data.skills).toEqual(skills);
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { installCount: "desc" },
      })
    );
  });

  it("supports search param including tags", async () => {
    mockPrisma.skill.findMany.mockResolvedValue([]);
    mockPrisma.skill.count.mockResolvedValue(0);

    await GET(createRequest("/api/skills?search=react"));

    expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: "react", mode: "insensitive" } },
            { description: { contains: "react", mode: "insensitive" } },
            { slug: { contains: "react", mode: "insensitive" } },
            { tags: { has: "react" } },
          ],
        },
      })
    );
  });

  it("returns trending sort (last 24h installs) with pagination", async () => {
    const skills = [
      { id: "1", name: "A", _count: { installs: 10 } },
      { id: "2", name: "B", _count: { installs: 5 } },
    ];
    mockPrisma.skill.findMany.mockResolvedValue(skills);

    const response = await GET(createRequest("/api/skills?sort=trending"));
    const data = await response.json();

    expect(data.skills[0]._count.installs).toBeGreaterThanOrEqual(data.skills[1]._count.installs);
    expect(data.total).toBe(2);
  });

  it("returns hot sort using decay formula", async () => {
    const now = new Date();
    const skills = [
      { id: "1", name: "Old Popular", createdAt: new Date(now.getTime() - 72 * 3600000), _count: { installs: 100 } },
      { id: "2", name: "New Rising", createdAt: new Date(now.getTime() - 1 * 3600000), _count: { installs: 10 } },
    ];
    mockPrisma.skill.findMany.mockResolvedValue(skills);

    const response = await GET(createRequest("/api/skills?sort=hot"));
    const data = await response.json();

    expect(data.skills).toHaveLength(2);
  });

  it("returns empty search with no search param", async () => {
    mockPrisma.skill.findMany.mockResolvedValue([]);
    mockPrisma.skill.count.mockResolvedValue(0);

    await GET(createRequest("/api/skills"));

    expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    );
  });

  it("supports pagination params", async () => {
    mockPrisma.skill.findMany.mockResolvedValue([]);
    mockPrisma.skill.count.mockResolvedValue(100);

    const response = await GET(createRequest("/api/skills?page=2&limit=10"));
    const data = await response.json();

    expect(data.page).toBe(2);
    expect(data.limit).toBe(10);
    expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it("clamps limit to max 100", async () => {
    mockPrisma.skill.findMany.mockResolvedValue([]);
    mockPrisma.skill.count.mockResolvedValue(0);

    const response = await GET(createRequest("/api/skills?limit=500"));
    const data = await response.json();

    expect(data.limit).toBe(100);
  });
});

describe("POST /api/skills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await POST(
      createRequest("/api/skills", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });

    const response = await POST(
      createRequest("/api/skills", {
        method: "POST",
        body: JSON.stringify({ description: "desc", sourceType: "GIT_REPO" }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when description is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });

    const response = await POST(
      createRequest("/api/skills", {
        method: "POST",
        body: JSON.stringify({ name: "Test", sourceType: "GIT_REPO" }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when sourceType is invalid", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });

    const response = await POST(
      createRequest("/api/skills", {
        method: "POST",
        body: JSON.stringify({ name: "Test", description: "desc", sourceType: "INVALID" }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 409 when slug already exists", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "existing" });

    const response = await POST(
      createRequest("/api/skills", {
        method: "POST",
        body: JSON.stringify({ name: "Test", description: "desc", sourceType: "GIT_REPO" }),
      })
    );

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toContain("already exists");
  });

  it("creates skill and audit log on success", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue(null);
    const createdSkill = {
      id: "skill-1",
      slug: "test-skill",
      name: "Test Skill",
      version: "1.0.0",
    };
    mockPrisma.skill.create.mockResolvedValue(createdSkill);
    mockPrisma.auditLog.create.mockResolvedValue({});

    const response = await POST(
      createRequest("/api/skills", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Skill",
          description: "A test skill",
          sourceType: "GIT_REPO",
          repoUrl: "https://github.com/test/test",
          category: "tools",
          tags: ["test"],
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.skill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Test Skill",
          description: "A test skill",
          sourceType: "GIT_REPO",
          authorId: "u1",
        }),
      })
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "PUBLISH",
          userId: "u1",
        }),
      })
    );
  });

  it("creates skill with files for UPLOAD sourceType", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue(null);
    mockPrisma.skill.create.mockResolvedValue({ id: "s1", slug: "test", version: "1.0.0" });
    mockPrisma.auditLog.create.mockResolvedValue({});

    await POST(
      createRequest("/api/skills", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          description: "desc",
          sourceType: "UPLOAD",
          files: [
            { filename: "index.ts", content: "// code", path: "/" },
          ],
        }),
      })
    );

    expect(mockPrisma.skill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          files: {
            create: [{ filename: "index.ts", content: "// code", path: "/" }],
          },
        }),
      })
    );
  });

  it("defaults tags to empty array when not provided", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
    mockPrisma.skill.findUnique.mockResolvedValue(null);
    mockPrisma.skill.create.mockResolvedValue({ id: "s1", slug: "test", version: "1.0.0" });
    mockPrisma.auditLog.create.mockResolvedValue({});

    await POST(
      createRequest("/api/skills", {
        method: "POST",
        body: JSON.stringify({ name: "Test", description: "d", sourceType: "GIT_REPO" }),
      })
    );

    expect(mockPrisma.skill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tags: [] }),
      })
    );
  });
});
