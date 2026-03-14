"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import {
  type SearchRequest,
  classifySearchInput,
  recordSearchRefinementEvent,
} from "@/lib/search-request";
import { SearchRefinementModal } from "@/app/components/SearchRefinementModal";
import { ResultDetailsModal } from "./ResultDetailsModal";

// SVG Icons as components
const SearchIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const StarIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const DollarIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const UtensilsIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

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

export type ResultPlace = RestaurantResult;

function PriceDisplay({ price }: { price?: number }) {
  if (!price) return null;
  return (
    <span className="text-accent font-medium">
      {"$".repeat(price)}
      <span className="text-muted">{"$".repeat(4 - price)}</span>
    </span>
  );
}

function RatingDisplay({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      <StarIcon className="h-3.5 w-3.5 text-rating" filled />
      <span className="text-sm font-medium text-fg">{rating.toFixed(1)}</span>
    </div>
  );
}

function DistanceDisplay({ meters }: { meters?: number }) {
  if (!meters) return null;
  const miles = meters / 1609.34;
  return (
    <span className="text-sm text-muted">
      {miles < 0.1 ? `${(miles * 5280).toFixed(0)} ft` : `${miles.toFixed(1)} mi`}
    </span>
  );
}

function OpenNowBadge({ openNow }: { openNow?: boolean }) {
  if (openNow === undefined) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium ${openNow ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-success animate-pulse' : 'bg-muted'}`} />
      {openNow ? 'Open' : 'Closed'}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 rf-spinner text-accent-ink" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function SearchUI() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RestaurantResult[] | null>(null);
  const [interpreted, setInterpreted] = useState<ApiSuccess["interpreted"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<number>(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<number>(0);
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  const [showRefinementModal, setShowRefinementModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<RestaurantResult | null>(null);

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
    setLoadingStep("Searching for restaurants…");
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorValidationResult = apiErrorSchema.safeParse(data);
        if (errorValidationResult.success) {
          const err = errorValidationResult.data;
          if (res.status === 429) {
            const wait = err.retry_after ?? 60;
            setError(`You’ve made too many searches. Wait ${wait} seconds, then try again.`);
            setRateLimitRemaining(wait);
          } else {
            setError(err.detail ?? err.error ?? "We couldn’t complete your search. Please try again.");
          }
        } else {
          setError("We couldn’t complete your search. Please try again.");
        }
        return;
      }

      const contentType = res.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/x-ndjson") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (requestId !== currentRequestRef.current) return;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            try {
              const msg = JSON.parse(trimmedLine) as { type: string; payload: unknown };
              if (msg.type === "interpreted") {
                const payload = msg.payload as { query: string; near: string; limit: number };
                setInterpreted(payload);
              } else if (msg.type === "results") {
                const validationResult = z.array(restaurantResultSchema).safeParse(msg.payload);
                if (validationResult.success) {
                  setResults(validationResult.data);
                  setLoading(false);
                }
              } else if (msg.type === "error") {
                const payload = msg.payload as { error?: string; detail?: string };
                setError(payload.detail ?? payload.error ?? "We couldn’t complete your search. Please try again.");
              }
            } catch {
              // ignore malformed lines
            }
          }
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const validationResult = apiSuccessSchema.safeParse(data);
        if (validationResult.success) {
          setResults(validationResult.data.results);
          setInterpreted(validationResult.data.interpreted);
        } else {
          setError("We got an unexpected response. Please try again.");
        }
      }
    } catch {
      setError("Check your connection and try again.");
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
        setError("We couldn’t sign you out. Please try again.");
      }
    } catch {
      setError("Check your connection and try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const exampleSearches = [
    "sushi downtown",
    "cheap tacos open now",
    "date night Italian",
    "quick lunch nearby",
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="lg:flex lg:gap-8 lg:items-start">
        <div className="min-w-0 lg:flex-1">
      {/* Header */}
      <header className="rf-enter mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo: solid accent (no gradient) */}
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent">
              <UtensilsIcon className="h-6 w-6 text-accent-ink" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-fg tracking-tight">
                Restaurant Finder
              </h1>
              <p className="mt-0.5 text-sm text-muted">
                Discover your next favorite dining spot
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rf-focusable text-sm font-medium text-muted hover:text-fg focus-visible:rf-focus rounded-sm border border-border/80 bg-transparent px-3 py-2 transition-colors hover:border-accent/40 disabled:opacity-50 min-h-[44px] min-w-[44px]"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      {/* Search Section */}
      <section className="rf-enter rf-enter-delay-1 mb-8">
        <div className="relative overflow-hidden rounded-md border border-border/60 bg-surface">
          
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                  <label htmlFor="search-message" className="sr-only">Search for restaurants</label>
                  <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                    <SearchIcon className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    id="search-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="e.g. sushi downtown, cheap tacos open now"
                    disabled={loading}
                    className="rf-focusable w-full rounded-md border border-border/50 bg-card py-4 pl-12 pr-4 text-base text-fg placeholder:text-muted/60 shadow-sm focus-visible:rf-focus disabled:opacity-60"
                  />
                </div>
                
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-muted">
                    Examples: <span className="font-medium text-fg/70">sushi downtown</span> or <span className="font-medium text-fg/70">cheap tacos open now</span>
                  </p>
                  <button
                    type="submit"
                    disabled={loading || !message.trim() || rateLimitRemaining !== null}
                    className="rf-btn-motion rf-focusable inline-flex items-center gap-2 rounded-md bg-accent px-8 py-4 text-lg font-semibold text-accent-ink shadow-card hover:bg-accent/90 hover:shadow-hover focus-visible:rf-focus disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        <span>Searching…</span>
                      </>
                    ) : rateLimitRemaining !== null ? (
                      <>
                        <span className="rf-loading-dots">
                          <span>.</span><span>.</span><span>.</span>
                        </span>
                        <span>Wait {rateLimitRemaining}s</span>
                      </>
                    ) : (
                      <>
                        <span>Find Restaurants</span>
                        <ChevronRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {/* Loading State */}
          {loading && loadingStep && (
            <div className="border-t border-border/40 bg-card/50 px-6 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10">
                  <div className="rf-spinner h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-fg">{loadingStep}</p>
                  <p className="text-xs text-muted">This usually takes 10–30 seconds.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div
          className="rf-reveal mb-6 rounded-md border border-danger/30 bg-danger-surface px-5 py-4 shadow-soft"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-danger/10">
              <span className="text-sm">⚠</span>
            </div>
            <div>
              <p className="font-medium text-fg">Search didn’t work</p>
              <p className="mt-1 text-sm text-danger">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Interpreted Search */}
      {interpreted && !error && (
        <div className="rf-reveal mb-6 rounded-md border border-accent/20 bg-accent/5 px-5 py-4">
          <div className="flex items-center gap-2 text-sm">
            <LocationIcon className="h-4 w-4 text-accent" />
            <span className="font-medium text-fg">Results for</span>
            <span className="text-accent font-semibold">&ldquo;{interpreted.query}&rdquo;</span>
            <span className="text-muted">near</span>
            <span className="font-semibold text-fg">{interpreted.near}</span>
            <span className="text-muted">· {interpreted.limit} places</span>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results && !error && (
        <section className="rf-reveal">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-fg">
              {results.length === 0 ? "No restaurants found" : `${results.length} restaurants found`}
            </h2>
            {results.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <MapPinIcon className="h-4 w-4" />
                <span>Sorted by best match</span>
              </div>
            )}
          </div>
          
          {results.length === 0 && (
            <div className="rounded-md border border-dashed border-border bg-card/50 p-8 text-center">
              <UtensilsIcon className="mx-auto h-12 w-12 text-muted/40" />
              <p className="mt-4 text-muted">No restaurants found for this search.</p>
              <p className="mt-2 text-sm text-muted/70">Try a different cuisine or add a location (e.g. &ldquo;near downtown&rdquo;).</p>
            </div>
          )}
          
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((r, i) => {
              const isSelected = selectedResult === r;
              const isTopPick = i === 0 && results.length > 1;
              return (
                <article
                  key={`${r.name}-${r.address}`}
                  className={[
                    "rf-enter group relative overflow-hidden rounded-md border bg-surface p-5 shadow-card transition-all hover:shadow-hover rf-focusable cursor-pointer",
                    isSelected ? "border-accent ring-2 ring-accent/20" : "border-border/60 hover:border-accent/40",
                    isTopPick ? "ring-1 ring-accent/15" : "",
                  ].join(" ")}
                  style={{ animationDelay: `${100 + i * 80}ms` }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedResult(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedResult(r);
                    }
                  }}
                >
                  {/* Card header with category + optional top pick */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {isTopPick && (
                        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                          Top pick
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                        <UtensilsIcon className="h-3 w-3" />
                        {r.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.rating && <RatingDisplay rating={r.rating} />}
                      {r.open_now !== undefined && <OpenNowBadge openNow={r.open_now} />}
                    </div>
                  </div>
                  
                  {/* Restaurant name */}
                  <h3 className="font-display text-lg font-semibold text-fg group-hover:text-accent transition-colors">
                    {r.name}
                  </h3>
                  
                  {/* Address */}
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                    <LocationIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{r.address}</span>
                  </div>
                  
                  {/* Price & Distance */}
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    {r.price !== undefined && <PriceDisplay price={r.price} />}
                    {r.distance_meters !== undefined && <DistanceDisplay meters={r.distance_meters} />}
                  </div>
                  
                  {/* Why it's recommended — typographic, not card-in-card */}
                  {r.why_best && (
                    <p className="mt-4 border-l-2 border-accent/40 pl-3 text-sm italic text-muted">
                      {r.why_best}
                    </p>
                  )}
                  
                  {/* Hover indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-ink">
                      <ChevronRightIcon className="h-4 w-4" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

        </div>

        {/* Right sidebar: uses side space from lg up */}
        <aside
          className="hidden lg:block lg:w-56 lg:shrink-0 lg:sticky lg:top-8"
          aria-label="Example searches"
        >
          <div className="rounded-md border border-border/60 bg-surface/80 p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              Example searches
            </p>
            <ul className="space-y-2">
              {exampleSearches.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => setMessage(q)}
                    className="rf-focusable w-full text-left rounded-sm border border-transparent px-3 py-2 text-sm text-fg hover:bg-card hover:border-border/60 focus-visible:rf-focus transition-colors"
                  >
                    &ldquo;{q}&rdquo;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Search Refinement Modal */}
      {showRefinementModal && searchRequest && (
        <SearchRefinementModal
          isOpen={showRefinementModal}
          originalMessage={message}
          inProgressRequest={searchRequest}
          onChangeRequest={setSearchRequest}
          onApply={handleRefinementApply}
          onSkip={handleRefinementSkip}
          onClose={() => setShowRefinementModal(false)}
        />
      )}

      {/* Result Details Modal */}
      <ResultDetailsModal
        isOpen={selectedResult !== null}
        place={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
}
