import { NextResponse } from "next/server";
import { generateCsrfToken, setCsrfCookie } from "@/lib/csrf";

/**
 * GET /api/csrf - Returns a CSRF token for use in forms
 * This endpoint should be called before submitting sensitive forms
 */
export async function GET() {
  const token = generateCsrfToken();
  const res = NextResponse.json({ csrf_token: token });
  setCsrfCookie(res, token);
  return res;
}
