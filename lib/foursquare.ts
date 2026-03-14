import type { SearchParamsResolved } from "@/lib/schemas";
import type { RestaurantResult } from "@/lib/schemas";
import {
  foursquarePlaceSearchResponseSchema,
  foursquareTipsResponseSchema,
  foursquarePhotosResponseSchema,
  type FoursquarePlace,
  type FoursquareTip,
  type FoursquarePhoto,
} from "@/lib/foursquare-schema";

/** Foursquare Places API base URL. Document in README. */
export const FOURSQUARE_BASE_URL = "https://places-api.foursquare.com/places/search";

/** API version header required by Foursquare Places API. */
export const FOURSQUARE_API_VERSION = "2025-06-17";

/** Request timeout in ms. Document in README. Configurable via FOURSQUARE_TIMEOUT_MS env var. */
export const FOURSQUARE_TIMEOUT_MS = (() => {
  const timeout = process.env.FOURSQUARE_TIMEOUT_MS;
  if (timeout) {
    const parsed = parseInt(timeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 15_000; // Default 15 seconds
})();

export type FoursquareResult =
  | { ok: true; results: RestaurantResult[] }
  | { ok: false; status?: number; reason?: string };

function pickVariant(seed: string, options: string[]): string {
  if (options.length === 0) return "";
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) {
    sum += seed.charCodeAt(i);
  }
  return options[sum % options.length] ?? options[0];
}

async function fetchTipsForPlaces(
  places: FoursquarePlace[],
  apiKey: string
): Promise<Map<string, string>> {
  const tipsById = new Map<string, string>();
  const withIds = places.filter((p) => p.fsq_id);

  const limit = Number(process.env.FOURSQUARE_TIPS_LIMIT ?? "3");
  const maxPlaces = Number(process.env.FOURSQUARE_TIPS_PLACES ?? "5");

  const targets = withIds.slice(0, maxPlaces);
  await Promise.all(
    targets.map(async (place) => {
      const id = place.fsq_id!;
      try {
        const url = `https://places-api.foursquare.com/places/${encodeURIComponent(
          id
        )}/tips?limit=${limit}`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${apiKey}`,
            "X-Places-Api-Version": FOURSQUARE_API_VERSION,
          },
        });
        if (!res.ok) return;
        const text = await res.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          return;
        }
        const result = foursquareTipsResponseSchema.safeParse(parsed);
        if (!result.success || result.data.length === 0) return;
        const tip = result.data.find(
          (t: FoursquareTip) => t.text && t.text.trim().length > 0
        );
        if (tip) {
          tipsById.set(id, tip.text.trim());
        }
      } catch (err) {
        // Log error for debugging but don't break the search
        if (process.env.NODE_ENV !== "production") {
          console.error("[Foursquare] Tips fetch error:", err instanceof Error ? err.message : "unknown");
        }
      }
    })
  );

  return tipsById;
}

async function fetchPhotosForPlaces(
  places: FoursquarePlace[],
  apiKey: string
): Promise<Map<string, string[]>> {
  const photosById = new Map<string, string[]>();
  
  // fsq_id is the primary field, but also check for fsq_place_id (v3 API)
  const withIds = places.filter((p) => p.fsq_id || p.fsq_place_id);

  if (withIds.length === 0) {
    return photosById;
  }

  const limit = Number(process.env.FOURSQUARE_PHOTOS_LIMIT ?? "1");
  const maxPlaces = Number(process.env.FOURSQUARE_PHOTOS_PLACES ?? "3");
  const concurrency = Number(process.env.FOURSQUARE_PHOTOS_CONCURRENCY ?? "2");

  const targets = withIds.slice(0, maxPlaces);
  
  // Process photos in batches with concurrency limit
  async function fetchWithRetry(url: string, placeId: string, placeName: string): Promise<string[] | null> {
    const maxRetries = 2;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${apiKey}`,
            "X-Places-Api-Version": FOURSQUARE_API_VERSION,
          },
        });
        
        if (!res.ok) {
          // If rate limited, wait and retry
          if (res.status === 429) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          return null;
        }
        
        const text = await res.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          return null;
        }
        
        const result = foursquarePhotosResponseSchema.safeParse(parsed);
        if (!result.success || result.data.length === 0) {
          return null;
        }

        // Build photo URLs from prefix + width + suffix
        const photoUrls = result.data
          .filter((p: FoursquarePhoto) => p.prefix && p.suffix)
          .slice(0, 3)
          .map((p: FoursquarePhoto) => {
            const width = p.width ?? 300;
            return `${p.prefix}${width}${p.suffix}`;
          });

        return photoUrls.length > 0 ? photoUrls : null;
        
      } catch {
        // Silent error, will retry
      }
    }
    return null;
  }
  
  // Process places in batches
  for (let i = 0; i < targets.length; i += concurrency) {
    const batch = targets.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (place) => {
      const placeId = place.fsq_id ?? place.fsq_place_id;
      if (!placeId) return;
      
      const url = `https://places-api.foursquare.com/places/${encodeURIComponent(placeId)}/photos?limit=${limit}`;
      
      const photoUrls = await fetchWithRetry(url, placeId, place.name);
      if (photoUrls) {
        photosById.set(placeId, photoUrls);
      }
    });
    
    await Promise.all(batchPromises);
    
    // Small delay between batches to avoid overwhelming the API
    if (i + concurrency < targets.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  return photosById;
}

