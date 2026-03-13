import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/session";
import { validateCsrfToken, generateCsrfToken, setCsrfCookie } from "@/lib/csrf";
import { z } from "zod";

const DEMO_USERNAME = process.env.DEMO_USERNAME || "demo";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "1234";

// Zod schema for login input validation
const loginSchema = z.object({
  username: z.string().min(1).max(50).trim(),
  password: z.string().min(1).max(100),
  csrf_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let username: string;
  let password: string;
  let csrfToken: string | undefined;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    username = String(body.username ?? "").trim();
    password = String(body.password ?? "");
    csrfToken = body.csrf_token;
  } else {
    const formData = await request.formData().catch(() => new FormData());
    username = String(formData.get("username") ?? "").trim();
    password = String(formData.get("password") ?? "");
    csrfToken = String(formData.get("csrf_token") ?? "");
  }

  // Validate input with Zod
  const validationResult = loginSchema.safeParse({ username, password, csrf_token: csrfToken });
  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validationResult.error.flatten() },
      { status: 400 }
    );
  }

  // Validate CSRF token (only for production or when token is provided)
  if (process.env.NODE_ENV === "production" && csrfToken) {
    if (!validateCsrfToken(request, csrfToken)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
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
    
    // Generate and set new CSRF token for subsequent requests
    const newCsrfToken = generateCsrfToken();
    setCsrfCookie(res, newCsrfToken);
    
    return res;
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }
}
