import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, image: true } },
      files: true,
    },
  });

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  return NextResponse.json(skill);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: { id: true, authorId: true },
  });

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const isAuthor = skill.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, readme, category, tags, verified } = body;

  const updated = await prisma.skill.update({
    where: { id: skill.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(readme !== undefined && { readme }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(isAdmin && verified !== undefined && { verified }),
    },
  });

  await prisma.auditLog.create({
    data: {
      skillId: skill.id,
      userId: session.user.id,
      action: verified !== undefined ? "VERIFY" : "UPDATE",
      details: body,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: { id: true, authorId: true, name: true },
  });

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const isAuthor = skill.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.auditLog.create({
    data: {
      skillId: skill.id,
      userId: session.user.id,
      action: "DELETE",
      details: { name: skill.name },
    },
  });

  await prisma.skill.delete({ where: { id: skill.id } });

  return NextResponse.json({ success: true });
}
