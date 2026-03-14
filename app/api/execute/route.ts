import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, recordLimitUse } from "@/lib/rate-limit";
import { interpretMessage, enrichRecommendationsWithLLM } from "@/lib/llm";
import { fetchPlaceSearch, buildFullResultsFromPlaces } from "@/lib/foursquare";
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

  const rawStructured = searchParams.get("structured");
  let structured: unknown = null;
  if (typeof rawStructured === "string" && rawStructured.trim() !== "") {
    try {
      structured = JSON.parse(rawStructured);
    } catch {
      return unprocessable({
        error: "Invalid structured search payload",
        detail: "structured parameter must be valid JSON",
      });
    }
  }

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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, payload: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify({ type, payload }) + "\n"));
      };

      try {
        const interpretResult = await interpretMessage(message, openRouterKey);
        if (!interpretResult.ok) {
          send("error", {
            error: "Could not interpret request",
            detail: interpretResult.detail,
          });
          controller.close();
          return;
        }

        recordLimitUse(request);
        const params = interpretResult.params;

        if (structured && typeof structured === "object" && !Array.isArray(structured)) {
          const obj = structured as {
            location?: unknown;
            limit?: unknown;
            priceRange?: unknown;
            openNow?: unknown;
          };
          if (typeof obj.location === "string" && obj.location.trim() !== "") {
            params.near = obj.location.trim();
          }
          if (typeof obj.limit === "number" && Number.isFinite(obj.limit) && obj.limit > 0) {
            params.limit = obj.limit;
          }
          if (
            (typeof obj.priceRange === "number" || typeof obj.priceRange === "string") &&
            Number(obj.priceRange) >= 1 &&
            Number(obj.priceRange) <= 4
          ) {
            const normalizedPrice = String(Number(obj.priceRange)) as "1" | "2" | "3" | "4";
            params.price = normalizedPrice;
          }
          if (typeof obj.openNow === "boolean") {
            params.open_now = obj.openNow;
          }
        }

        send("interpreted", { query: params.query, near: params.near, limit: params.limit });

        const placeSearch = await fetchPlaceSearch(params, foursquareKey);
        if (!placeSearch.ok) {
          if (process.env.NODE_ENV !== "production" && placeSearch.reason) {
            console.error("[execute] 502 Foursquare:", placeSearch.status, placeSearch.reason);
          }
          send("error", { error: "Upstream API error" });
          controller.close();
          return;
        }

        // Send minimal results immediately (Foursquare only, no tips/photos) so the list appears.
        send("results", placeSearch.minimalResults);

        // Then add tips/photos and send again so descriptions and photos stream in.
        let results = await buildFullResultsFromPlaces(placeSearch.places, params, foursquareKey);
        send("results", results);

        // Then enrich with LLM and send again so copy updates in place.
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
          send("results", results);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[execute] stream error:", err);
        }
        send("error", { error: "Something went wrong" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
