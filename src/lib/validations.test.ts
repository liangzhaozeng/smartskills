import { describe, it, expect } from "vitest";
import {
  publishSkillSchema,
  updateSkillSchema,
  installEventSchema,
  updateUserRoleSchema,
  auditActionSchema,
} from "./validations";

describe("publishSkillSchema", () => {
  it("accepts valid input", () => {
    const result = publishSkillSchema.safeParse({
      name: "My Skill",
      description: "A great skill",
      sourceType: "GIT_REPO",
      repoUrl: "https://github.com/test/test",
      tags: ["test"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = publishSkillSchema.safeParse({
      description: "A great skill",
      sourceType: "GIT_REPO",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sourceType", () => {
    const result = publishSkillSchema.safeParse({
      name: "My Skill",
      description: "desc",
      sourceType: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding max length", () => {
    const result = publishSkillSchema.safeParse({
      name: "x".repeat(101),
      description: "desc",
      sourceType: "GIT_REPO",
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many tags", () => {
    const result = publishSkillSchema.safeParse({
      name: "Test",
      description: "desc",
      sourceType: "GIT_REPO",
      tags: Array(11).fill("tag"),
    });
    expect(result.success).toBe(false);
  });

  it("defaults tags to empty array", () => {
    const result = publishSkillSchema.safeParse({
      name: "Test",
      description: "desc",
      sourceType: "UPLOAD",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it("validates file objects", () => {
    const result = publishSkillSchema.safeParse({
      name: "Test",
      description: "desc",
      sourceType: "UPLOAD",
      files: [{ filename: "test.ts", content: "code", path: "/" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects files with missing filename", () => {
    const result = publishSkillSchema.safeParse({
      name: "Test",
      description: "desc",
      sourceType: "UPLOAD",
      files: [{ content: "code", path: "/" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateSkillSchema", () => {
  it("accepts partial updates", () => {
    const result = updateSkillSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateSkillSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts verified boolean", () => {
    const result = updateSkillSchema.safeParse({ verified: true });
    expect(result.success).toBe(true);
  });

  it("rejects verified as string", () => {
    const result = updateSkillSchema.safeParse({ verified: "true" });
    expect(result.success).toBe(false);
  });
});

describe("installEventSchema", () => {
  it("accepts valid CLI install", () => {
    const result = installEventSchema.safeParse({
      skillSlug: "test-skill",
      source: "CLI",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid WEB_CLICK", () => {
    const result = installEventSchema.safeParse({
      skillSlug: "test-skill",
      source: "WEB_CLICK",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid source", () => {
    const result = installEventSchema.safeParse({
      skillSlug: "test-skill",
      source: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing skillSlug", () => {
    const result = installEventSchema.safeParse({ source: "CLI" });
    expect(result.success).toBe(false);
  });
});

describe("updateUserRoleSchema", () => {
  it("accepts valid role update", () => {
    const result = updateUserRoleSchema.safeParse({ userId: "u1", role: "ADMIN" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = updateUserRoleSchema.safeParse({ userId: "u1", role: "SUPERADMIN" });
    expect(result.success).toBe(false);
  });

  it("rejects missing userId", () => {
    const result = updateUserRoleSchema.safeParse({ role: "ADMIN" });
    expect(result.success).toBe(false);
  });
});

describe("auditActionSchema", () => {
  it("accepts valid actions", () => {
    expect(auditActionSchema.safeParse("PUBLISH").success).toBe(true);
    expect(auditActionSchema.safeParse("UPDATE").success).toBe(true);
    expect(auditActionSchema.safeParse("DELETE").success).toBe(true);
    expect(auditActionSchema.safeParse("VERIFY").success).toBe(true);
  });

  it("rejects invalid actions", () => {
    expect(auditActionSchema.safeParse("INVALID").success).toBe(false);
    expect(auditActionSchema.safeParse("").success).toBe(false);
  });
});
