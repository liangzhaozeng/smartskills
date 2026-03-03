import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
