"use client";

import {
  ArrowRight,
  History,
  LoaderCircle,
  UserRound,
} from "lucide-react";
import type { ModerationHistory as ModerationHistoryEntry } from "@/lib/everdear-api";

type ModerationHistoryPanelProps = {
  history: ModerationHistoryEntry[];
  loading: boolean;
  loadingMore: boolean;
  nextCursor: string | null;
  onLoadMore: () => void;
};

const dateFormatter =
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const actionLabels = {
  MESSAGE_PUBLISHED: "Published message",
  MESSAGE_HIDDEN: "Hidden message",
  MESSAGE_RESTORED: "Restored message",
  MESSAGE_REMOVED: "Removed message",
  REPORT_REVIEWED: "Reviewed report",
  REPORT_DISMISSED: "Dismissed report",
  REPORT_ACTIONED: "Actioned report",
} as const;

export function ModerationHistoryPanel({
  history,
  loading,
  loadingMore,
  nextCursor,
  onLoadMore,
}: ModerationHistoryPanelProps) {
  if (loading) {
    return (
      <div className="grid min-h-72 place-items-center rounded-[2rem] border border-line bg-surface/60">
        <div className="text-center">
          <LoaderCircle
            aria-hidden="true"
            className="mx-auto h-6 w-6 animate-spin text-sage"
          />
          <p className="mt-3 text-sm text-muted">
            Loading audit history...
          </p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
        <History
          aria-hidden="true"
          className="mx-auto h-8 w-8 text-muted/50"
        />
        <h2 className="mt-5 font-display text-3xl font-bold">
          No moderation actions yet
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">
          Every staff decision will appear here
          with its actor, state transition, note,
          and timestamp.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative ml-3 border-l border-line sm:ml-5">
        {history.map((entry) => (
          <article
            key={entry.id}
            className="relative pb-7 pl-7 sm:pl-9"
          >
            <span
              aria-hidden="true"
              className="absolute -left-[0.42rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-sage"
            />

            <div className="rounded-[1.6rem] border border-line bg-surface/80 p-5 shadow-sm backdrop-blur-xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {actionLabels[entry.action]}
                  </p>

                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <UserRound
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    />

                    {entry.actor
                      ? `${entry.actor.name} · ${entry.actor.email}`
                      : "Former staff account"}
                  </p>
                </div>

                <time className="text-xs text-muted">
                  {dateFormatter.format(
                    new Date(entry.createdAt),
                  )}
                </time>
              </div>

              {entry.previousState &&
                entry.nextState && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.12em]">
                    <span className="rounded-full border border-line bg-background px-3 py-1 text-muted">
                      {entry.previousState}
                    </span>

                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-muted"
                    />

                    <span className="rounded-full border border-sage/25 bg-sage/10 px-3 py-1 text-sage">
                      {entry.nextState}
                    </span>
                  </div>
                )}

              {entry.note && (
                <p className="mt-4 rounded-2xl bg-background/60 px-4 py-3 text-sm leading-6 text-muted">
                  {entry.note}
                </p>
              )}

              {entry.message && (
                <blockquote className="mt-4 line-clamp-2 border-l-2 border-rose/40 pl-3 font-display text-lg leading-7 text-foreground/80">
                  “{entry.message.content}”
                </blockquote>
              )}

              {entry.report && (
                <p className="mt-3 text-xs font-semibold text-muted">
                  Report reason:{" "}
                  {entry.report.reason.replaceAll(
                    "_",
                    " ",
                  )}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      {nextCursor && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore && (
              <LoaderCircle
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />
            )}
            Load older actions
          </button>
        </div>
      )}
    </>
  );
}