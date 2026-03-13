"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import {
  type SearchRequest,
  classifySearchInput,
  recordSearchRefinementEvent,
} from "@/lib/search-request";
import { SearchRefinementModal } from "@/app/components/SearchRefinementModal";

// Zod schemas for API response validation
const restaurantResultSchema = z.object({
  name: z.string(),
  address: z.string(),
  category: z.string(),
  rating: z.number().optional(),
  price: z.number().optional(),
  open_now: z.boolean().optional(),
  distance_meters: z.number().optional(),
  description: z.string().optional(),
  why_best: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

const apiSuccessSchema = z.object({
  results: z.array(restaurantResultSchema),
  interpreted: z.object({
    query: z.string(),
    near: z.string(),
    limit: z.number(),
  }),
});

const apiErrorSchema = z.object({
  error: z.string(),
  detail: z.string().optional(),
  retry_after: z.number().optional(),
});

type RestaurantResult = z.infer<typeof restaurantResultSchema>;
type ApiSuccess = z.infer<typeof apiSuccessSchema>;
type ApiError = z.infer<typeof apiErrorSchema>;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
    }

    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", listener);
      }
    };
  }, []);

  return prefersReducedMotion;
}

type StreamingTextProps = {
  text: string;
  className?: string;
  charDelayMs?: number;
  respectReducedMotion?: boolean;
};

function StreamingText({
  text,
  className,
  charDelayMs = 65,
  respectReducedMotion = true,
}: StreamingTextProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!text) {
      setVisibleCount(0);
      return;
    }

    if (respectReducedMotion && prefersReducedMotion) {
      setVisibleCount(text.length);
      return;
    }

    setVisibleCount(0);
    const interval = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= text.length) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, charDelayMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [text, charDelayMs, prefersReducedMotion]);

  return <span className={className}>{text.slice(0, visibleCount)}</span>;
}

