import type { SearchParamsResolved } from "@/lib/schemas";
import type { RestaurantResult } from "@/lib/schemas";
import {
  foursquarePlaceSearchResponseSchema,
  type FoursquarePlace,
} from "@/lib/foursquare-schema";

/** Foursquare Places API base URL. Document in README. */
export const FOURSQUARE_BASE_URL = "https://places-api.foursquare.com/places/search";

/** API version header required by Foursquare Places API. */
export const FOURSQUARE_API_VERSION = "2025-06-17";

/** Request timeout in ms. Document in README. */
export const FOURSQUARE_TIMEOUT_MS = 15_000;

export type FoursquareResult =
  | { ok: true; results: RestaurantResult[] }
  | { ok: false; status?: number; reason?: string };

function mapPlaceToResult(place: FoursquarePlace): RestaurantResult {
  const address =
    place.location?.formatted_address ??
    place.location?.address ??
    [place.location?.locality, place.location?.region, place.location?.country]
      .filter(Boolean)
      .join(", ") ??
    "";
  const category = place.categories?.[0]?.name ?? "Restaurant";
  const open_now =
    place.closed_bucket === "VeryLikelyOpen" || place.closed_bucket === "LikelyOpen";

  return {
    name: place.name,
    address,
    category,
    rating: place.rating,
    price: place.price,
    open_now: place.closed_bucket != null ? open_now : undefined,
    distance_meters: place.distance,
  };
}

/**
 * Call Foursquare Place Search with validated SearchParams.
 * Returns mapped results or signals upstream error (502).
 */
export async function searchPlaces(
  params: SearchParamsResolved,
  apiKey: string
): Promise<FoursquareResult> {
  const url = new URL(FOURSQUARE_BASE_URL);
  url.searchParams.set("query", params.query);
  url.searchParams.set("near", params.near);
  url.searchParams.set("limit", String(params.limit));
  if (params.open_now === true) {
    url.searchParams.set("open_now", "true");
  }
  if (params.price) {
    const p = Number(params.price);
    if (!Number.isNaN(p)) {
      url.searchParams.set("min_price", String(p));
      url.searchParams.set("max_price", String(p));
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FOURSQUARE_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Places-Api-Version": FOURSQUARE_API_VERSION,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (process.env.NODE_ENV !== "production") {
        console.error("[Foursquare] non-OK response:", res.status, text.slice(0, 200));
      }
      return { ok: false, status: res.status, reason: text.slice(0, 100) };
    }

    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      if (process.env.NODE_ENV !== "production") {
        console.error("[Foursquare] invalid JSON response");
      }
      return { ok: false };
    }

    const parsedResult = foursquarePlaceSearchResponseSchema.safeParse(parsed);
    if (!parsedResult.success) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[Foursquare] schema validation failed:", parsedResult.error.flatten());
      }
      return { ok: false };
    }

    const results = parsedResult.data.results.map(mapPlaceToResult);
    return { ok: true, results };
  } catch (err) {
    clearTimeout(timeoutId);
    if (process.env.NODE_ENV !== "production") {
      console.error("[Foursquare] request failed:", err instanceof Error ? err.message : err);
    }
    return { ok: false };
  }
}
