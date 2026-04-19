// In-memory rate limiter for heavy actions
// Tracks { identifier+action: { count, windowStart } }
// Default: max 5 calls per 10 seconds per identifier+action combination
// Applied to: autoAssign, generate (schedules), traffic-predict

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * Rate limit checker for API actions.
 * Uses session token as identifier when available, falls back to a global
 * identifier per action for unauthenticated requests.
 *
 * @param token - Session token (used as identifier, falls back to "anon" if absent)
 * @param action - Action name (e.g., 'autoAssign', 'generate', 'traffic-predict')
 * @param maxCalls - Maximum calls allowed in the window (default: 5)
 * @param windowMs - Window duration in milliseconds (default: 10000 = 10s)
 * @returns { allowed: boolean, retryAfterMs: number }
 */
export function rateLimit(
  token: string | undefined | null,
  action: string,
  maxCalls: number = 5,
  windowMs: number = 10000
): { allowed: boolean; retryAfterMs: number } {
  const identifier = token || 'anon';
  const key = `${identifier}:${action}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    // Start a new window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count < maxCalls) {
    entry.count++;
    return { allowed: true, retryAfterMs: 0 };
  }

  // Rate limited
  const retryAfterMs = windowMs - (now - entry.windowStart);
  return { allowed: false, retryAfterMs };
}
