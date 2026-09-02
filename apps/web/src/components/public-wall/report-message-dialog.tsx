"use client";

import {
  type FormEvent,
  useState,
} from "react";
import {
  CheckCircle2,
  Flag,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";
import {
  apiRequest,
  type PublicReportReason,
  type PublicReportResponse,
  type PublicWallMessage,
} from "@/lib/everdear-api";

type ReportMessageDialogProps = {
  message: PublicWallMessage | null;
  onClose: () => void;
  onReported: (messageId: string) => void;
};

const reportReasons: Array<{
  value: PublicReportReason;
  label: string;
}> = [
  {
    value: "SPAM",
    label: "Spam or promotion",
  },
  {
    value: "HARASSMENT",
    label: "Harassment or bullying",
  },
  {
    value: "HATEFUL_CONTENT",
    label: "Hateful content",
  },
  {
    value: "SEXUAL_CONTENT",
    label: "Sexual content",
  },
  {
    value: "PERSONAL_INFORMATION",
    label: "Personal information",
  },
  {
    value: "SELF_HARM",
    label: "Self-harm concern",
  },
  {
    value: "OTHER",
    label: "Something else",
  },
];

export function ReportMessageDialog({
  message,
  onClose,
  onReported,
}: ReportMessageDialogProps) {
  const [reason, setReason] =
    useState<PublicReportReason>("SPAM");

  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!message || submitting) {
      return;
    }

    const formData = new FormData(
      event.currentTarget,
    );

    const website = String(
      formData.get("website") ?? "",
    );

    setSubmitting(true);
    setError(null);

    try {
      await apiRequest<PublicReportResponse>(
        `/public/messages/${message.id}/reports`,
        {
          method: "POST",
          json: {
            reason,
            details: details.trim() || undefined,
            website,
          },
        },
      );

      setSubmitted(true);
      onReported(message.id);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The report could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed inset-0 z-[200] grid place-items-center bg-foreground/35 p-4 backdrop-blur-md"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
            initial={{
              opacity: 0,
              y: 18,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 12,
              scale: 0.98,
            }}
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-line bg-surface p-6 text-foreground shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition hover:bg-surface-elevated hover:text-foreground"
              aria-label="Close report dialog"
            >
              <X
                aria-hidden="true"
                className="h-4 w-4"
              />
            </button>

            {submitted ? (
              <div className="py-8 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sage/15 text-sage">
                  <CheckCircle2
                    aria-hidden="true"
                    className="h-7 w-7"
                  />
                </span>

                <h2
                  id="report-dialog-title"
                  className="mt-6 font-display text-3xl font-bold"
                >
                  Thank you for looking out
                </h2>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-muted">
                  Your report has been received.
                  Messages with repeated concerns are
                  automatically hidden for review.
                </p>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-bold text-background"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose/12 text-rose">
                  <Flag
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <h2
                  id="report-dialog-title"
                  className="mt-5 pr-12 font-display text-3xl font-bold"
                >
                  Report this message
                </h2>

                <p className="mt-2 text-sm leading-7 text-muted">
                  Reports are private. Your identity
                  is never shown to the message
                  author or other visitors.
                </p>

                <form
                  className="mt-7 space-y-5"
                  onSubmit={handleSubmit}
                >
                  <div>
                    <label
                      htmlFor="report-reason"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted"
                    >
                      Reason
                    </label>

                    <select
                      id="report-reason"
                      value={reason}
                      onChange={(event) =>
                        setReason(
                          event.target
                            .value as PublicReportReason,
                        )
                      }
                      className="min-h-12 w-full rounded-2xl border border-line bg-background px-4 text-sm outline-none transition focus:border-rose"
                    >
                      {reportReasons.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="report-details"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted"
                    >
                      Details{" "}
                      <span className="normal-case tracking-normal">
                        (optional)
                      </span>
                    </label>

                    <textarea
                      id="report-details"
                      value={details}
                      onChange={(event) =>
                        setDetails(event.target.value)
                      }
                      maxLength={500}
                      rows={4}
                      placeholder="Briefly explain the concern..."
                      className="w-full resize-none rounded-2xl border border-line bg-background px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted/55 focus:border-rose"
                    />

                    <p className="mt-1.5 text-right text-[0.7rem] text-muted">
                      {details.length}/500
                    </p>
                  </div>

                  <div
                    className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                    aria-hidden="true"
                  >
                    <label htmlFor="report-website">
                      Website
                    </label>
                    <input
                      id="report-website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-2xl border border-rose/25 bg-rose/10 px-4 py-3 text-sm text-rose-deep"
                    >
                      {error}
                    </p>
                  )}

                  <div className="flex items-center gap-3 rounded-2xl bg-surface-elevated/60 px-4 py-3 text-xs leading-5 text-muted">
                    <ShieldCheck
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-sage"
                    />
                    Reports are deduplicated and
                    protected against misuse.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-bold text-background transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin"
                        />
                        Sending report
                      </>
                    ) : (
                      "Submit report"
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}