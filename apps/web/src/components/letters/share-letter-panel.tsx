"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Link2,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Unlink,
} from "lucide-react";
import {
  apiRequest,
  type CreatedShareLinkResponse,
  type Letter,
  type ShareLinkMetadata,
} from "@/lib/everdear-api";

type ShareLetterPanelProps = {
  letter: Letter;
  canPublish: boolean;
  onLetterUpdated: (letter: Letter) => void;
};

type ExpirationChoice =
  | "never"
  | "day"
  | "week"
  | "month";

function createExpiration(
  choice: ExpirationChoice,
): string | null {
  const durationByChoice = {
    never: 0,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };

  const duration = durationByChoice[choice];

  return duration === 0
    ? null
    : new Date(
        Date.now() + duration,
      ).toISOString();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

export function ShareLetterPanel({
  letter,
  canPublish,
  onLetterUpdated,
}: ShareLetterPanelProps) {
  const [metadata, setMetadata] =
    useState<ShareLinkMetadata | null>(null);

  const [shareUrl, setShareUrl] = useState<
    string | null
  >(null);

  const [expiration, setExpiration] =
    useState<ExpirationChoice>("week");

  const [loading, setLoading] = useState(true);
  const [working, setWorking] =
    useState(false);

  const [copied, setCopied] = useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    const abortController =
      new AbortController();

    let active = true;

    void apiRequest<ShareLinkMetadata | null>(
      `/letters/${letter.id}/share`,
      {
        signal: abortController.signal,
      },
    )
      .then((loadedMetadata) => {
        if (active) {
          setMetadata(loadedMetadata);
        }
      })
      .catch((requestError: unknown) => {
        if (
          active &&
          !abortController.signal.aborted
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Sharing information could not be loaded.",
            ),
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      abortController.abort();
    };
  }, [letter.id]);

  const activeLink =
    metadata?.letterStatus === "PUBLISHED" &&
    !metadata.revokedAt;

  const refreshLetter = async () => {
    const updatedLetter =
      await apiRequest<Letter>(
        `/letters/${letter.id}`,
      );

    onLetterUpdated(updatedLetter);
  };

  const handleCreateLink = async () => {
    if (
      activeLink &&
      !window.confirm(
        "Generate a new link? The previous receiver link will stop working immediately.",
      )
    ) {
      return;
    }

    setWorking(true);
    setCopied(false);
    setError(null);

    try {
      const createdLink =
        await apiRequest<CreatedShareLinkResponse>(
          `/letters/${letter.id}/share`,
          {
            method: "POST",
            json: {
              expiresAt:
                createExpiration(expiration),
            },
          },
        );

      setMetadata(createdLink);

      setShareUrl(
        `${window.location.origin}/l/${createdLink.token}`,
      );

      await refreshLetter();
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "The private link could not be created.",
        ),
      );
    } finally {
      setWorking(false);
    }
  };

  const handleRevoke = async () => {
    if (
      !window.confirm(
        "Revoke this link? The receiver will no longer be able to open it.",
      )
    ) {
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const revokedMetadata =
        await apiRequest<ShareLinkMetadata>(
          `/letters/${letter.id}/share`,
          {
            method: "DELETE",
          },
        );

      setMetadata(revokedMetadata);
      setShareUrl(null);
      setCopied(false);

      await refreshLetter();
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "The private link could not be revoked.",
        ),
      );
    } finally {
      setWorking(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        shareUrl,
      );

      setCopied(true);
    } catch {
      setError(
        "Copying was blocked by the browser. Select and copy the link manually.",
      );
    }
  };

  const publishDisabled =
    working ||
    loading ||
    (letter.status === "DRAFT" &&
      !canPublish);

  return (
    <section className="rounded-[2rem] border border-line bg-surface/80 p-5 shadow-[0_22px_70px_rgba(44,36,48,0.08)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sage/12 text-sage">
              <ShieldCheck className="h-4 w-4" />
            </span>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Private delivery
              </p>

              <h2 className="font-display text-2xl font-bold">
                Share this letter
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
            Only someone with the unguessable
            private link can open this letter.
            EverDear stores only a secure hash of
            the secret token.
          </p>
        </div>

        {metadata && (
          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
              activeLink
                ? "bg-sage/12 text-sage"
                : "bg-rose/10 text-rose"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeLink
                  ? "bg-sage"
                  : "bg-rose"
              }`}
            />

            {activeLink
              ? "Link active"
              : metadata.letterStatus ===
                  "EXPIRED"
                ? "Link expired"
                : "Link revoked"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-background/60 px-4 py-4 text-sm font-semibold text-muted">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading sharing status...
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label>
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
                <CalendarDays className="h-3.5 w-3.5" />
                Link expiration
              </span>

              <select
                value={expiration}
                onChange={(event) =>
                  setExpiration(
                    event.target
                      .value as ExpirationChoice,
                  )
                }
                disabled={working}
                className="h-12 w-full rounded-2xl border border-line bg-background/70 px-4 text-sm font-semibold outline-none transition focus:border-sage"
              >
                <option value="never">
                  Never expires
                </option>
                <option value="day">
                  After 24 hours
                </option>
                <option value="week">
                  After 7 days
                </option>
                <option value="month">
                  After 30 days
                </option>
              </select>
            </label>

            <button
              type="button"
              disabled={publishDisabled}
              onClick={() =>
                void handleCreateLink()
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-bold text-background transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {working ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : activeLink ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {working
                ? "Working..."
                : activeLink
                  ? "Generate new link"
                  : metadata
                    ? "Create new link"
                    : "Publish and create link"}
            </button>
          </div>

          {letter.status === "DRAFT" &&
            !canPublish && (
              <p className="mt-3 text-xs text-coral">
                Wait for autosave and add some
                letter content before publishing.
              </p>
            )}

          {shareUrl && (
            <div className="mt-6 rounded-3xl border border-sage/25 bg-sage/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-sage">
                <Link2 className="h-4 w-4" />
                Your new private link
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={shareUrl}
                  readOnly
                  aria-label="Private receiver link"
                  onFocus={(event) =>
                    event.target.select()
                  }
                  className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-sage px-4 text-sm font-bold text-white"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>

                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-12 w-full place-items-center rounded-2xl border border-line bg-surface text-muted transition hover:text-foreground sm:w-12"
                  aria-label="Open receiver link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <p className="mt-3 text-xs leading-5 text-muted">
                Copy this link now. For security,
                the complete secret token is never
                stored and cannot be shown again.
              </p>
            </div>
          )}

          {activeLink && !shareUrl && (
            <div className="mt-6 rounded-2xl border border-blue/20 bg-blue/10 px-4 py-3 text-sm leading-6 text-muted">
              This letter already has an active
              private link. Generate a new link if
              you need another copy; doing so will
              invalidate the previous one.
            </div>
          )}

          {metadata && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-background/60 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  Views
                </p>

                <p className="mt-2 flex items-center gap-2 font-display text-2xl font-bold">
                  <Eye className="h-4 w-4 text-blue" />
                  {metadata.accessCount}
                </p>
              </div>

              <div className="rounded-2xl bg-background/60 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  Last opened
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {metadata.lastAccessedAt
                    ? formatDate(
                        metadata.lastAccessedAt,
                      )
                    : "Not opened yet"}
                </p>
              </div>

              <div className="rounded-2xl bg-background/60 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  Expires
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {metadata.expiresAt
                    ? formatDate(metadata.expiresAt)
                    : "Never"}
                </p>
              </div>
            </div>
          )}

          {activeLink && (
            <button
              type="button"
              disabled={working}
              onClick={() => void handleRevoke()}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-rose transition hover:text-rose-deep disabled:opacity-50"
            >
              <Unlink className="h-4 w-4" />
              Revoke receiver link
            </button>
          )}
        </>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-rose/25 bg-rose/10 px-4 py-3 text-sm text-rose-deep"
        >
          {error}
        </div>
      )}
    </section>
  );
}