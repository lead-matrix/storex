/**
 * Simple in-memory rate limiter for API routes.
 * 
 * Resets on each cold-start / Vercel function instance.
 * For distributed rate limiting (multi-region), swap for an Upstash Redis adapter.
 *
 * Usage:
 *   const limiter = rateLimit({ windowMs: 60_000, max: 20 });
 *   const result = limiter.check(req);
 *   if (!result.success) return new Response('Too Many Requests', { status: 429 });
 */

type RateLimitStore = Map<string, { count: number; resetAt: number }>;

interface RateLimitOptions {
  /** Window duration in milliseconds (default: 60s) */
  windowMs?: number;
  /** Max requests per window per IP (default: 30) */
  max?: number;
}

const stores = new WeakMap<RateLimitOptions, RateLimitStore>();

export function rateLimit(options: RateLimitOptions = {}) {
  const { windowMs = 60_000, max = 30 } = options;

  if (!stores.has(options)) stores.set(options, new Map());
  const store = stores.get(options)!;

  function check(req: Request): { success: boolean; remaining: number } {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return { success: true, remaining: max - 1 };
    }

    if (entry.count >= max) {
      return { success: false, remaining: 0 };
    }

    entry.count++;
    return { success: true, remaining: max - entry.count };
  }

  return { check };
}

/** Pre-built limiters for common use cases */
export const checkoutLimiter = rateLimit({ windowMs: 60_000, max: 10 });
export const authLimiter = rateLimit({ windowMs: 60_000, max: 5 });
export const apiLimiter = rateLimit({ windowMs: 60_000, max: 60 });
