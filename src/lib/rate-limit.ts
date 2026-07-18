import { headers } from "next/headers";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const limiters = new Map<string, RateLimitRecord>();

if (typeof globalThis !== "undefined") {
  const globalAny = globalThis as any;
  if (!globalAny.rateLimitCleanupInterval) {
    globalAny.rateLimitCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of limiters.entries()) {
        if (now > record.resetAt) {
          limiters.delete(key);
        }
      }
    }, 5 * 60 * 1000);
    if (globalAny.rateLimitCleanupInterval.unref) {
      globalAny.rateLimitCleanupInterval.unref();
    }
  }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean }> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const mapKey = `${key}:${ip}`;

  const now = Date.now();
  let record = limiters.get(mapKey);

  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return { success: false };
  }

  record.count += 1;
  limiters.set(mapKey, record);

  return { success: true };
}
