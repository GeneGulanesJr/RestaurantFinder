import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/session";

export const runtime = "nodejs";

/** Past date so the cookie is cleared in all clients. */
const CLEAR_EXPIRES = new Date(0);

export async function POST() {
  const res = NextResponse.json({ success: true });
  // Clear session cookie: same path/options as login so the cookie is fully removed
  res.cookies.set(getSessionCookieName(), "", {
    path: "/",
    maxAge: 0,
    expires: CLEAR_EXPIRES,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res;
}
