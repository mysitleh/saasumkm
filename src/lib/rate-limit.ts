import { env } from "@/lib/env";

type Bucket = { count: number; resetAt: number };

/**
 * In-memory rate limiter (sliding fixed window).
 *
 * Cocok untuk MVP. Untuk multi-instance production, ganti backend ke
 * Upstash Redis / Vercel KV agar shared lintas instance.
 */
const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Jumlah maksimum request dalam window. */
  limit: number;
  /** Window dalam milidetik. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  if (env.RATE_LIMIT_DISABLED) {
    return { ok: true, remaining: opts.limit, resetAt: Date.now() + opts.windowMs };
  }
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    const fresh: Bucket = { count: 1, resetAt: now + opts.windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: opts.limit - 1, resetAt: fresh.resetAt };
  }
  existing.count += 1;
  const ok = existing.count <= opts.limit;
  return { ok, remaining: Math.max(0, opts.limit - existing.count), resetAt: existing.resetAt };
}

export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// Periodic cleanup to avoid unbounded growth.
if (typeof globalThis !== "undefined") {
  const g = globalThis as { __rlCleanup?: NodeJS.Timeout };
  if (!g.__rlCleanup) {
    g.__rlCleanup = setInterval(() => {
      const now = Date.now();
      for (const [k, b] of buckets.entries()) if (b.resetAt < now) buckets.delete(k);
    }, 60_000);
    if (typeof (g.__rlCleanup as { unref?: () => void }).unref === "function") {
      (g.__rlCleanup as { unref: () => void }).unref();
    }
  }
}
