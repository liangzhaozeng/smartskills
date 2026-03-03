import { vi } from "vitest";

// Mock Prisma client
export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  skill: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  skillFile: {
    create: vi.fn(),
  },
  installEvent: {
    create: vi.fn(),
  },
  auditLog: {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock next-auth getServerSession
export const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// Mock next-auth/jwt for middleware tests
export const mockGetToken = vi.fn();
vi.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));
