import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

describe("login API", () => {
  const createRequest = (body: { username?: string; password?: string }) =>
    new Request("http://localhost/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as import("next/server").NextRequest;

  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret-at-least-16-chars";
  });

  it("accepts demo / 1234 and returns 200 with Set-Cookie", async () => {
    const req = createRequest({ username: "demo", password: "1234" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("rf_session");
  });

  it("rejects wrong username with 401", async () => {
    const req = createRequest({ username: "other", password: "1234" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid");
  });

  it("rejects wrong password with 401", async () => {
    const req = createRequest({ username: "demo", password: "wrong" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
