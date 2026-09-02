"use client";

import {
  Flag,
  MapPin,
  Quote,
} from "lucide-react";
import type { PublicWallMessage } from "@/lib/everdear-api";

type PublicMessageCardProps = {
  message: PublicWallMessage;
  index: number;
  onReport: (
    message: PublicWallMessage,
  ) => void;
};

const cardAccents = [
  {
    line: "bg-rose",
    glow: "bg-rose/10",
    pin: "bg-rose",
  },
  {
    line: "bg-blue",
    glow: "bg-blue/10",
    pin: "bg-blue",
  },
  {
    line: "bg-sage",
    glow: "bg-sage/10",
    pin: "bg-sage",
  },
  {
    line: "bg-coral",
    glow: "bg-coral/10",
    pin: "bg-coral",
  },
] as const;

const cardTilts = [
  "sm:-rotate-[0.35deg]",
  "sm:rotate-[0.3deg]",
  "sm:-rotate-[0.15deg]",
  "sm:rotate-[0.45deg]",
] as const;

const wallDateFormatter =
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function PublicMessageCard({
  message,
  index,
  onReport,
}: PublicMessageCardProps) {
  const accent =
    cardAccents[index % cardAccents.length];

  const tilt =
    cardTilts[index % cardTilts.length];

  return (
    <article
      className={`group relative mb-5 break-inside-avoid overflow-hidden rounded-[2rem] border border-line bg-surface/90 p-6 shadow-[0_18px_50px_rgba(34,29,36,0.07)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_24px_65px_rgba(34,29,36,0.12)] sm:p-7 ${tilt}`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full blur-3xl ${accent.glow}`}
      />

      <div
        aria-hidden="true"
        className={`absolute inset-x-8 top-0 h-px ${accent.line}`}
      />

      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-4">
          <span
            aria-hidden="true"
            className={`mt-1 h-2.5 w-2.5 rounded-full shadow-[0_0_0_6px_var(--surface-elevated)] ${accent.pin}`}
          />

          <Quote
            aria-hidden="true"
            className="h-6 w-6 text-muted/30"
          />
        </div>

        <p className="whitespace-pre-wrap break-words font-display text-[1.35rem] leading-[1.55] tracking-[-0.015em] text-foreground sm:text-[1.5rem]">
          {message.content}
        </p>

        <div className="mt-7 flex items-end justify-between gap-4 border-t border-soft-line pt-5">
          <div className="min-w-0">
            {message.displayLocation && (
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
                <MapPin
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0"
                />

                <span className="truncate">
                  {message.displayLocation}
                </span>
              </div>
            )}

            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted/70">
              {wallDateFormatter.format(
                new Date(message.publishedAt),
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onReport(message)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-transparent text-muted/60 transition hover:border-line hover:bg-surface-elevated hover:text-foreground"
            aria-label="Report this public message"
            title="Report message"
          >
            <Flag
              aria-hidden="true"
              className="h-3.5 w-3.5"
            />
          </button>
        </div>
      </div>
    </article>
  );
}