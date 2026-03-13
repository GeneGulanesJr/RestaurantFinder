"use client";

import { useEffect, useRef } from "react";
import type { SearchRequest, PriceTier } from "@/lib/search-request";

type TemplateId = "quick-lunch" | "date-night" | "family-dinner";

export interface SearchRefinementModalProps {
  isOpen: boolean;
  originalMessage: string;
  inProgressRequest: SearchRequest;
  onChangeRequest(next: SearchRequest): void;
  onApply(request: SearchRequest): void;
  onSkip(request: SearchRequest): void;
  onClose(): void;
}

const CUISINE_OPTIONS = [
  "Any",
  "Japanese",
  "Chinese",
  "Italian",
  "Mexican",
  "American",
  "Korean",
  "Thai",
] as const;

const PRICE_OPTIONS: { id: PriceTier; label: string }[] = [
  { id: 1, label: "$" },
  { id: 2, label: "$$" },
  { id: 3, label: "$$$" },
  { id: 4, label: "$$$$" },
];

const DISTANCE_OPTIONS = [
  { id: 500, label: "Walking distance" },
  { id: 2000, label: "Short ride" },
  { id: 5000, label: "Willing to travel" },
] as const;

const RATING_OPTIONS = [
  { id: 3.5, label: "3.5+" },
  { id: 4.0, label: "4.0+" },
  { id: 4.5, label: "4.5+" },
] as const;

const QUICK_TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  {
    id: "quick-lunch",
    label: "Quick lunch nearby",
    description: "Fast, close, and budget-friendly.",
  },
  {
    id: "date-night",
    label: "Date night",
    description: "Cozy, higher-end spots for an evening out.",
  },
  {
    id: "family-dinner",
    label: "Family-friendly dinner",
    description: "Casual places that work well for groups.",
  },
];

function applyTemplate(template: TemplateId, base: SearchRequest): SearchRequest {
  switch (template) {
    case "quick-lunch":
      return {
        ...base,
        priceRange: base.priceRange ?? 1,
        maxDistanceMeters: base.maxDistanceMeters ?? 1000,
        minRating: base.minRating ?? 3.5,
        openNow: base.openNow ?? true,
        vibeTags: Array.from(new Set([...(base.vibeTags ?? []), "quick-lunch"])),
      };
    case "date-night":
      return {
        ...base,
        priceRange: base.priceRange ?? 3,
        maxDistanceMeters: base.maxDistanceMeters ?? 5000,
        minRating: base.minRating ?? 4.2,
        openNow: base.openNow ?? true,
        vibeTags: Array.from(new Set([...(base.vibeTags ?? []), "date-night"])),
      };
    case "family-dinner":
      return {
        ...base,
        priceRange: base.priceRange ?? 2,
        maxDistanceMeters: base.maxDistanceMeters ?? 3000,
        minRating: base.minRating ?? 3.8,
        openNow: base.openNow ?? false,
        vibeTags: Array.from(new Set([...(base.vibeTags ?? []), "family-friendly"])),
      };
    default:
      return base;
  }
}

