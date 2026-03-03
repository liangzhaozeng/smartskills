import { redis } from "./redis";

// In-memory fallback when Redis is unavailable
const memoryMap = new Map<string, { count: number; resetTime: number }>();

async function rateLimitRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number }> {
  if (!redis) return rateLimitMemory(key, limit, windowMs);

  try {
    const redisKey = `ratelimit:${key}`;
    const windowSec = Math.ceil(windowMs / 1000);

    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }

    if (count > limit) {
      return { success: false, remaining: 0 };
    }

    return { success: true, remaining: limit - count };
  } catch {
    // Redis error — fail open with memory fallback
    return rateLimitMemory(key, limit, windowMs);
  }
}

function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = memoryMap.get(key);

  if (!entry || now > entry.resetTime) {
    memoryMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - entry.count };
}

export async function rateLimit(
  key: string,
  { limit = 60, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): Promise<{ success: boolean; remaining: number }> {
  return rateLimitRedis(key, limit, windowMs);
}

export function getRateLimitKey(request: Request): string {
  const forwarded = (request.headers as Headers).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
