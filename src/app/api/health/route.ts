import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const startTime = Date.now();

export async function GET() {
  const checks: Record<string, string> = {};

  // Check database
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.database = "healthy";
  } catch {
    checks.database = "unhealthy";
  }

  // Check Redis (optional)
  if (redis) {
    try {
      await redis.ping();
      checks.redis = "healthy";
    } catch {
      checks.redis = "unhealthy";
    }
  } else {
    checks.redis = "not_configured";
  }

  const healthy = checks.database === "healthy";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      checks,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      pod: process.env.POD_NAME || "unknown",
      node: process.env.NODE_NAME || "unknown",
    },
    { status: healthy ? 200 : 503 }
  );
}
