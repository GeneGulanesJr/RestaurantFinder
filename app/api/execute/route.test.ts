import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/llm", () => ({
  interpretMessage: vi.fn(),
  enrichRecommendationsWithLLM: vi.fn(async () => []),
}));
vi.mock("@/lib/foursquare", () => ({ searchPlaces: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => null),
  recordLimitUse: vi.fn(),
}));

import { interpretMessage } from "@/lib/llm";
import { searchPlaces } from "@/lib/foursquare";
import { checkRateLimit } from "@/lib/rate-limit";

function createRequest(url: string): import("next/server").NextRequest {
  return new Request(url, { method: "GET" }) as import("next/server").NextRequest;
}

describe("execute route - code param validation", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.FOURSQUARE_API_KEY = "test-fs-key";
    vi.mocked(interpretMessage).mockResolvedValue({
      ok: true,
      params: { query: "pizza", near: "LA", limit: 10 },
    });
    vi.mocked(searchPlaces).mockResolvedValue({ ok: true, results: [] });
  });

  it("returns 401 when code is missing", async () => {
    const req = createRequest("http://localhost/api/execute?message=hello");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when code is wrong", async () => {
    const req = createRequest(
      "http://localhost/api/execute?message=hello&code=wrong"
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 200 when code is pioneerdevai and message valid (mocked)", async () => {
    const req = createRequest(
      "http://localhost/api/execute?message=pizza%20in%20LA&code=pioneerdevai"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("results");
    expect(body).toHaveProperty("interpreted");
  });
});

describe("execute route - message validation", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.FOURSQUARE_API_KEY = "test-fs-key";
  });

  it("returns 400 when message is missing", async () => {
    const req = createRequest(
      "http://localhost/api/execute?code=pioneerdevai"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("message");
  });

  it("returns 400 when message is whitespace-only", async () => {
    const req = createRequest(
      "http://localhost/api/execute?code=pioneerdevai&message=%20%20"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});

describe("execute route - interpretation failure (422)", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.FOURSQUARE_API_KEY = "test-fs-key";
    vi.mocked(interpretMessage).mockResolvedValue({
      ok: false,
      detail: "Invalid JSON from interpreter",
    });
  });

  it("returns 422 when interpretation fails", async () => {
    const req = createRequest(
      "http://localhost/api/execute?message=hello&code=pioneerdevai"
    );
    const res = await GET(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain("interpret");
  });
});

describe("execute route - rate limit (429)", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.FOURSQUARE_API_KEY = "test-fs-key";
    vi.mocked(checkRateLimit).mockReturnValue(
      new Response(
        JSON.stringify({ error: "Too many requests", retry_after: 60 }),
        { status: 429, headers: { "Retry-After": "60" } }
      )
    );
  });

  it("returns 429 when rate limit exceeded", async () => {
    const req = createRequest(
      "http://localhost/api/execute?message=pizza%20in%20LA&code=pioneerdevai"
    );
    const res = await GET(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
    expect(body.retry_after).toBe(60);
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});
