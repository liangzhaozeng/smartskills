import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditActionSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const actionParam = searchParams.get("action");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const where: Record<string, unknown> = {};
  if (actionParam) {
    const parsed = auditActionSchema.safeParse(actionParam);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action filter" }, { status: 400 });
    }
    where.action = parsed.data;
  }

  const [audits, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { name: true, image: true } },
        skill: { select: { name: true, slug: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ audits, total, page, limit });
}
