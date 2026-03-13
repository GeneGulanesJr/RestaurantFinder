"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";

// Zod schemas for API response validation
const restaurantResultSchema = z.object({
  name: z.string(),
  address: z.string(),
  category: z.string(),
  rating: z.number().optional(),
  price: z.number().optional(),
  open_now: z.boolean().optional(),
  distance_meters: z.number().optional(),
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

export default function SearchUI() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RestaurantResult[] | null>(null);
  const [interpreted, setInterpreted] = useState<ApiSuccess["interpreted"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setError(null);
    setResults(null);
    setInterpreted(null);
    setLoading(true);

    try {
      const url = `/api/execute?message=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Validate API response with Zod
        const validationResult = apiSuccessSchema.safeParse(data);
        if (validationResult.success) {
          setResults(validationResult.data.results);
          setInterpreted(validationResult.data.interpreted);
        } else {
          setError("Invalid response from server. Please try again.");
        }
        return;
      }

      // Validate error response with Zod
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restaurant Finder</h1>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-sm text-gray-600 hover:text-gray-900 underline disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="search-message" className="block text-sm font-medium">
          What are you looking for?
        </label>
        <textarea
          id="search-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Cheap sushi in downtown LA that is open now"
          rows={3}
          disabled={loading}
          className="w-full border border-gray-300 rounded px-3 py-2 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !message.trim() || rateLimitRemaining !== null}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading 
            ? "Searching…" 
            : rateLimitRemaining !== null 
              ? `Please wait ${rateLimitRemaining}s` 
              : "Search"
          }
        </button>
      </form>

      {error && (
        <div className="p-4 rounded bg-red-50 text-red-800" role="alert">
          {error}
        </div>
      )}

      {interpreted && !error && (
        <p className="text-sm text-gray-600">
          Interpreted as: <strong>{interpreted.query}</strong> near{" "}
          <strong>{interpreted.near}</strong> (limit {interpreted.limit})
        </p>
      )}

      {results && !error && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {results.length === 0 ? "No results" : `Results (${results.length})`}
          </h2>
          <ul className="space-y-3">
            {results.map((r, i) => (
              <li
                key={i}
                className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <h3 className="font-medium">{r.name}</h3>
                <p className="text-sm text-gray-600">{r.address || "—"}</p>
                <p className="text-sm text-gray-500">{r.category}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {r.rating != null && (
                    <span>Rating: {r.rating}</span>
                  )}
                  {r.price != null && (
                    <span>Price: {"$".repeat(r.price)}</span>
                  )}
                  {r.open_now != null && (
                    <span>{r.open_now ? "Open now" : "Closed"}</span>
                  )}
                  {r.distance_meters != null && (
                    <span>{Math.round(r.distance_meters)} m away</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
