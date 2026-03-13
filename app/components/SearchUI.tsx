"use client";

import { useState } from "react";

const API_CODE = "pioneerdevai";

type RestaurantResult = {
  name: string;
  address: string;
  category: string;
  rating?: number;
  price?: number;
  open_now?: boolean;
  distance_meters?: number;
};

type ApiSuccess = {
  results: RestaurantResult[];
  interpreted: { query: string; near: string; limit: number };
};

type ApiError = {
  error: string;
  detail?: string;
  retry_after?: number;
};

export default function SearchUI() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RestaurantResult[] | null>(null);
  const [interpreted, setInterpreted] = useState<ApiSuccess["interpreted"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setError(null);
    setResults(null);
    setInterpreted(null);
    setLoading(true);

    try {
      const url = `/api/execute?message=${encodeURIComponent(trimmed)}&code=${encodeURIComponent(API_CODE)}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setResults((data as ApiSuccess).results ?? []);
        setInterpreted((data as ApiSuccess).interpreted ?? null);
        return;
      }

      const err = data as ApiError;
      if (res.status === 429) {
        const wait = err.retry_after ?? 60;
        setError(`Too many requests. Please wait ${wait} seconds before trying again.`);
      } else {
        setError(err.detail ?? err.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restaurant Finder</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Log out
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
          disabled={loading || !message.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
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
