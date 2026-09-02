"use client";

import {
  useState,
} from "react";
import {
  AlertCircle,
  Check,
  CircleSlash2,
  Eye,
  EyeOff,
  Flag,
  LoaderCircle,
  MapPin,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  apiRequest,
  type AuthenticatedUser,
  type ModerationMessage,
  type ModerationMessageAction,
  type ModerationReportResolution,
} from "@/lib/everdear-api";

type ModerationMessageCardProps = {
  message: ModerationMessage;
  user: AuthenticatedUser;
  onUpdated: (
    message: ModerationMessage,
  ) => void;
};

const dateFormatter =
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const statusStyles = {
  PENDING:
    "border-coral/30 bg-coral/10 text-coral",
  PUBLISHED:
    "border-sage/30 bg-sage/10 text-sage",
  HIDDEN:
    "border-blue/30 bg-blue/10 text-blue",
  REMOVED:
    "border-rose/30 bg-rose/10 text-rose",
  EXPIRED:
    "border-line bg-surface-elevated text-muted",
} as const;

const reportReasonLabels = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  HATEFUL_CONTENT: "Hateful content",
  SEXUAL_CONTENT: "Sexual content",
  PERSONAL_INFORMATION:
    "Personal information",
  SELF_HARM: "Self-harm concern",
  OTHER: "Other",
} as const;

