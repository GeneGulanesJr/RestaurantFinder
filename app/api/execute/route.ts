import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, recordLimitUse } from "@/lib/rate-limit";
import { interpretMessage } from "@/lib/llm";
import { searchPlaces } from "@/lib/foursquare";
import { AUTH_CODE, MESSAGE_MAX_LENGTH } from "@/lib/constants";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequest(body: { error: string }) {
  return NextResponse.json(body, { status: 400 });
}

function unprocessable(body: { error: string; detail?: string }) {
  return NextResponse.json(body, { status: 422 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code === null || code === "" || code !== AUTH_CODE) {
    return unauthorized();
  }

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

  return NextResponse.json({
    results: foursquareResult.results,
    interpreted: params,
  });
}
