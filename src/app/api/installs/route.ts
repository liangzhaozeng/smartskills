import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { skillSlug, source, userId } = body;

  if (!skillSlug || !source) {
    return NextResponse.json(
      { error: "skillSlug and source are required" },
      { status: 400 }
    );
  }

  if (!["CLI", "WEB_CLICK"].includes(source)) {
    return NextResponse.json(
      { error: "source must be CLI or WEB_CLICK" },
      { status: 400 }
    );
  }

  const skill = await prisma.skill.findUnique({
    where: { slug: skillSlug },
  });

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  await prisma.installEvent.create({
    data: {
      skillId: skill.id,
      source,
      userId: userId || null,
    },
  });

  const countField =
    source === "WEB_CLICK" ? "clickCount" : "installCount";

  await prisma.skill.update({
    where: { id: skill.id },
    data: { [countField]: { increment: 1 } },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
