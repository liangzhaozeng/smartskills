import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hotScore } from "@/lib/utils";
import { publishSkillSchema } from "@/lib/validations";
import slugify from "slugify";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "all-time";
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          { tags: { has: search } },
        ],
      }
    : {};

  if (sort === "trending") {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const skills = await prisma.skill.findMany({
      where,
      include: {
        author: { select: { name: true, image: true } },
        _count: {
          select: {
            installs: {
              where: { timestamp: { gte: twentyFourHoursAgo } },
            },
          },
        },
      },
    });

    skills.sort((a, b) => b._count.installs - a._count.installs);
    const paginated = skills.slice((page - 1) * limit, page * limit);
    return NextResponse.json({ skills: paginated, total: skills.length, page, limit });
  }

  if (sort === "hot") {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const skills = await prisma.skill.findMany({
      where,
      include: {
        author: { select: { name: true, image: true } },
        _count: {
          select: {
            installs: {
              where: { timestamp: { gte: twentyFourHoursAgo } },
            },
          },
        },
      },
    });

    skills.sort((a, b) =>
      hotScore(b._count.installs, b.createdAt) - hotScore(a._count.installs, a.createdAt)
    );
    const paginated = skills.slice((page - 1) * limit, page * limit);
    return NextResponse.json({ skills: paginated, total: skills.length, page, limit });
  }

  // Default: all-time with DB-level pagination
  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      orderBy: { installCount: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { name: true, image: true } },
      },
    }),
    prisma.skill.count({ where }),
  ]);

  return NextResponse.json({ skills, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = publishSkillSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { name, description, readme, sourceType, repoUrl, category, tags, files } = parsed.data;
  const slug = slugify(name, { lower: true, strict: true });

  const existing = await prisma.skill.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A skill with this name already exists" },
      { status: 409 }
    );
  }

  const skill = await prisma.skill.create({
    data: {
      slug,
      name,
      description,
      readme: readme || null,
      sourceType,
      repoUrl: repoUrl || null,
      category: category || null,
      tags: tags || [],
      authorId: session.user.id,
      files: files?.length
        ? {
            create: files.map((f) => ({
              filename: f.filename,
              content: f.content,
              path: f.path || "/",
            })),
          }
        : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      skillId: skill.id,
      userId: session.user.id,
      action: "PUBLISH",
      details: { version: skill.version },
    },
  });

  return NextResponse.json(skill, { status: 201 });
}