export function SearchRefinementModal(props: SearchRefinementModalProps) {
  const { isOpen, originalMessage, inProgressRequest, onChangeRequest, onApply, onSkip, onClose } =
    props;

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus the first focusable element on open
    const timeout = window.setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 10);

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalSteps = 3;
  const completedSteps = [
    inProgressRequest.cuisine,
    inProgressRequest.priceRange,
    inProgressRequest.maxDistanceMeters,
    inProgressRequest.minRating,
    typeof inProgressRequest.openNow === "boolean" ? "openNow" : null,
  ].filter(Boolean).length;
  const progressPercent = Math.min(100, Math.max(25, (completedSteps / totalSteps) * 100));

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6 sm:px-4 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-refinement-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="rf-reveal flex max-h-[min(700px,95vh)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border bg-card px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Refine search</p>
          <h2 id="search-refinement-title" className="mt-1 text-base font-semibold text-fg">
            Build your perfect search
          </h2>
          <p className="mt-2 line-clamp-2 text-xs text-muted">
            We’ll use a few quick choices to turn your message into a complete, filterable search.
          </p>

          <div className="mt-3 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-muted">
            <span className="text-[11px] uppercase tracking-wide text-muted">You said</span>
            <p className="mt-1 line-clamp-2 text-sm text-fg">{originalMessage}</p>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted">
              <span>Progress</span>
              <span>{Math.round(progressPercent)}% complete</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 text-sm sm:px-5">
          <section aria-label="Quick templates" className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Quick templates</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  ref={tpl.id === "quick-lunch" ? firstFocusableRef : undefined}
                  onClick={() => onChangeRequest(applyTemplate(tpl.id, inProgressRequest))}
                  className="rf-btn-motion rf-focusable inline-flex min-w-[9rem] flex-col items-start rounded-lg border border-border bg-bg px-3 py-2 text-left text-xs hover:border-accent hover:bg-accent/5 focus-visible:rf-focus"
                >
                  <span className="text-[11px] font-medium text-fg">{tpl.label}</span>
                  <span className="mt-0.5 text-[11px] text-muted">{tpl.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section aria-label="Filters" className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Cuisine</p>
              <div className="flex flex-wrap gap-1.5">
                {CUISINE_OPTIONS.map((cuisine) => {
                  const isAny = cuisine === "Any";
                  const value = isAny ? undefined : cuisine.toLowerCase();
                  const selected = isAny ? !inProgressRequest.cuisine : inProgressRequest.cuisine === value;
                  return (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() =>
                        onChangeRequest({
                          ...inProgressRequest,
                          cuisine: value,
                        })
                      }
                      className={[
                        "rf-btn-motion rf-focusable inline-flex items-center rounded-full border px-3 py-1 text-xs",
                        selected
                          ? "border-accent bg-accent/10 text-fg"
                          : "border-border bg-bg text-muted hover:border-accent/70 hover:text-fg",
                      ].join(" ")}
                    >
                      {cuisine}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Price range
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        onChangeRequest({
                          ...inProgressRequest,
                          priceRange: option.id,
                        })
                      }
                      className={[
                        "rf-btn-motion rf-focusable inline-flex items-center rounded-full border px-3 py-1 text-xs",
                        inProgressRequest.priceRange === option.id
                          ? "border-accent bg-accent/10 text-fg"
                          : "border-border bg-bg text-muted hover:border-accent/70 hover:text-fg",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Distance
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DISTANCE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        onChangeRequest({
                          ...inProgressRequest,
                          maxDistanceMeters: option.id,
                        })
                      }
                      className={[
                        "rf-btn-motion rf-focusable inline-flex items-center rounded-full border px-3 py-1 text-xs",
                        inProgressRequest.maxDistanceMeters === option.id
                          ? "border-accent bg-accent/10 text-fg"
                          : "border-border bg-bg text-muted hover:border-accent/70 hover:text-fg",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Minimum rating
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {RATING_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        onChangeRequest({
                          ...inProgressRequest,
                          minRating: option.id,
                        })
                      }
                      className={[
                        "rf-btn-motion rf-focusable inline-flex items-center rounded-full border px-3 py-1 text-xs",
                        inProgressRequest.minRating === option.id
                          ? "border-accent bg-accent/10 text-fg"
                          : "border-border bg-bg text-muted hover:border-accent/70 hover:text-fg",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Open now</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onChangeRequest({
                        ...inProgressRequest,
                        openNow: true,
                      })
                    }
                    className={[
                      "rf-btn-motion rf-focusable inline-flex items-center rounded-full border px-3 py-1 text-xs",
                      inProgressRequest.openNow === true
                        ? "border-accent bg-accent/10 text-fg"
                        : "border-border bg-bg text-muted hover:border-accent/70 hover:text-fg",
                    ].join(" ")}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeRequest({
                        ...inProgressRequest,
                        openNow: false,
                      })
                    }
                    className={[
                      "rf-btn-motion rf-focusable inline-flex items-center rounded-full border px-3 py-1 text-xs",
                      inProgressRequest.openNow === false
                        ? "border-accent bg-accent/10 text-fg"
                        : "border-border bg-bg text-muted hover:border-accent/70 hover:text-fg",
                    ].join(" ")}
                  >
                    Doesn&apos;t matter
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => onSkip(inProgressRequest)}
            className="rf-focusable text-xs text-muted underline decoration-border underline-offset-4 hover:text-fg focus-visible:rf-focus"
          >
            Skip and search anyway
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rf-focusable rounded-lg border border-border bg-bg px-3 py-1.5 text-xs font-medium text-muted hover:text-fg focus-visible:rf-focus"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(inProgressRequest)}
              className="rf-btn-motion rf-focusable rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-accent-ink shadow-sm hover:bg-accent/90 focus-visible:rf-focus"
            >
              Show results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

