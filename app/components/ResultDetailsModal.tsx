"use client";

import { useEffect, useRef } from "react";
import type { ResultPlace } from "./SearchUI";

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
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6 sm:px-4 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-details-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="rf-reveal flex max-h-[min(640px,95vh)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border bg-card px-4 py-3 sm:px-5 sm:py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Place details
            </p>
            <h2 id="result-details-title" className="mt-1 text-base font-semibold text-fg truncate">
              {place.name}
            </h2>
            <p className="mt-1 text-xs text-muted truncate">{place.category}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rf-focusable rounded-full border border-border bg-bg px-2 py-1 text-xs text-muted hover:text-fg focus-visible:rf-focus"
            aria-label="Close details"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm sm:px-5">
          {place.photos && place.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {place.photos.slice(0, 4).map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`${place.name} photo ${idx + 1}`}
                  className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          <section aria-label="Location">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Location</h3>
            <p className="mt-1 text-sm text-fg">{place.address || "No address available"}</p>
            {place.distance_meters != null && (
              <p className="mt-1 text-xs text-muted">
                Approximately{" "}
                <span className="text-fg">{Math.round(place.distance_meters)}m</span> away
              </p>
            )}
          </section>

          <section aria-label="Highlights" className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Highlights</h3>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              {place.rating != null && (
                <span className="rounded-full border border-border bg-bg px-2.5 py-1">
                  Rating <span className="text-fg">{place.rating}</span>
                </span>
              )}
              {place.price != null && (
                <span className="rounded-full border border-border bg-bg px-2.5 py-1">
                  Price <span className="text-fg">{"$".repeat(place.price)}</span>
                </span>
              )}
              {place.open_now != null && (
                <span className="rounded-full border border-border bg-bg px-2.5 py-1">
                  <span className="text-fg">{place.open_now ? "Open now" : "Closed"}</span>
                </span>
              )}
            </div>
          </section>

          {place.description && (
            <section aria-label="Description">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
                Description
              </h3>
              <p className="mt-1 text-sm text-fg">{place.description}</p>
            </section>
          )}

          {place.why_best && (
            <section aria-label="Why this place">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
                Why this place
              </h3>
              <p className="mt-1 text-xs text-muted">{place.why_best}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

