import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { installEventSchema } from "@/lib/validations";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: 30 installs per minute per IP
  const ip = getRateLimitKey(request);
  const { success: withinLimit } = rateLimit(`installs:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = installEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { skillSlug, source, userId } = parsed.data;

  const skill = await prisma.skill.findUnique({
    where: { slug: skillSlug },
  });

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const countField =
    source === "WEB_CLICK" ? "clickCount" : "installCount";

  await prisma.$transaction([
    prisma.installEvent.create({
      data: {
        skillId: skill.id,
        source,
        userId: userId || null,
      },
    }),
    prisma.skill.update({
      where: { id: skill.id },
      data: { [countField]: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true }, { status: 201 });
}