function mapPlaceToResult(
  place: FoursquarePlace,
  params: SearchParamsResolved,
  opts?: { tipText?: string; photoUrls?: string[] }
): RestaurantResult {
  const address =
    place.location?.formatted_address ??
    place.location?.address ??
    [place.location?.locality, place.location?.region, place.location?.country]
      .filter(Boolean)
      .join(", ") ??
    "";
  const category = place.categories?.[0]?.name ?? "Restaurant";
  const categoryLower = category.toLowerCase();
  const nameLower = place.name.toLowerCase();
  const open_now =
    place.closed_bucket === "VeryLikelyOpen" || place.closed_bucket === "LikelyOpen";

  const nearRaw = params.near.trim();
  const nearPhrase = /near me/i.test(nearRaw) ? "your area" : nearRaw;

  const queryTokens = params.query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter(
      (token) =>
        ![
          "best",
          "restaurant",
          "restaurants",
          "food",
          "place",
          "places",
          "near",
          "in",
          "me",
          "the",
          "a",
          "an",
        ].includes(token)
    );
  const searchableText = `${nameLower} ${categoryLower}`;
  const matchedTokens = queryTokens.filter((token) =>
    searchableText.includes(token)
  );
  const primaryKeyword = matchedTokens[0] ?? queryTokens[0] ?? categoryLower;

  const priceWord =
    typeof place.price === "number"
      ? place.price === 1
        ? "budget-friendly"
        : place.price === 2
          ? "casual"
          : place.price === 3
            ? "upscale"
            : "splurge"
      : null;

  const ratingValue = typeof place.rating === "number" ? place.rating : null;
  const ratingPart =
    ratingValue !== null ? `rated ${ratingValue.toFixed(1)}/10` : "";

  const distanceMeters =
    typeof place.distance === "number" ? place.distance : null;
  const distanceKm = distanceMeters !== null ? distanceMeters / 1000 : null;
  const distancePhrase =
    distanceKm === null
      ? null
      : distanceKm < 1
        ? "a quick walk away"
        : distanceKm < 5
          ? `a short drive away (about ${distanceKm.toFixed(1)} km)`
          : `a bit farther out (around ${distanceKm.toFixed(1)} km)`;

  const likelyBroadCategory = /(fast food|cafe|coffee|bakery|dessert|bar)/i.test(
    category
  );
  const hasDirectKeywordMatch = matchedTokens.length > 0;
  const matchTier: "direct" | "reasonable" | "alternative" = hasDirectKeywordMatch
    ? likelyBroadCategory
      ? "reasonable"
      : "direct"
    : "alternative";

  const wantsCheap = /(cheap|budget|affordable|low cost|inexpensive)/i.test(
    params.query
  );
  const cheapAligned = wantsCheap ? place.price == null || place.price <= 2 : null;

  const openPart =
    place.closed_bucket != null ? (open_now ? " that's open now" : " that's currently closed") : "";

  // Description: neutral, place-focused summary
  const descriptionParts: string[] = [];
  const baseAdjective =
    priceWord === "budget-friendly"
      ? "affordable"
      : priceWord === "casual"
        ? "laid-back"
        : priceWord === "upscale"
          ? "upscale"
          : priceWord === "splurge"
            ? "special-occasion"
            : "reliable";

  const qualityTone =
    ratingValue !== null && ratingValue >= 8.5
      ? "top-rated"
      : ratingValue !== null && ratingValue >= 7.5
        ? "well-liked"
        : baseAdjective;

  // Normalize category so we don't say "american restaurant" as the craving
  let normalizedCategory = categoryLower.replace(/restaurant(s)?/g, "").trim();
  if (!normalizedCategory) {
    normalizedCategory = "a meal out";
  }

  const focusNoun =
    matchTier === "direct" && primaryKeyword
      ? primaryKeyword
      : normalizedCategory;

  const baseDescription = pickVariant(place.name, [
    `A ${qualityTone} spot for ${focusNoun}`,
    `A ${qualityTone} place when you’re craving ${focusNoun}`,
    `A ${qualityTone} ${focusNoun} stop`,
  ]);

  const distanceTail = distancePhrase ? ` ${distancePhrase}` : "";

  descriptionParts.push(`${baseDescription}${distanceTail}`);
  if (priceWord) {
    descriptionParts.push(`with ${priceWord} prices`);
  }
  if (ratingPart) {
    descriptionParts.push(ratingPart);
  }

  const generatedDescription =
    descriptionParts.length > 0
      ? `${descriptionParts.join(" ")}${openPart}.`
      : openPart
        ? `A place${openPart}.`
        : "";

  const tipText = opts?.tipText?.trim();
  const descriptionSentence =
    tipText && tipText.length > 0 ? tipText : generatedDescription;

  // Why it's best: short, user-facing summary of fit
  const whyParts: string[] = [];
  if (matchTier === "direct") {
    whyParts.push(
      pickVariant(`${place.name}-why-direct`, [
        `A strong pick when you're craving ${focusNoun} in ${nearPhrase}`,
        `A go-to choice for ${focusNoun} around ${nearPhrase}`,
        `Well-suited if you're in ${nearPhrase} and want ${focusNoun}`,
      ])
    );
  } else if (matchTier === "reasonable") {
    whyParts.push(
      pickVariant(`${place.name}-why-reasonable`, [
        `A nearby option that can work if you're flexible about ${focusNoun}`,
        `Good to consider if the main ${focusNoun} spots are busy`,
        `A reasonable backup when you're in ${nearPhrase} and open to alternatives`,
      ])
    );
  } else {
    whyParts.push(
      pickVariant(`${place.name}-why-alt`, [
        `A nearby alternative if other places are farther or fully booked`,
        `Worth a look as another option in ${nearPhrase}`,
        `Close by, though not a pure ${focusNoun} spot`,
      ])
    );
  }

  if (cheapAligned === true) {
    whyParts.push("with prices that lean budget-friendly");
  } else if (cheapAligned === false) {
    whyParts.push("with pricing that's higher than a typical budget pick");
  }

  if (params.open_now === true && place.closed_bucket != null) {
    if (open_now) {
      whyParts.push("and it is open now as requested");
    } else {
      whyParts.push(
        "but it is currently closed, so another result may be a better fit right now"
      );
    }
  }
  if (ratingValue !== null && ratingValue >= 8) {
    whyParts.push("and it is especially well-reviewed");
  }
  if (distanceMeters !== null && distanceMeters <= 1000) {
    whyParts.push("and it is very close by");
  }

  const whyBestSentence =
    whyParts.length > 0 ? `${whyParts.join(" ")}.` : undefined;

  return {
    name: place.name,
    address,
    category,
    rating: place.rating,
    price: place.price,
    open_now: place.closed_bucket != null ? open_now : undefined,
    distance_meters: place.distance,
    description: descriptionSentence || undefined,
    why_best: whyBestSentence,
    photos: opts?.photoUrls,
  };
}

