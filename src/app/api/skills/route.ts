import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "all-time";
  const search = searchParams.get("search") || "";

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
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
    return NextResponse.json(skills);
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

    const now = Date.now();
    skills.sort((a, b) => {
      const hoursA = (now - new Date(a.createdAt).getTime()) / 3600000;
      const hoursB = (now - new Date(b.createdAt).getTime()) / 3600000;
      const scoreA = a._count.installs / Math.pow(hoursA + 2, 1.5);
      const scoreB = b._count.installs / Math.pow(hoursB + 2, 1.5);
      return scoreB - scoreA;
    });
    return NextResponse.json(skills);
  }

  // Default: all-time
  const skills = await prisma.skill.findMany({
    where,
    orderBy: { installCount: "desc" },
    include: {
      author: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json(skills);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, readme, sourceType, repoUrl, category, tags, files } = body;

  if (!name || !description || !sourceType) {
    return NextResponse.json(
      { error: "name, description, and sourceType are required" },
      { status: 400 }
    );
  }

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
            create: files.map((f: { filename: string; content: string; path: string }) => ({
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
