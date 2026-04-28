import { createClient } from "@/lib/supabase/admin";

/**
 * Distributed rate limiter using the check_rate_limit DB function.
 *
 * Usage:
 *   const result = await checkRateLimit(req, 'checkout', { limit: 10, windowSeconds: 60 });
 *   if (!result.success) return new Response('Too Many Requests', { status: 429 });
 */

export async function checkRateLimit(
  req: Request,
  endpoint: string,
  options: { limit?: number; windowSeconds?: number } = {}
) {
  const { limit = 30, windowSeconds = 60 } = options;
  
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_ip: ip,
      p_endpoint: endpoint,
      p_limit: limit,
      p_window_seconds: windowSeconds
    });

    if (error) {
      console.error('[RateLimit] DB Error:', error);
      // Fallback: allow request if DB fails
      return { success: true, remaining: limit - 1 };
    }

    return { 
      success: !!data, 
      remaining: data ? 1 : 0 // The RPC returns boolean, we don't have exact remaining from it
    };
  } catch (err) {
    console.error('[RateLimit] Unexpected Error:', err);
    return { success: true, remaining: limit - 1 };
  }
}

/** Pre-built limiters for common use cases */
export const checkoutLimiter = {
  check: (req: Request) => checkRateLimit(req, 'checkout', { limit: 10, windowSeconds: 60 })
};

export const authLimiter = {
  check: (req: Request) => checkRateLimit(req, 'auth', { limit: 5, windowSeconds: 60 })
};

export const apiLimiter = {
  check: (req: Request) => checkRateLimit(req, 'api', { limit: 60, windowSeconds: 60 })
};

