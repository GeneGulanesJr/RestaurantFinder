"use client";

import { useEffect, useRef } from "react";
import type { ResultPlace } from "./SearchUI";

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

const DollarIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const UtensilsIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export interface ResultDetailsModalProps {
  isOpen: boolean;
  place: ResultPlace | null;
  onClose(): void;
}

export function ResultDetailsModal(props: ResultDetailsModalProps) {
  const { isOpen, place, onClose } = props;

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

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

    const timeout = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 10);

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !place) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-details-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="rf-reveal w-full max-w-lg overflow-hidden rounded-md border border-border/60 bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-border/40">
          <div className="flex items-start justify-between gap-4 bg-card/50 px-6 py-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                  <UtensilsIcon className="h-3 w-3" />
                  {place.category}
                </span>
              </div>
              <h2 id="result-details-title" className="font-display text-xl font-semibold text-fg">
                {place.name}
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="rf-focusable flex h-11 w-11 items-center justify-center rounded-md border border-border/50 bg-surface text-muted hover:text-fg hover:border-accent/30 focus-visible:rf-focus"
              aria-label="Close restaurant details"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-5 px-6 py-5">
          {/* Photos */}
          {place.photos && place.photos.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {place.photos.slice(0, 4).map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`${place.name} photo ${idx + 1}`}
                  width={112}
                  height={112}
                  className="h-28 w-28 flex-shrink-0 rounded-md object-cover shadow-card"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          )}

          {/* Quick info badges */}
          <div className="flex flex-wrap gap-3">
            {place.rating != null && (
              <div className="flex items-center gap-1.5 rounded-md border border-accent/20 bg-accent/5 px-3 py-2">
                <StarIcon className="h-4 w-4 text-rating" filled />
                <span className="font-semibold text-fg">{place.rating.toFixed(1)}</span>
                <span className="text-xs text-muted">rating</span>
              </div>
            )}
            {place.price != null && (
              <div className="flex items-center gap-1.5 rounded-md border border-accent/20 bg-accent/5 px-3 py-2">
                <span className="text-accent font-semibold">{"$".repeat(place.price)}</span>
                <span className="text-xs text-muted">price</span>
              </div>
            )}
            {place.open_now != null && (
              <div className={`flex items-center gap-1.5 rounded-md border px-3 py-2 ${place.open_now ? 'border-success/30 bg-success/5' : 'border-muted/30 bg-muted/5'}`}>
                <span className={`h-2 w-2 rounded-full ${place.open_now ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                <span className={`text-sm font-medium ${place.open_now ? 'text-success' : 'text-muted'}`}>
                  {place.open_now ? 'Open now' : 'Closed'}
                </span>
              </div>
            )}
          </div>

          {/* Location */}
          <section aria-label="Location">
            <div className="flex items-start gap-3 rounded-md bg-card/60 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-accent/10">
                <LocationIcon className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-fg">{place.address || "Address not available"}</p>
                {place.distance_meters != null && (
                  <p className="mt-1 text-sm text-muted">
                    {place.distance_meters < 1000 
                      ? `${Math.round(place.distance_meters)}m away`
                      : `${(place.distance_meters / 1609.34).toFixed(1)} mi away`
                    }
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Description */}
          {place.description && (
            <section aria-label="Description">
              <h3 className="mb-2 text-sm font-semibold text-fg">About</h3>
              <p className="text-sm text-muted leading-relaxed">{place.description}</p>
            </section>
          )}

          {/* Why this place */}
          {place.why_best && (
            <section aria-label="Why this place">
              <h3 className="mb-2 text-sm font-semibold text-fg">Why we recommend it</h3>
              <div className="rounded-md bg-accent/5 border border-accent/10 p-4">
                <p className="text-sm text-muted leading-relaxed">{place.why_best}</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