export type FetchPlaceSearchResult =
  | { ok: true; places: FoursquarePlace[]; minimalResults: RestaurantResult[] }
  | { ok: false; status?: number; reason?: string };

/**
 * Foursquare place search only (no tips, no photos). Returns places and minimal
 * results for fast first paint; use buildFullResultsFromPlaces for tips/photos.
 */
export async function fetchPlaceSearch(
  params: SearchParamsResolved,
  apiKey: string
): Promise<FetchPlaceSearchResult> {
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
    if (process.env.NODE_ENV !== "production") {
      console.log("[Foursquare] Raw search response:", text.slice(0, 2000));
    }

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

    const places = parsedResult.data.results;
    const minimalResults = places.map((place) => mapPlaceToResult(place, params, {}));
    return { ok: true, places, minimalResults };
  } catch (err) {
    clearTimeout(timeoutId);
    if (process.env.NODE_ENV !== "production") {
      console.error("[Foursquare] request failed:", err instanceof Error ? err.message : err);
    }
    return { ok: false };
  }
}

/**
 * Fetch tips and photos for places and map to full RestaurantResult[].
 * Use after fetchPlaceSearch to get results with descriptions and photos.
 */
export async function buildFullResultsFromPlaces(
  places: FoursquarePlace[],
  params: SearchParamsResolved,
  apiKey: string
): Promise<RestaurantResult[]> {
  const tipsById = await fetchTipsForPlaces(places, apiKey);
  const photosById = await fetchPhotosForPlaces(places, apiKey);
  return places.map((place) =>
    mapPlaceToResult(place, params, {
      tipText: place.fsq_id ? tipsById.get(place.fsq_id) : undefined,
      photoUrls: place.fsq_id
        ? photosById.get(place.fsq_id)
        : place.fsq_place_id
          ? photosById.get(place.fsq_place_id)
          : undefined,
    })
  );
}

/**
 * Call Foursquare Place Search with validated SearchParams.
 * Returns mapped results (with tips and photos) or signals upstream error (502).
 */
export async function searchPlaces(
  params: SearchParamsResolved,
  apiKey: string
): Promise<FoursquareResult> {
  const r = await fetchPlaceSearch(params, apiKey);
  if (!r.ok) return r;
  const results = await buildFullResultsFromPlaces(r.places, params, apiKey);
  return { ok: true, results };
}
