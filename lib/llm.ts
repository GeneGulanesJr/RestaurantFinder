import {
  searchParamsSchema,
  resolveSearchParams,
  type SearchParams,
  type SearchParamsResolved,
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
