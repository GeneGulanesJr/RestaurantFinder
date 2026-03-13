import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "rf_csrf";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a random CSRF token and set it as an HTTP-only cookie
 */
export function generateCsrfToken(): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString("base64url");
  return token;
}

/**
 * Get CSRF token from request cookies
 */
export function getCsrfTokenFromCookie(request: NextRequest): string | undefined {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Validate CSRF token from request body against cookie
 */
export function validateCsrfToken(request: NextRequest, bodyToken?: string): boolean {
  const cookieToken = getCsrfTokenFromCookie(request);
  
  if (!cookieToken || !bodyToken) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    const cookieBuf = Buffer.from(cookieToken, "base64url");
    const bodyBuf = Buffer.from(bodyToken, "base64url");
    
    if (cookieBuf.length !== bodyBuf.length) {
      return false;
    }
    
    return timingSafeEqual(cookieBuf, bodyBuf);
  } catch {
    return false;
  }
}

/**
 * Set CSRF cookie on response
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export function getCsrfCookieName(): string {
  return CSRF_COOKIE_NAME;
}
