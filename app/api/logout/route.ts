import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/session";

export const runtime = "edge";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(getSessionCookieName(), "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });
  return res;
}
