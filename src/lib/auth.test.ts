import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../__tests__/setup";

// Unmock auth so we can test the real authOptions
vi.unmock("@/lib/auth");

const { authOptions } = await import("./auth");

describe("auth callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("jwt callback", () => {
    const jwtCallback = authOptions.callbacks!.jwt!;

    it("sets id and role on token when user is present (sign-in)", async () => {
      const token = { sub: "existing" };
      const user = { id: "user-1", name: "Test", role: "ADMIN" };

      const result = await (jwtCallback as Function)({ token, user });

      expect(result.id).toBe("user-1");
      expect(result.role).toBe("ADMIN");
    });

    it("returns token unchanged when user is absent (subsequent requests)", async () => {
      const token = { sub: "existing", id: "user-1", role: "MEMBER" };

      const result = await (jwtCallback as Function)({ token, user: undefined });

      expect(result.id).toBe("user-1");
      expect(result.role).toBe("MEMBER");
    });
  });

  describe("session callback", () => {
    const sessionCallback = authOptions.callbacks!.session!;

    it("sets id and role on session.user from token", async () => {
      const session = { user: { name: "Test", email: "test@test.com" }, expires: "" };
      const token = { id: "user-1", role: "ADMIN" };

      const result = await (sessionCallback as Function)({ session, token });

      expect(result.user.id).toBe("user-1");
      expect(result.user.role).toBe("ADMIN");
    });
  });

  describe("credentials authorize", () => {
    const credentialsProvider = authOptions.providers[0];
    const authorize = (credentialsProvider as { options: { authorize: Function } }).options.authorize;

    it("returns null when no credentials provided", async () => {
      const result = await authorize(undefined);
      expect(result).toBeNull();
    });

    it("returns null when credentials has no email", async () => {
      const result = await authorize({});
      expect(result).toBeNull();
    });

    it("returns existing user when found", async () => {
      const existingUser = {
        id: "user-1",
        name: "Admin",
        email: "admin@example.com",
        image: null,
        role: "ADMIN",
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const result = await authorize({ email: "admin@example.com" });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "admin@example.com" },
      });
      expect(result).toEqual({
        id: "user-1",
        name: "Admin",
        email: "admin@example.com",
        image: null,
        role: "ADMIN",
      });
    });

    it("creates new MEMBER user when not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const newUser = {
        id: "user-2",
        name: "newuser",
        email: "newuser@example.com",
        image: null,
        role: "MEMBER",
      };
      mockPrisma.user.create.mockResolvedValue(newUser);

      const result = await authorize({ email: "newuser@example.com" });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "newuser@example.com",
          name: "newuser",
          role: "MEMBER",
        },
      });
      expect(result).toEqual({
        id: "user-2",
        name: "newuser",
        email: "newuser@example.com",
        image: null,
        role: "MEMBER",
      });
    });

    it("derives name from email prefix", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "u", name: "john.doe", email: "john.doe@company.com", image: null, role: "MEMBER",
      });

      await authorize({ email: "john.doe@company.com" });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "john.doe" }),
        })
      );
    });
  });

  describe("pages config", () => {
    it("sets custom sign-in page", () => {
      expect(authOptions.pages?.signIn).toBe("/auth/signin");
    });
  });

  describe("session strategy", () => {
    it("uses JWT strategy", () => {
      expect(authOptions.session?.strategy).toBe("jwt");
    });
  });
});
