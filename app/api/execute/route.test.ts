import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/constants", () => ({
  AUTH_CODE: "pioneerdevai",
  MESSAGE_MAX_LENGTH: 2000,
}));
vi.mock("@/lib/llm", () => ({
  interpretMessage: vi.fn(),
  enrichRecommendationsWithLLM: vi.fn(async () => []),
}));
vi.mock("@/lib/foursquare", () => ({
  fetchPlaceSearch: vi.fn(),
  buildFullResultsFromPlaces: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => null),
  recordLimitUse: vi.fn(),
}));

import { interpretMessage } from "@/lib/llm";
import { fetchPlaceSearch, buildFullResultsFromPlaces } from "@/lib/foursquare";
import { checkRateLimit } from "@/lib/rate-limit";

function createRequest(url: string): import("next/server").NextRequest {
  return new Request(url, { method: "GET" }) as import("next/server").NextRequest;
}

describe("execute route - code param validation", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.FOURSQUARE_API_KEY = "test-fs-key";
    process.env.AUTH_CODE = "pioneerdevai";
    vi.mocked(interpretMessage).mockResolvedValue({
      ok: true,
      params: { query: "pizza", near: "LA", limit: 10 },
    });
    vi.mocked(fetchPlaceSearch).mockResolvedValue({
      ok: true,
      places: [],
      minimalResults: [],
    });
    vi.mocked(buildFullResultsFromPlaces).mockResolvedValue([]);
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

  it("returns 200 and streams NDJSON (interpreted then results)", async () => {
    const req = createRequest(
      "http://localhost/api/execute?message=pizza%20in%20LA&code=pioneerdevai"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/x-ndjson");
    const text = await res.text();
    const lines = text.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const interpreted = JSON.parse(lines[0]) as { type: string; payload: unknown };
    expect(interpreted.type).toBe("interpreted");
    expect(interpreted.payload).toMatchObject({ query: "pizza", near: "LA", limit: 10 });
    const results = JSON.parse(lines[1]) as { type: string; payload: unknown };
    expect(results.type).toBe("results");
    expect(Array.isArray(results.payload)).toBe(true);
  });
});

describe("execute route - message validation", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.FOURSQUARE_API_KEY = "test-fs-key";
    process.env.AUTH_CODE = "pioneerdevai";
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

  it("returns 400 when message exceeds max length", async () => {
    const longMessage = "x".repeat(2001);
    const req = createRequest(
      `http://localhost/api/execute?code=pioneerdevai&message=${encodeURIComponent(longMessage)}`
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("too long");
  });
});

describe("execute route - invalid structured param (422)", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.FOURSQUARE_API_KEY = "test-fs-key";
    process.env.AUTH_CODE = "pioneerdevai";
    vi.mocked(interpretMessage).mockResolvedValue({
      ok: true,
      params: { query: "pizza", near: "LA", limit: 10 },
    });
  });

  it("returns 422 when structured is not valid JSON", async () => {
    const req = createRequest(
      "http://localhost/api/execute?message=hello&code=pioneerdevai&structured=not-valid-json"
    );
    const res = await GET(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain("structured");
  });
});

describe("execute route - Foursquare upstream failure (streamed error)", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.FOURSQUARE_API_KEY = "test-fs-key";
    process.env.AUTH_CODE = "pioneerdevai";
    vi.mocked(interpretMessage).mockResolvedValue({
      ok: true,
      params: { query: "pizza", near: "LA", limit: 10 },
    });
    vi.mocked(fetchPlaceSearch).mockResolvedValue({
      ok: false,
      status: 502,
      reason: "Service unavailable",
    });
  });

  it("returns 200 and streams error chunk when Foursquare fails", async () => {
    const req = createRequest(
      "http://localhost/api/execute?message=pizza%20in%20LA&code=pioneerdevai"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    const lines = text.trim().split("\n").filter(Boolean);
    const errorLine = lines.find((l) => (JSON.parse(l) as { type: string }).type === "error");
    expect(errorLine).toBeTruthy();
    const msg = JSON.parse(errorLine!) as { type: string; payload: { error?: string } };
    expect(msg.payload.error).toBeDefined();
  });
});

describe("execute route - interpretation failure (streamed error)", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.FOURSQUARE_API_KEY = "test-fs-key";
    process.env.AUTH_CODE = "pioneerdevai";
    vi.mocked(interpretMessage).mockResolvedValue({
      ok: false,
      detail: "Invalid JSON from interpreter",
    });
  });

  it("returns 200 and streams error chunk when interpretation fails", async () => {
    const req = createRequest(
      "http://localhost/api/execute?message=hello&code=pioneerdevai"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    const lines = text.trim().split("\n").filter(Boolean);
    expect(lines.length).toBe(1);
    const msg = JSON.parse(lines[0]) as { type: string; payload: { error?: string; detail?: string } };
    expect(msg.type).toBe("error");
    expect(msg.payload.error).toContain("interpret");
  });
});

describe("execute route - rate limit (429)", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.FOURSQUARE_API_KEY = "test-fs-key";
    process.env.AUTH_CODE = "pioneerdevai";
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
