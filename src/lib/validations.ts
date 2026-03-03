import { z } from "zod";

export const publishSkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  readme: z.string().max(50000).optional().nullable(),
  sourceType: z.enum(["GIT_REPO", "UPLOAD"]),
  repoUrl: z.string().url().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
  files: z
    .array(
      z.object({
        filename: z.string().min(1).max(255),
        content: z.string().max(100000),
        path: z.string().max(500).default("/"),
      })
    )
    .max(50)
    .optional(),
});

export const updateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  readme: z.string().max(50000).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  verified: z.boolean().optional(),
});

export const installEventSchema = z.object({
  skillSlug: z.string().min(1).max(100),
  source: z.enum(["CLI", "WEB_CLICK"]),
  userId: z.string().max(100).optional().nullable(),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const auditActionSchema = z.enum(["PUBLISH", "UPDATE", "DELETE", "VERIFY"]);
