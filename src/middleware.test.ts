import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockGetToken } from "./__tests__/setup";

const { middleware } = await import("./middleware");

function createRequest(url: string) {
  return {
    nextUrl: new URL(url, "http://localhost:3000"),
    url: url.startsWith("http") ? url : `http://localhost:3000${url}`,
  } as unknown as import("next/server").NextRequest;
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users from /publish", async () => {
    mockGetToken.mockResolvedValue(null);

    const response = await middleware(createRequest("/publish"));

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/api/auth/signin");
    expect(location).toContain("callbackUrl");
  });

  it("redirects unauthenticated users from /dashboard", async () => {
    mockGetToken.mockResolvedValue(null);

    const response = await middleware(createRequest("/dashboard"));

    expect(response.status).toBe(307);
  });

  it("redirects unauthenticated users from /admin", async () => {
    mockGetToken.mockResolvedValue(null);

    const response = await middleware(createRequest("/admin"));

    expect(response.status).toBe(307);
  });

  it("allows authenticated users through protected routes", async () => {
    mockGetToken.mockResolvedValue({ id: "user-1", role: "ADMIN" });

    const response = await middleware(createRequest("/publish"));

    // NextResponse.next() returns a 200
    expect(response.status).toBe(200);
  });

  it("passes through non-protected routes", async () => {
    const response = await middleware(createRequest("/"));

    // Should not even call getToken for non-protected routes
    expect(response.status).toBe(200);
  });

  it("includes original URL as callbackUrl in redirect", async () => {
    mockGetToken.mockResolvedValue(null);

    const response = await middleware(createRequest("/dashboard"));

    const location = response.headers.get("location");
    expect(location).toContain(encodeURIComponent("http://localhost:3000/dashboard"));
  });
});
