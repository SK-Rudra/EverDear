"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import {
  AlertCircle,
  Feather,
  Globe2,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
} from "motion/react";
import {
  apiRequest,
  type PublicWallMessage,
  type PublicWallPage,
} from "@/lib/everdear-api";
import { PublicMessageCard } from "./public-message-card";
import { ReportMessageDialog } from "./report-message-dialog";

export function PublicWallExperience() {
  const reduceMotion = useReducedMotion();

  const [messages, setMessages] = useState<
    PublicWallMessage[]
  >([]);

  const [nextCursor, setNextCursor] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const [loadError, setLoadError] = useState<
    string | null
  >(null);

  const [content, setContent] = useState("");
  const [displayLocation, setDisplayLocation] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [submitError, setSubmitError] = useState<
    string | null
  >(null);

  const [submitSuccess, setSubmitSuccess] =
    useState(false);

  const [reportingMessage, setReportingMessage] =
    useState<PublicWallMessage | null>(null);

  useEffect(() => {
    const abortController =
      new AbortController();

    apiRequest<PublicWallPage>(
      "/public/messages?limit=18",
      {
        signal: abortController.signal,
      },
    )
      .then((page) => {
        if (abortController.signal.aborted) {
          return;
        }

        setMessages(page.messages);
        setNextCursor(page.nextCursor);
        setLoadError(null);
      })
      .catch((requestError: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setLoadError(
          requestError instanceof Error
            ? requestError.message
            : "The wall could not be loaded.",
        );
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, []);

  const handleRetry = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const page =
        await apiRequest<PublicWallPage>(
          "/public/messages?limit=18",
        );

      setMessages(page.messages);
      setNextCursor(page.nextCursor);
    } catch (requestError: unknown) {
      setLoadError(
        requestError instanceof Error
          ? requestError.message
          : "The wall could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const normalizedContent = content.trim();

    if (
      normalizedContent.length < 3 ||
      submitting
    ) {
      return;
    }

    const formData = new FormData(
      event.currentTarget,
    );

    const website = String(
      formData.get("website") ?? "",
    );

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const createdMessage =
        await apiRequest<PublicWallMessage>(
          "/public/messages",
          {
            method: "POST",
            json: {
              content: normalizedContent,
              displayLocation:
                displayLocation.trim() ||
                undefined,
              website,
            },
          },
        );

      setMessages((currentMessages) => [
        createdMessage,
        ...currentMessages.filter(
          (message) =>
            message.id !== createdMessage.id,
        ),
      ]);

      setContent("");
      setDisplayLocation("");
      setSubmitSuccess(true);
    } catch (requestError: unknown) {
      setSubmitError(
        requestError instanceof Error
          ? requestError.message
          : "Your message could not be posted.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setLoadError(null);

    const searchParameters =
      new URLSearchParams({
        limit: "18",
        cursor: nextCursor,
      });

    try {
      const page =
        await apiRequest<PublicWallPage>(
          `/public/messages?${searchParameters.toString()}`,
        );

      setMessages((currentMessages) => {
        const existingIds = new Set(
          currentMessages.map(
            (message) => message.id,
          ),
        );

        return [
          ...currentMessages,
          ...page.messages.filter(
            (message) =>
              !existingIds.has(message.id),
          ),
        ];
      });

      setNextCursor(page.nextCursor);
    } catch (requestError: unknown) {
      setLoadError(
        requestError instanceof Error
          ? requestError.message
          : "More messages could not be loaded.",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleReported = (
    messageId: string,
  ) => {
    setMessages((currentMessages) =>
      currentMessages.filter(
        (message) => message.id !== messageId,
      ),
    );
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-line px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full bg-rose/12 blur-[120px]" />
          <div className="absolute -right-44 top-1/3 h-[32rem] w-[32rem] rounded-full bg-blue/10 blur-[120px]" />
          <div className="absolute left-[12%] top-32 h-2 w-2 rounded-full bg-rose shadow-[0_0_22px_var(--rose)]" />
          <div className="absolute right-[14%] top-20 h-1.5 w-1.5 rounded-full bg-sage shadow-[0_0_20px_var(--sage)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1180px]">
          <motion.div
            initial={{
              opacity: 0,
              y: reduceMotion ? 0 : 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-muted backdrop-blur-xl">
              <Globe2
                aria-hidden="true"
                className="h-3.5 w-3.5 text-rose"
              />
              The EverDear Wall
            </div>

            <h1 className="mt-7 font-display text-[clamp(3.2rem,8vw,7.5rem)] font-bold leading-[0.9] tracking-[-0.055em]">
              Leave a little{" "}
              <span className="italic text-rose-deep">
                kindness
              </span>
              <br />
              where someone may find it.
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-muted sm:text-lg">
              A quiet public place for anonymous
              thoughts, gentle reminders, unfinished
              feelings, and words that might make a
              stranger&apos;s day softer.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold text-muted">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  aria-hidden="true"
                  className="h-4 w-4 text-sage"
                />
                Anonymous by design
              </span>

              <span className="inline-flex items-center gap-2">
                <Sparkles
                  aria-hidden="true"
                  className="h-4 w-4 text-coral"
                />
                Messages remain for 30 days
              </span>

              <span className="inline-flex items-center gap-2">
                <Feather
                  aria-hidden="true"
                  className="h-4 w-4 text-blue"
                />
                No account required
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: reduceMotion ? 0 : 28,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: reduceMotion ? 0 : 0.12,
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mx-auto mt-14 grid max-w-5xl overflow-hidden rounded-[2.25rem] border border-line bg-surface/85 shadow-[0_30px_90px_rgba(34,29,36,0.11)] backdrop-blur-2xl lg:grid-cols-[0.78fr_1.22fr]"
          >
            <div className="relative overflow-hidden border-b border-line bg-foreground p-7 text-background sm:p-9 lg:border-b-0 lg:border-r">
              <div
                aria-hidden="true"
                className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rose/25 blur-3xl"
              />

              <div className="relative">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-background/10">
                  <Feather
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-background/55">
                  Pin something to the wall
                </p>

                <h2 className="mt-3 font-display text-4xl font-bold leading-tight">
                  What would you like someone to
                  hear today?
                </h2>

                <p className="mt-5 text-sm leading-7 text-background/65">
                  Keep it thoughtful and protect your
                  privacy. Links, email addresses, and
                  phone numbers are not accepted.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 sm:p-9"
            >
              <label
                htmlFor="wall-message"
                className="text-xs font-bold uppercase tracking-[0.18em] text-muted"
              >
                Your anonymous message
              </label>

              <textarea
                id="wall-message"
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  setSubmitSuccess(false);
                }}
                minLength={3}
                maxLength={500}
                rows={6}
                required
                placeholder="Maybe someone needs to hear that..."
                className="mt-3 w-full resize-none rounded-[1.5rem] border border-line bg-background/70 px-5 py-4 text-base leading-7 outline-none transition placeholder:text-muted/50 focus:border-rose focus:bg-background"
              />

              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-[0.7rem] leading-5 text-muted">
                  Please avoid names and personal
                  information.
                </span>

                <span className="shrink-0 text-[0.7rem] font-semibold text-muted">
                  {content.length}/500
                </span>
              </div>

              <label
                htmlFor="wall-location"
                className="mt-5 block text-xs font-bold uppercase tracking-[0.18em] text-muted"
              >
                A place{" "}
                <span className="normal-case tracking-normal">
                  (optional)
                </span>
              </label>

              <input
                id="wall-location"
                value={displayLocation}
                onChange={(event) =>
                  setDisplayLocation(
                    event.target.value,
                  )
                }
                maxLength={80}
                placeholder="Dhaka, Sydney, somewhere quiet..."
                className="mt-3 min-h-12 w-full rounded-2xl border border-line bg-background/70 px-5 text-sm outline-none transition placeholder:text-muted/50 focus:border-rose focus:bg-background"
              />

              <div
                className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                aria-hidden="true"
              >
                <label htmlFor="wall-website">
                  Website
                </label>
                <input
                  id="wall-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="mt-5 flex items-start gap-2 rounded-2xl border border-rose/25 bg-rose/10 px-4 py-3 text-sm leading-6 text-rose-deep"
                >
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-1 h-4 w-4 shrink-0"
                  />
                  {submitError}
                </p>
              )}

              {submitSuccess && (
                <p
                  role="status"
                  className="mt-5 rounded-2xl border border-sage/25 bg-sage/10 px-4 py-3 text-sm text-sage"
                >
                  Your words are now resting on the
                  wall.
                </p>
              )}

              <button
                type="submit"
                disabled={
                  submitting ||
                  content.trim().length < 3
                }
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-bold text-background shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />
                    Pinning your words
                  </>
                ) : (
                  <>
                    Pin it to the wall
                    <Send
                      aria-hidden="true"
                      className="h-4 w-4"
                    />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <section className="relative px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-deep">
                Notes from everywhere
              </p>

              <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
                Words left behind
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-muted sm:text-right">
              Read gently. These messages belong to
              real people, even when their names are
              not attached.
            </p>
          </div>

          {loading ? (
            <div
              className="grid min-h-72 place-items-center rounded-[2rem] border border-line bg-surface/50"
              role="status"
            >
              <div className="text-center">
                <LoaderCircle
                  aria-hidden="true"
                  className="mx-auto h-7 w-7 animate-spin text-rose"
                />

                <p className="mt-4 text-sm text-muted">
                  Gathering words from the wall...
                </p>
              </div>
            </div>
          ) : loadError && messages.length === 0 ? (
            <div className="rounded-[2rem] border border-rose/20 bg-rose/8 px-6 py-14 text-center">
              <AlertCircle
                aria-hidden="true"
                className="mx-auto h-7 w-7 text-rose"
              />

              <p className="mt-4 text-sm text-muted">
                {loadError}
              </p>

              <button
                type="button"
                onClick={() => void handleRetry()}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-bold text-background"
              >
                <RefreshCw
                  aria-hidden="true"
                  className="h-4 w-4"
                />
                Try again
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-line bg-surface/45 px-6 py-20 text-center">
              <Feather
                aria-hidden="true"
                className="mx-auto h-8 w-8 text-muted/50"
              />

              <h3 className="mt-5 font-display text-3xl font-bold">
                The wall is waiting
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">
                Be the first person to leave a kind,
                honest, or meaningful thought here.
              </p>
            </div>
          ) : (
            <>
              <div
                className="columns-1 gap-5 sm:columns-2 xl:columns-3"
                aria-live="polite"
              >
                {messages.map(
                  (message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{
                        opacity: 0,
                        y: reduceMotion
                          ? 0
                          : 16,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.4,
                        delay: reduceMotion
                          ? 0
                          : Math.min(
                              index * 0.035,
                              0.3,
                            ),
                      }}
                      className="break-inside-avoid"
                    >
                      <PublicMessageCard
                        message={message}
                        index={index}
                        onReport={
                          setReportingMessage
                        }
                      />
                    </motion.div>
                  ),
                )}
              </div>

              {loadError && (
                <p
                  role="alert"
                  className="mt-8 text-center text-sm text-rose-deep"
                >
                  {loadError}
                </p>
              )}

              {nextCursor && (
                <div className="mt-12 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      void handleLoadMore()
                    }
                    disabled={loadingMore}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface/70 px-7 text-sm font-bold text-foreground shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <>
                        <LoaderCircle
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin"
                        />
                        Gathering more
                      </>
                    ) : (
                      "Read more messages"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <ReportMessageDialog
        key={reportingMessage?.id ?? "closed"}
        message={reportingMessage}
        onClose={() =>
          setReportingMessage(null)
        }
        onReported={handleReported}
      />
    </>
  );
}