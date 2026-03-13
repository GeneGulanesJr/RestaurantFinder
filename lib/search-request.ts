export type PriceTier = 1 | 2 | 3 | 4;

export interface SearchRequest {
  query: string;
  /**
   * Human-readable area or neighborhood, e.g. "downtown LA" or "near me".
   * This will ultimately map into the backend's location/near parameters.
   */
  location: string;
  /**
   * Maximum number of results to request from the backend.
   */
  limit: number;

  /**
   * High-level cuisine label (e.g. "sushi", "mexican").
   */
  cuisine?: string;

  /**
   * Price range represented as 1–4, corresponding to $–$$$$ in the UI.
   */
  priceRange?: PriceTier;

  /**
   * Maximum distance in meters from the location.
   */
  maxDistanceMeters?: number;

  /**
   * Minimum acceptable rating (e.g. 3.5, 4.0).
   */
  minRating?: number;

  /**
   * Whether results must be currently open.
   */
  openNow?: boolean;

  /**
   * Optional "vibe" or context tags (e.g. "quick-lunch", "date-night").
   */
  vibeTags?: string[];
}

export type SearchRefinementEvent =
  | "search_refinement_shown"
  | "search_refinement_completed"
  | "search_refinement_dismissed"
  | "search_refinement_choice_selected"
  | "search_refinement_bypassed";

export interface SearchRefinementTelemetryPayload {
  event: SearchRefinementEvent;
  /**
   * The original free-text search message the user typed.
   */
  message: string;
  /**
   * Snapshot of the in-progress search request at the time of the event.
   */
  request: Partial<SearchRequest>;
}

/**
 * Lightweight telemetry hook for search refinement.
 * This intentionally uses console logging so we can later
 * wire it up to a real analytics destination without touching callers.
 */
export function recordSearchRefinementEvent(payload: SearchRefinementTelemetryPayload): void {
  if (typeof window === "undefined") {
    return;
  }

  // For now, log to the console as a stub.
  // This keeps the hook side-effectful and observable in dev tools.
  // eslint-disable-next-line no-console
  console.info("[search-refinement]", payload.event, payload);
}

export type SearchInputClassification =
  | "execute_directly"
  | "needs_refinement_short_generic"
  | "needs_refinement_missing_location";

export interface ClassifySearchInputOptions {
  /**
   * The raw text the user submitted.
   */
  message: string;
  /**
   * Current in-progress request state, if any.
   */
  currentRequest?: Partial<SearchRequest>;
}

const GENERIC_CUISINE_WORDS = [
  "food",
  "restaurants",
  "restaurant",
  "places",
  "good places",
  "something to eat",
];

const LOCATION_HINT_WORDS = ["near me", "nearby", "close by", "around here"];

function hasLocationSignal(message: string, currentRequest?: Partial<SearchRequest>): boolean {
  if (currentRequest?.location && currentRequest.location.trim().length > 0) {
    return true;
  }

  const lower = message.toLowerCase();
  if (LOCATION_HINT_WORDS.some((hint) => lower.includes(hint))) {
    return true;
  }

  // Very lightweight heuristic: treat anything that contains a comma as
  // potentially "query, location" (e.g. "sushi, downtown").
  if (lower.includes(",")) {
    return true;
  }

  return false;
}

function isShortAndGeneric(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return true;

  const wordCount = normalized.split(/\s+/).length;
  if (wordCount <= 3) {
    // Short inputs like "sushi" or "good places" should typically be refined.
    return true;
  }

  return GENERIC_CUISINE_WORDS.some((generic) => normalized === generic);
}

/**
 * Classify whether a given search input should execute immediately
 * or route the user into the guided refinement modal.
 *
 * This function intentionally uses conservative heuristics so we only
 * trigger refinement for clearly vague or under-specified input.
 */
export function classifySearchInput(options: ClassifySearchInputOptions): SearchInputClassification {
  const message = options.message.trim();
  const currentRequest = options.currentRequest;

  if (!message) {
    return "needs_refinement_short_generic";
  }

  if (isShortAndGeneric(message)) {
    return "needs_refinement_short_generic";
  }

  if (!hasLocationSignal(message, currentRequest)) {
    return "needs_refinement_missing_location";
  }

  return "execute_directly";
}

