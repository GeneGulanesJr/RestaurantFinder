import {
  searchParamsSchema,
  resolveSearchParams,
  type SearchParams,
  type SearchParamsResolved,
  type RestaurantResult,
} from "@/lib/schemas";

/** OpenRouter model ID. Document in README. */
export const OPENROUTER_MODEL_ID = "openai/gpt-3.5-turbo";

/** Request timeout in ms. Document in README. Configurable via OPENROUTER_TIMEOUT_MS env var. */
export const OPENROUTER_TIMEOUT_MS = (() => {
  const timeout = process.env.OPENROUTER_TIMEOUT_MS;
  if (timeout) {
    const parsed = parseInt(timeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 15_000; // Default 15 seconds
})();

const SYSTEM_PROMPT = `You are a restaurant search intent parser. Given a user message, output a single JSON object and nothing else. No markdown, no code fences, no explanation. The JSON must have this shape and types:

- query (string, required): the food/cuisine/restaurant type, e.g. "sushi", "pizza"
- near (string, required): the location, e.g. "downtown Los Angeles"
- open_now (boolean, optional): true only if the user asked for places open now
- price (string, optional): "1" | "2" | "3" | "4" (1=cheap, 4=expensive); omit if not specified
- limit (number, optional): max results, default 10; omit to use default

If the message is not about restaurant search or cannot be interpreted, respond with a JSON object that has "uninterpretable": true and optionally "reason": "brief reason". Otherwise omit "uninterpretable".`;

export type InterpretResult =
  | { ok: true; params: SearchParamsResolved }
  | { ok: false; detail: string };

export type EnrichedRecommendation = {
  index: number;
  description?: string;
  why_best?: string;
};

/**
 * Call OpenRouter to interpret the user message into SearchParams.
 * Returns validated, resolved params (with default limit) or an error detail for 422.
 */
export async function interpretMessage(
  message: string,
  apiKey: string
): Promise<InterpretResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://restaurant-finder.local",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL_ID,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        ok: false,
        detail: `OpenRouter API error: ${res.status} ${res.statusText}`,
      };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content =
      data.choices?.[0]?.message?.content?.trim() ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { ok: false, detail: "Invalid JSON from interpreter" };
    }

    // Defensive: if the model forgot required fields, patch them from the original message
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.query !== "string" || !obj.query.trim()) {
        obj.query = message;
      }
      if (typeof obj.near !== "string" || !obj.near.trim()) {
        // Fallback to a generic but concrete location so Foursquare has something geocodable.
        obj.near = "Angeles, Pampanga";
      }
    }

    const parsedResult = searchParamsSchema.safeParse(parsed);
    if (!parsedResult.success) {
      const msg = parsedResult.error.flatten().formErrors?.[0]
        ?? parsedResult.error.message
        ?? "Schema validation failed";
      return {
        ok: false,
        detail: typeof msg === "string" ? msg : "Schema validation failed",
      };
    }

    const validated: SearchParams = parsedResult.data;
    if (validated.uninterpretable) {
      return {
        ok: false,
        detail: validated.reason ?? "Message could not be interpreted as restaurant search",
      };
    }

    return {
      ok: true,
      params: resolveSearchParams(validated),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return { ok: false, detail: "Interpretation request timed out" };
      }
      return { ok: false, detail: err.message };
    }
    return { ok: false, detail: "Unknown error during interpretation" };
  }
}

const RECOMMEND_SYSTEM_PROMPT = `You help turn restaurant search results into concise, human recommendations.

Given:
- the interpreted search (query, near, open_now, price)
- a list of places with basic data

You MUST respond with ONLY a JSON array (no markdown, no prose) where each item has:
- index (number): index of the place in the input list
- description (string, optional): 1 short sentence describing the place in friendly, natural language
- why_best (string, optional): 1 short sentence explaining why this place is a good or reasonable option for the search

Guidelines:
- Sound like a local making suggestions, not like an AI explaining ranking logic.
- Focus on food, vibe, and distance (e.g. "cozy ramen spot about 2 km away", "casual American diner near downtown").
- Do NOT mention "tokens", "matching", "schema", or "query parsing".
- Do NOT repeat the user query verbatim unless it feels natural.
- Avoid generic phrases like "go-to spot" or "strong match for your search".
- Stay under ~25 words per sentence.
- If information is missing (e.g. rating), just omit it instead of apologizing.`;

export async function enrichRecommendationsWithLLM(
  params: SearchParamsResolved,
  results: RestaurantResult[],
  apiKey: string
): Promise<EnrichedRecommendation[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const payload = {
      interpreted: {
        query: params.query,
        near: params.near,
        open_now: params.open_now ?? false,
        price: params.price ?? null,
      },
      places: results.map((r, index) => ({
        index,
        name: r.name,
        address: r.address,
        category: r.category,
        rating: r.rating ?? null,
        price: r.price ?? null,
        distance_meters: r.distance_meters ?? null,
        description: r.description ?? null,
      })),
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://restaurant-finder.local",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL_ID,
        messages: [
          { role: "system", content: RECOMMEND_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[llm] enrichRecommendationsWithLLM OpenRouter error", res.status, res.statusText);
      }
      return [];
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      if (process.env.NODE_ENV !== "production") {
        console.error("[llm] enrichRecommendationsWithLLM invalid JSON content");
      }
      return [];
    }

    if (!Array.isArray(parsed)) {
      return [];
    }

    const result = (parsed as EnrichedRecommendation[]).filter(
      (item) => typeof item.index === "number"
    );
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[llm] enrichRecommendationsWithLLM failed",
        err instanceof Error ? err.message : err
      );
    }
    return [];
  }
}
