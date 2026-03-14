"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const UtensilsIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const router = useRouter();

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
        router.push("/");
        return;
      }
      setError(data.error ?? "Invalid username or password");
    } catch {
      setError("We couldn’t sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-pattern flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        
        <div className="rf-enter rounded-md border border-border/60 bg-surface shadow-card overflow-hidden">
          
          <div className="p-8 sm:p-10">
            {/* Logo: solid accent (no gradient) */}
            <div className="flex justify-center mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-accent">
                <UtensilsIcon className="h-7 w-7 text-accent-ink" />
              </div>
            </div>
            
            <h1 className="font-display text-center text-2xl font-semibold text-fg tracking-tight">
              Welcome to Restaurant Finder
            </h1>
            <p className="mt-2 text-center text-sm text-muted">
              Sign in to discover your next favorite spot
            </p>
            
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-fg">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="rf-focusable mt-2 w-full rounded-md border border-border/50 bg-card px-4 py-3 text-fg placeholder:text-muted/50 shadow-sm focus-visible:rf-focus disabled:opacity-60"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-fg">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="rf-focusable mt-2 w-full rounded-md border border-border/50 bg-card px-4 py-3 text-fg placeholder:text-muted/50 shadow-sm focus-visible:rf-focus disabled:opacity-60"
                />
              </div>
              
              {error && (
                <div role="alert" className="rounded-md border border-danger/30 bg-danger-surface px-4 py-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="rf-btn-motion rf-focusable w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent py-3.5 font-semibold text-accent-ink shadow-card hover:bg-accent/90 hover:shadow-hover focus-visible:rf-focus disabled:opacity-60 disabled:transform-none"
              >
                {loading ? (
                  <span className="rf-loading-dots text-sm">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <p className="mt-6 text-center text-xs text-muted">
          Demo: username <strong>demo</strong>, password <strong>1234</strong>
        </p>
      </div>
    </main>
  );
}