export function ModerationMessageCard({
  message,
  user,
  onUpdated,
}: ModerationMessageCardProps) {
  const [note, setNote] = useState("");

  const [activeOperation, setActiveOperation] =
    useState<string | null>(null);

  const [error, setError] = useState<
    string | null
  >(null);

  const messageActions: Array<{
    action: ModerationMessageAction;
    label: string;
    icon:
      | typeof Eye
      | typeof EyeOff
      | typeof RotateCcw
      | typeof Trash2;
    className: string;
  }> = [];

  if (message.status === "PENDING") {
    messageActions.push(
      {
        action: "PUBLISH",
        label: "Publish",
        icon: Eye,
        className:
          "border-sage/30 bg-sage/10 text-sage hover:bg-sage/15",
      },
      {
        action: "HIDE",
        label: "Hide",
        icon: EyeOff,
        className:
          "border-blue/30 bg-blue/10 text-blue hover:bg-blue/15",
      },
    );
  }

  if (message.status === "PUBLISHED") {
    messageActions.push({
      action: "HIDE",
      label: "Hide",
      icon: EyeOff,
      className:
        "border-blue/30 bg-blue/10 text-blue hover:bg-blue/15",
    });
  }

  if (message.status === "HIDDEN") {
    messageActions.push({
      action: "RESTORE",
      label: "Restore",
      icon: RotateCcw,
      className:
        "border-sage/30 bg-sage/10 text-sage hover:bg-sage/15",
    });
  }

  if (
    user.role === "ADMIN" &&
    message.status !== "REMOVED"
  ) {
    messageActions.push({
      action: "REMOVE",
      label: "Remove",
      icon: Trash2,
      className:
        "border-rose/30 bg-rose/10 text-rose hover:bg-rose/15",
    });
  }

  const moderateMessage = async (
    action: ModerationMessageAction,
  ) => {
    if (activeOperation) {
      return;
    }

    if (
      action === "REMOVE" &&
      !window.confirm(
        "Permanently mark this message as removed? This action is recorded in the audit history.",
      )
    ) {
      return;
    }

    setActiveOperation(`message:${action}`);
    setError(null);

    try {
      const updatedMessage =
        await apiRequest<ModerationMessage>(
          `/moderation/messages/${message.id}`,
          {
            method: "PATCH",
            json: {
              action,
              note: note.trim() || undefined,
            },
          },
        );

      setNote("");
      onUpdated(updatedMessage);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The moderation action failed.",
      );
    } finally {
      setActiveOperation(null);
    }
  };

  const resolveReport = async (
    reportId: string,
    resolution: ModerationReportResolution,
  ) => {
    if (activeOperation) {
      return;
    }

    setActiveOperation(
      `report:${reportId}:${resolution}`,
    );

    setError(null);

    try {
      const updatedMessage =
        await apiRequest<ModerationMessage>(
          `/moderation/reports/${reportId}`,
          {
            method: "PATCH",
            json: {
              resolution,
              note: note.trim() || undefined,
            },
          },
        );

      setNote("");
      onUpdated(updatedMessage);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The report could not be resolved.",
      );
    } finally {
      setActiveOperation(null);
    }
  };

  return (
    <article className="overflow-hidden rounded-[2rem] border border-line bg-surface/85 shadow-[0_20px_60px_rgba(34,29,36,0.08)] backdrop-blur-xl">
      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.15em] ${statusStyles[message.status]}`}
            >
              {message.status}
            </span>

            {message.pendingReportCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose/25 bg-rose/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-rose">
                <Flag
                  aria-hidden="true"
                  className="h-3 w-3"
                />
                {message.pendingReportCount} pending
              </span>
            )}
          </div>

          <span className="text-xs text-muted">
            Updated{" "}
            {dateFormatter.format(
              new Date(message.updatedAt),
            )}
          </span>
        </div>

        <blockquote className="mt-6 whitespace-pre-wrap break-words font-display text-2xl leading-[1.45] tracking-[-0.02em] text-foreground sm:text-[1.7rem]">
          “{message.content}”
        </blockquote>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
          {message.displayLocation && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />
              {message.displayLocation}
            </span>
          )}

          <span>
            Posted{" "}
            {dateFormatter.format(
              new Date(message.createdAt),
            )}
          </span>

          <span>
            {message.reportCount} total{" "}
            {message.reportCount === 1
              ? "report"
              : "reports"}
          </span>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-2xl border border-rose/25 bg-rose/10 px-4 py-3 text-sm leading-6 text-rose-deep"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-1 h-4 w-4 shrink-0"
            />
            {error}
          </p>
        )}

        {messageActions.length > 0 && (
          <div className="mt-6 border-t border-soft-line pt-5">
            <label
              htmlFor={`moderation-note-${message.id}`}
              className="text-xs font-bold uppercase tracking-[0.15em] text-muted"
            >
              Internal note{" "}
              <span className="normal-case tracking-normal">
                (optional)
              </span>
            </label>

            <textarea
              id={`moderation-note-${message.id}`}
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              maxLength={500}
              rows={2}
              placeholder="Explain this decision for the audit history..."
              className="mt-2 w-full resize-none rounded-2xl border border-line bg-background/65 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted/50 focus:border-sage"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {messageActions.map((item) => {
                const Icon = item.icon;

                const operationKey =
                  `message:${item.action}`;

                const active =
                  activeOperation === operationKey;

                return (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() =>
                      void moderateMessage(
                        item.action,
                      )
                    }
                    disabled={
                      activeOperation !== null
                    }
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${item.className}`}
                  >
                    {active ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="h-3.5 w-3.5 animate-spin"
                      />
                    ) : (
                      <Icon
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                    )}

                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {message.reports.length > 0 && (
        <details
          className="group border-t border-line bg-background/35"
          open={message.pendingReportCount > 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-bold sm:px-7">
            <span className="inline-flex items-center gap-2">
              <ShieldAlert
                aria-hidden="true"
                className="h-4 w-4 text-rose"
              />
              Reports
            </span>

            <span className="text-xs font-medium text-muted">
              Showing {message.reports.length}
            </span>
          </summary>

          <div className="space-y-3 border-t border-line p-4 sm:p-5">
            {message.reports.map((report) => {
              const pending =
                report.status === "PENDING";

              return (
                <div
                  key={report.id}
                  className="rounded-2xl border border-line bg-surface/80 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                        {
                          reportReasonLabels[
                            report.reason
                          ]
                        }
                      </p>

                      <p className="mt-1 text-[0.7rem] text-muted">
                        {dateFormatter.format(
                          new Date(
                            report.createdAt,
                          ),
                        )}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] ${
                        pending
                          ? "border-coral/25 bg-coral/10 text-coral"
                          : "border-line bg-surface-elevated text-muted"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  {report.details && (
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {report.details}
                    </p>
                  )}

                  {report.resolver && (
                    <p className="mt-3 text-xs text-muted">
                      Resolved by{" "}
                      {report.resolver.name}
                    </p>
                  )}

                  {pending && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        {
                          resolution:
                            "REVIEWED" as const,
                          label: "Mark reviewed",
                          icon: Check,
                        },
                        {
                          resolution:
                            "DISMISSED" as const,
                          label: "Dismiss",
                          icon: CircleSlash2,
                        },
                        {
                          resolution:
                            "ACTIONED" as const,
                          label:
                            "Action and hide",
                          icon: EyeOff,
                        },
                      ].map((item) => {
                        const Icon = item.icon;

                        const operationKey =
                          `report:${report.id}:${item.resolution}`;

                        const active =
                          activeOperation ===
                          operationKey;

                        return (
                          <button
                            key={item.resolution}
                            type="button"
                            onClick={() =>
                              void resolveReport(
                                report.id,
                                item.resolution,
                              )
                            }
                            disabled={
                              activeOperation !==
                              null
                            }
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-line bg-background px-3 text-[0.7rem] font-bold text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {active ? (
                              <LoaderCircle
                                aria-hidden="true"
                                className="h-3 w-3 animate-spin"
                              />
                            ) : (
                              <Icon
                                aria-hidden="true"
                                className="h-3 w-3"
                              />
                            )}

                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </details>
      )}
    </article>
  );
}