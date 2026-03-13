/**
 * LLM rate limit: at most 1 call per rolling 60 seconds per client.
 * Client identity: CF-Connecting-IP (Cloudflare) or X-Forwarded-For fallback.
 * Local dev: in-memory store. Production on Cloudflare: use Durable Objects (document in README).
 * 
 * This implementation uses a sliding window algorithm with automatic cleanup of old entries.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 1;
const CLEANUP_INTERVAL_MS = 300_000; // 5 minutes

interface ClientRequestHistory {
  timestamps: number[];
}

const clientHistory = new Map<string, ClientRequestHistory>();

/**
 * Clean up old entries from the rate limit map
 * This should be called periodically to prevent memory leaks
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  
  for (const [clientId, history] of clientHistory.entries()) {
    // Remove timestamps older than the window
    history.timestamps = history.timestamps.filter(ts => ts > cutoff);
    
    // Remove client entry if no recent requests
    if (history.timestamps.length === 0) {
      clientHistory.delete(clientId);
    }
  }
}

// Run cleanup periodically
if (typeof setInterval !== "undefined") {
  setInterval(cleanupOldEntries, CLEANUP_INTERVAL_MS);
}

export function getClientId(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

/**
 * Returns 429 Response if client is over limit; otherwise null (allowed).
 * Uses a sliding window algorithm for accurate rate limiting.
 */
export function checkRateLimit(request: Request): Response | null {
  const clientId = getClientId(request);
  const now = Date.now();
  
  // Get or create client history
  let history = clientHistory.get(clientId);
  if (!history) {
    history = { timestamps: [] };
    clientHistory.set(clientId, history);
  }
  
  // Filter out timestamps older than the window
  const cutoff = now - WINDOW_MS;
  history.timestamps = history.timestamps.filter(ts => ts > cutoff);
  
  // Check if client has exceeded the limit
  if (history.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    // Calculate time until oldest request expires
    const oldestRequest = history.timestamps[0];
    const retryAfter = Math.ceil((oldestRequest + WINDOW_MS - now) / 1000);
    
    return new Response(
      JSON.stringify({ 
        error: "Too many requests", 
        retry_after: Math.max(1, retryAfter) 
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.max(1, retryAfter)),
        },
      }
    );
  }
  
  return null;
}

/**
 * Record a successful request for rate limiting
 * Only call this after a successful LLM interpretation
 */
export function recordLimitUse(request: Request): void {
  const clientId = getClientId(request);
  const history = clientHistory.get(clientId);
  
  if (history) {
    history.timestamps.push(Date.now());
  }
}

/**
 * Get current rate limit status for a client (for monitoring/debugging)
 */
export function getRateLimitStatus(clientId: string): {
  requestCount: number;
  oldestRequest: number | null;
  timeUntilReset: number | null;
} {
  const history = clientHistory.get(clientId);
  if (!history) {
    return {
      requestCount: 0,
      oldestRequest: null,
      timeUntilReset: null,
    };
  }
  
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const validTimestamps = history.timestamps.filter(ts => ts > cutoff);
  
  return {
    requestCount: validTimestamps.length,
    oldestRequest: validTimestamps[0] || null,
    timeUntilReset: validTimestamps[0] ? validTimestamps[0] + WINDOW_MS - now : null,
  };
}

