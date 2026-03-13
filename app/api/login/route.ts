import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/session";

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "1234";

export async function POST(request: NextRequest) {
  let username: string;
  let password: string;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    username = String(body.username ?? "").trim();
    password = String(body.password ?? "");
  } else {
    const formData = await request.formData().catch(() => new FormData());
    username = String(formData.get("username") ?? "").trim();
    password = String(formData.get("password") ?? "");
  }

  if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  try {
    const { name, value, options } = createSessionCookie();
    const res = NextResponse.json({ success: true });
    res.cookies.set(name, value, options);
    return res;
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }
}