export default function SearchUI() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RestaurantResult[] | null>(null);
  const [interpreted, setInterpreted] = useState<ApiSuccess["interpreted"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingLine, setLoadingLine] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<number>(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<number>(0);
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  const [showRefinementModal, setShowRefinementModal] = useState(false);

  // Cleanup countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitRemaining !== null && rateLimitRemaining > 0) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      countdownIntervalRef.current = setInterval(() => {
        setRateLimitRemaining((prev) => {
          if (prev === null || prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [rateLimitRemaining]);

  async function executeSearch(withMessage: string) {
    const trimmed = withMessage.trim();
    if (!trimmed) return;

    const requestId = currentRequestRef.current + 1;
    currentRequestRef.current = requestId;

    setError(null);
    setResults(null);
    setInterpreted(null);
    setLoadingLine(
      [
        "Interpreting your request…",
        "Searching nearby matches…",
        "Applying your filters…",
        "Pulling results…",
      ][Math.floor(Math.random() * 4)],
    );
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("message", trimmed);
      if (searchRequest) {
        params.set("structured", JSON.stringify(ensureDefaults(searchRequest)));
      }
      const res = await fetch(`/api/execute?${params.toString()}`, { credentials: "include" });

      if (requestId !== currentRequestRef.current) {
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const validationResult = apiSuccessSchema.safeParse(data);
        if (validationResult.success) {
          setResults(validationResult.data.results);
          setInterpreted(validationResult.data.interpreted);
        } else {
          setError("Invalid response from server. Please try again.");
        }
        return;
      }

      const errorValidationResult = apiErrorSchema.safeParse(data);
      if (errorValidationResult.success) {
        const err = errorValidationResult.data;
        if (res.status === 429) {
          const wait = err.retry_after ?? 60;
          setError(`Too many requests. Please wait ${wait} seconds before trying again.`);
          setRateLimitRemaining(wait);
        } else {
          setError(err.detail ?? err.error ?? "Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const baseRequest: SearchRequest =
      searchRequest ?? {
        query: trimmed,
        location: "",
        limit: 10,
      };

    const classification = classifySearchInput({
      message: trimmed,
      currentRequest: baseRequest,
    });

    if (classification === "execute_directly") {
      recordSearchRefinementEvent({
        event: "search_refinement_bypassed",
        message: trimmed,
        request: baseRequest,
      });
      setSearchRequest(baseRequest);
      await executeSearch(trimmed);
      return;
    }

    recordSearchRefinementEvent({
      event: "search_refinement_shown",
      message: trimmed,
      request: baseRequest,
    });
    setSearchRequest(baseRequest);
    setShowRefinementModal(true);
  }

  function ensureDefaults(request: SearchRequest): SearchRequest {
    return {
      ...request,
      limit: request.limit || 10,
      location: request.location || "",
      priceRange: request.priceRange ?? 2,
      maxDistanceMeters: request.maxDistanceMeters ?? 3000,
      minRating: request.minRating ?? 3.5,
      openNow: request.openNow ?? false,
      vibeTags: request.vibeTags ?? [],
    };
  }

  async function handleRefinementApply(request: SearchRequest) {
    const completed = ensureDefaults(request);
    setSearchRequest(completed);
    setShowRefinementModal(false);
    recordSearchRefinementEvent({
      event: "search_refinement_completed",
      message,
      request: completed,
    });
    await executeSearch(message);
  }

  async function handleRefinementSkip(request: SearchRequest) {
    const withDefaults = ensureDefaults(request);
    setSearchRequest(withDefaults);
    setShowRefinementModal(false);
    recordSearchRefinementEvent({
      event: "search_refinement_bypassed",
      message,
      request: withDefaults,
    });
    await executeSearch(message);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/logout", { method: "POST", credentials: "include" });
      if (res.ok) {
        window.location.href = "/login";
      } else {
        setError("Failed to logout. Please try again.");
      }
    } catch {
      setError("Network error during logout. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="rf-enter flex items-end justify-between gap-4">
        <div>
          <div className="inline-block rounded-xl border border-border bg-surface/70 px-4 py-3 shadow-soft">
            <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.02] tracking-tight">
              Restaurant Finder<span className="text-accent">.</span>
            </h1>
            <p className="mt-2 max-w-[56ch] text-sm text-muted">
              Ask like a human. We’ll interpret your intent, then pull places that match—fast, clear, and
              readable.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="rf-focusable text-sm text-muted underline decoration-border underline-offset-4 hover:text-fg focus-visible:rf-focus disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rf-enter rf-enter-delay-1 rounded-xl border border-border bg-surface shadow-soft"
      >
        <div className="px-6 pt-6 pb-5">
          <label htmlFor="search-message" className="block text-sm font-medium">
            What are you looking for?
          </label>
          <textarea
            id="search-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="e.g. Cheap sushi in downtown LA that is open now"
            rows={3}
            disabled={loading}
            className="rf-focusable mt-2 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/70 shadow-sm focus-visible:rf-focus disabled:opacity-50"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading || !message.trim() || rateLimitRemaining !== null}
              className="rf-btn-motion rf-focusable inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink shadow-sm transition-colors hover:bg-accent/90 focus-visible:rf-focus disabled:opacity-50 disabled:transform-none"
            >
              {loading
                ? "Searching…"
                : rateLimitRemaining !== null
                  ? `Please wait ${rateLimitRemaining}s`
                  : "Search"}
            </button>
            <p className="text-xs text-muted">
              Tip: include <span className="text-fg">near</span>,{" "}
              <span className="text-fg">price</span>, and{" "}
              <span className="text-fg">open now</span> if it matters.
            </p>
          </div>
          {loading && loadingLine && (
            <p className="rf-reveal mt-3 text-xs text-muted">{loadingLine}</p>
          )}
        </div>
      </form>

      {error && (
        <div
          className="rf-reveal rounded-xl border border-danger/30 bg-danger-surface px-5 py-4 text-fg"
          role="alert"
        >
          {error}
        </div>
      )}

      {interpreted && !error && (
        <div className="rf-reveal rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-medium tracking-wide text-muted">INTERPRETED</p>
          <p className="mt-1 text-sm text-fg">
            <span className="text-muted">Query</span>{" "}
            <StreamingText
              key={`interpreted-query-${interpreted.query}-${interpreted.near}-${interpreted.limit}`}
              text={interpreted.query}
              className="font-medium inline"
              respectReducedMotion={false}
            />{" "}
            <span className="text-muted">near</span>{" "}
            <StreamingText
              key={`interpreted-near-${interpreted.near}-${interpreted.limit}`}
              text={interpreted.near}
              className="font-medium inline"
              respectReducedMotion={false}
            />{" "}
            <span className="text-muted">(limit </span>
            <StreamingText
              key={`interpreted-limit-${interpreted.limit}`}
              text={String(interpreted.limit)}
              className="font-medium inline"
              respectReducedMotion={false}
            />
            <span className="text-muted">)</span>
          </p>
        </div>
      )}

      {results && !error && (
        <section className="rf-reveal space-y-3">
          <h2 className="text-lg font-semibold text-fg">
            {results.length === 0 ? "No results" : `Results (${results.length})`}
          </h2>
          {results.length === 0 && (
            <p className="text-sm text-muted">
              Try adding a neighborhood, a cuisine, or a constraint like “open now”.
            </p>
          )}
          <ul className="space-y-3">
            {results.map((r, i) => (
              <li
                key={i}
                className="rf-reveal rounded-xl border border-border bg-surface px-5 py-4 shadow-soft"
                style={{ animationDelay: `${150 + i * 100}ms` }}
              >
                {r.photos && r.photos.length > 0 && (
                  <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                    {r.photos.slice(0, 3).map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`${r.name} photo ${idx + 1}`}
                        className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-medium text-fg">{r.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      <StreamingText
                        key={`result-address-${r.name}-${i}`}
                        text={r.address || "—"}
                        className="inline"
                        respectReducedMotion={false}
                      />
                    </p>
                    <p className="mt-1 text-xs text-muted">{r.category}</p>
                  </div>
                  {r.open_now != null && (
                    <span
                      className={[
                        "shrink-0 rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-medium",
                        r.open_now ? "text-fg" : "text-muted",
                      ].join(" ")}
                    >
                      {r.open_now ? "Open now" : "Closed"}
                    </span>
                  )}
                </div>

                {r.description && (
                  <p className="mt-3 text-sm text-fg">{r.description}</p>
                )}
                {r.why_best && (
                  <p className="mt-1 text-xs text-muted">{r.why_best}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  {r.rating != null && (
                    <span className="rounded-full border border-border bg-bg px-2.5 py-1">
                      Rating <span className="text-fg">{r.rating}</span>
                    </span>
                  )}
                  {r.price != null && (
                    <span className="rounded-full border border-border bg-bg px-2.5 py-1">
                      Price <span className="text-fg">{"$".repeat(r.price)}</span>
                    </span>
                  )}
                  {r.distance_meters != null && (
                    <span className="rounded-full border border-border bg-bg px-2.5 py-1">
                      <span className="text-fg">{Math.round(r.distance_meters)}m</span> away
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <SearchRefinementModal
        isOpen={showRefinementModal}
        originalMessage={message}
        inProgressRequest={
          searchRequest ?? {
            query: message.trim(),
            location: "",
            limit: 10,
          }
        }
        onChangeRequest={(next) => setSearchRequest(next)}
        onApply={handleRefinementApply}
        onSkip={handleRefinementSkip}
        onClose={() => {
          setShowRefinementModal(false);
          recordSearchRefinementEvent({
            event: "search_refinement_dismissed",
            message,
            request:
              searchRequest ??
              {
                query: message.trim(),
                location: "",
                limit: 10,
              },
          });
        }}
      />
    </div>
  );
}
