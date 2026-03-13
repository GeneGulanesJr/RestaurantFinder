/**
 * LLM rate limit: at most 1 call per rolling 60 seconds per client.
 * Client identity: CF-Connecting-IP (Cloudflare) or X-Forwarded-For fallback.
 * Local dev: in-memory store. Production on Cloudflare: use Durable Objects (document in README).
 */

const WINDOW_MS = 60_000;

const lastCallByClient = new Map<string, number>();

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
 * Call recordLimitUse(clientId) after a successful LLM call.
 */
export function checkRateLimit(request: Request): Response | null {
  const clientId = getClientId(request);
  const now = Date.now();
  const last = lastCallByClient.get(clientId);
  if (last !== undefined && now - last < WINDOW_MS) {
    return new Response(
      JSON.stringify({ error: "Too many requests", retry_after: 60 }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      }
    );
  }
  return null;
}

export function recordLimitUse(request: Request): void {
  const clientId = getClientId(request);
  lastCallByClient.set(clientId, Date.now());
}
