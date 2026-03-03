import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, mockGetServerSession } from "../../../../__tests__/setup";

const { GET, PUT } = await import("./route");

function createRequest(url: string, options?: RequestInit) {
  return new Request(
    url.startsWith("http") ? url : `http://localhost:3000${url}`,
    options
  ) as unknown as import("next/server").NextRequest;
}

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(403);
  });

  it("returns 403 when user is not admin", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });

    const response = await GET();

    expect(response.status).toBe(403);
  });

  it("returns users list for admin", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
    const users = [
      { id: "u1", name: "Admin", email: "admin@test.com", role: "ADMIN", _count: { skills: 5 } },
    ];
    mockPrisma.user.findMany.mockResolvedValue(users);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual(users);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      })
    );
  });
});

describe("PUT /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await PUT(
      createRequest("/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ userId: "u1", role: "ADMIN" }),
      })
    );

    expect(response.status).toBe(403);
  });

  it("returns 403 when user is not admin", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });

    const response = await PUT(
      createRequest("/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ userId: "u2", role: "ADMIN" }),
      })
    );

    expect(response.status).toBe(403);
  });

  it("returns 400 when userId is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });

    const response = await PUT(
      createRequest("/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ role: "ADMIN" }),
      })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid input");
  });

  it("returns 400 when role is invalid", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });

    const response = await PUT(
      createRequest("/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ userId: "u2", role: "SUPERADMIN" }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("updates user role successfully", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
    const updatedUser = { id: "u2", name: "User", role: "ADMIN" };
    mockPrisma.user.update.mockResolvedValue(updatedUser);

    const response = await PUT(
      createRequest("/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ userId: "u2", role: "ADMIN" }),
      })
    );

    const data = await response.json();
    expect(data.role).toBe("ADMIN");
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { role: "ADMIN" },
    });
  });

  it("accepts MEMBER role", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
    mockPrisma.user.update.mockResolvedValue({ id: "u2", role: "MEMBER" });

    const response = await PUT(
      createRequest("/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ userId: "u2", role: "MEMBER" }),
      })
    );

    expect(response.status).toBe(200);
  });
});
