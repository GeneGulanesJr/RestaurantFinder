"use client";

import { useState, useEffect } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");

  // Fetch CSRF token on component mount
  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const res = await fetch("/api/csrf", { credentials: "include" });
        const data = await res.json();
        if (data.csrf_token) {
          setCsrfToken(data.csrf_token);
        }
      } catch {
        // If CSRF token fetch fails, continue without it (for dev mode)
        console.warn("Failed to fetch CSRF token");
      }
    }
    fetchCsrfToken();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, csrf_token: csrfToken }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      setError(data.error ?? "Invalid username or password");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rf-enter rounded-xl border border-border bg-surface shadow-soft">
          <div className="px-6 pt-6 pb-5">
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight">
              Restaurant Finder
              <span className="align-top text-accent">.</span>
            </h1>
            <p className="mt-2 text-sm text-muted">
              Sign in, then type what you want—price, vibes, “open now”… we’ll do the parsing.
            </p>
          </div>
          <div className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="rf-focusable mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/70 shadow-sm focus-visible:rf-focus disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="rf-focusable mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/70 shadow-sm focus-visible:rf-focus disabled:opacity-50"
                />
              </div>
              {error && (
                <div
                  className="rf-reveal rounded-lg border border-danger/30 bg-danger-surface px-3 py-2 text-sm text-fg"
                  role="alert"
                >
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="rf-btn-motion rf-focusable w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink shadow-sm transition-colors hover:bg-accent/90 focus-visible:rf-focus disabled:opacity-50 disabled:transform-none"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-muted">
              Demo: username <strong className="text-fg">demo</strong>, password{" "}
              <strong className="text-fg">1234</strong>
            </p>
          </div>
        </div>
        <p className="rf-enter rf-enter-delay-1 mt-6 text-center text-xs text-muted">
          Tip: After login, try “cheap ramen near downtown, open now” for a fast sanity check.
        </p>
      </div>
    </main>
  );
}
