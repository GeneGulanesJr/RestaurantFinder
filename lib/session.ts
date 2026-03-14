import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "rf_session";
const DEFAULT_TTL_SEC = 4 * 60 * 60; // 4 hours

function getSessionTTL(): number {
  const ttl = process.env.SESSION_TTL_SEC;
  if (ttl) {
    const parsed = parseInt(ttl, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_TTL_SEC;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function b64urlDecode(str: string): Buffer | null {
  try {
    return Buffer.from(str, "base64url");
  } catch {
    return null;
  }
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set and at least 16 characters");
  }
  return secret;
}

export function createSessionCookie(): { name: string; value: string; options: Record<string, unknown> } {
  const secret = getSecret();
  const ttl = getSessionTTL();
  const payload = {
    u: "demo",
    exp: Math.floor(Date.now() / 1000) + ttl,
  };
  const payloadStr = JSON.stringify(payload);
  const sig = createHmac("sha256", secret).update(payloadStr).digest();
  const value = `${b64urlEncode(Buffer.from(payloadStr, "utf8"))}.${b64urlEncode(sig)}`;
  return {
    name: COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: ttl,
    },
  };
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

/**
 * Returns "demo" if the cookie value is valid, null otherwise.
 */
export function verifySession(cookieValue: string | null | undefined): string | null {
  if (!cookieValue || !cookieValue.includes(".")) return null;
  const [payloadB64, sigB64] = cookieValue.split(".");
  const payloadBuf = b64urlDecode(payloadB64);
  const sigBuf = b64urlDecode(sigB64);
  if (!payloadBuf || !sigBuf) return null;
  try {
    const secret = getSecret();
    const expectedSig = createHmac("sha256", secret).update(payloadBuf).digest();
    if (expectedSig.length !== sigBuf.length || !timingSafeEqual(expectedSig, sigBuf)) {
      return null;
    }
    const payload = JSON.parse(payloadBuf.toString("utf8")) as { u?: string; exp?: number };
    if (payload.exp != null && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload.u === "demo" ? "demo" : null;
  } catch {
    return null;
  }
}
