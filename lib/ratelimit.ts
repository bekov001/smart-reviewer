import { Ratelimit } from "@upstash/ratelimit";
import { getOptionalRedis } from "./upstash";

// Rate limiting is OPTIONAL: it activates only when Upstash Redis is configured.
// Without it the app still runs (useful for local/review) — limiting is simply
// skipped, with a one-time warning.
//
// We accept both naming conventions: the standard Upstash names and the KV_*
// names provisioned by the Vercel Upstash Marketplace integration.
function makeLimiter(prefix: string, limit: number, window: `${number} s`) {
  const redis = getOptionalRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
    analytics: false,
  });
}

// Tight on the paid LLM endpoint; looser on the (cheaper, cached) news proxy.
const limiters = {
  analyze: makeLimiter("rl:analyze", 10, "60 s"),
  news: makeLimiter("rl:news", 20, "60 s"),
} as const;

export type RateScope = keyof typeof limiters;

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

let warned = false;

export interface RateLimitResult {
  success: boolean;
  /** Seconds until the limit resets (for a Retry-After header). */
  retryAfter: number;
}

export async function checkRateLimit(
  scope: RateScope,
  req: Request,
): Promise<RateLimitResult> {
  const limiter = limiters[scope];
  if (!limiter) {
    if (!warned) {
      console.warn(
        "[ratelimit] Upstash not configured — rate limiting disabled. " +
          "Set KV_REST_API_URL/KV_REST_API_TOKEN or " +
          "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN to enable.",
      );
      warned = true;
    }
    return { success: true, retryAfter: 0 };
  }

  const { success, reset } = await limiter.limit(`${getClientIp(req)}`);
  return {
    success,
    retryAfter: Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
  };
}
