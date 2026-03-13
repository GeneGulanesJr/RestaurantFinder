import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, recordLimitUse } from "@/lib/rate-limit";
import { interpretMessage, enrichRecommendationsWithLLM } from "@/lib/llm";
import { searchPlaces } from "@/lib/foursquare";
import { getSessionCookieName, verifySession } from "@/lib/session";
import { AUTH_CODE, MESSAGE_MAX_LENGTH } from "@/lib/constants";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequest(body: { error: string }) {
  return NextResponse.json(body, { status: 400 });
}

function unprocessable(body: { error: string; detail?: string }) {
  return NextResponse.json(body, { status: 422 });
}

function isAuthorized(request: NextRequest): boolean {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // Only allow auth code bypass if AUTH_CODE is explicitly set in environment
  if (code !== null && code !== "" && code === AUTH_CODE && AUTH_CODE !== "") return true;
  const sessionCookie = request.cookies?.get(getSessionCookieName())?.value;
  return verifySession(sessionCookie) !== null;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const rawMessage = searchParams.get("message");
  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

  if (message === "") {
    return badRequest({ error: "message parameter is required" });
  }

  if (message.length > MESSAGE_MAX_LENGTH) {
    return badRequest({ error: "message too long" });
  }

  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const foursquareKey = process.env.FOURSQUARE_API_KEY;
  if (!openRouterKey || !foursquareKey) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[execute] 502: Missing env — OPENROUTER_API_KEY:",
        !!openRouterKey,
        "FOURSQUARE_API_KEY:",
        !!foursquareKey
      );
    }
    return NextResponse.json(
      { error: "Upstream API error" },
      { status: 502 }
    );
  }

  const interpretResult = await interpretMessage(message, openRouterKey);
  if (!interpretResult.ok) {
    return unprocessable({
      error: "Could not interpret request",
      detail: interpretResult.detail,
    });
  }

  // Only record rate limit use after successful LLM interpretation
  recordLimitUse(request);
  const params = interpretResult.params;

  const foursquareResult = await searchPlaces(params, foursquareKey);
  if (!foursquareResult.ok) {
    if (process.env.NODE_ENV !== "production" && "reason" in foursquareResult && foursquareResult.reason) {
      console.error("[execute] 502 Foursquare:", foursquareResult.status, foursquareResult.reason);
    }
    return NextResponse.json(
      { error: "Upstream API error" },
      { status: 502 }
    );
  }

  let results = foursquareResult.results;

  // Let the LLM rewrite descriptions/why_best for a more human feel,
  // but fall back gracefully if it fails.
  const enriched = await enrichRecommendationsWithLLM(params, results, openRouterKey);
  if (enriched.length > 0) {
    const byIndex = new Map<number, (typeof enriched)[number]>();
    for (const item of enriched) {
      byIndex.set(item.index, item);
    }
    results = results.map((r, index) => {
      const extra = byIndex.get(index);
      if (!extra) return r;
      return {
        ...r,
        description: extra.description ?? r.description,
        why_best: extra.why_best ?? r.why_best,
      };
    });
  }

  return NextResponse.json({
    results,
    interpreted: params,
  });
}
