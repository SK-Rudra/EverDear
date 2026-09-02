"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import {
  AlertCircle,
  Archive,
  Eye,
  EyeOff,
  Flag,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  apiRequest,
  type AuthenticatedUser,
  type ModerationHistory,
  type ModerationHistoryPage,
  type ModerationMessage,
  type ModerationMessagePage,
  type ModerationOverview,
  type ModerationReportStatus,
  type PublicMessageStatus,
} from "@/lib/everdear-api";
import { ModerationHistoryPanel } from "./moderation-history-panel";
import { ModerationMessageCard } from "./moderation-message-card";

type ModerationDashboardProps = {
  user: AuthenticatedUser;
  onSignOut: () => void;
};

type DashboardTab = "queue" | "history";

type MessageStatusFilter =
  | "ALL"
  | PublicMessageStatus;

type ReportStatusFilter =
  | "ALL"
  | ModerationReportStatus;

function createMessageQuery(
  status: MessageStatusFilter,
  reportStatus: ReportStatusFilter,
  searchQuery: string,
  cursor?: string,
): string {
  const parameters = new URLSearchParams({
    limit: "12",
  });

  if (status !== "ALL") {
    parameters.set("status", status);
  }

  if (reportStatus !== "ALL") {
    parameters.set(
      "reportStatus",
      reportStatus,
    );
  }

  const normalizedQuery = searchQuery.trim();

  if (normalizedQuery.length >= 2) {
    parameters.set("query", normalizedQuery);
  }

  if (cursor) {
    parameters.set("cursor", cursor);
  }

  return parameters.toString();
}

export function ModerationDashboard({
  user,
  onSignOut,
}: ModerationDashboardProps) {
  const [activeTab, setActiveTab] =
    useState<DashboardTab>("queue");

  const [overview, setOverview] =
    useState<ModerationOverview | null>(null);

  const [messages, setMessages] = useState<
    ModerationMessage[]
  >([]);

  const [messageCursor, setMessageCursor] =
    useState<string | null>(null);

  const [history, setHistory] = useState<
    ModerationHistory[]
  >([]);

  const [historyCursor, setHistoryCursor] =
    useState<string | null>(null);

  const [historyLoaded, setHistoryLoaded] =
    useState(false);

  const [statusFilter, setStatusFilter] =
    useState<MessageStatusFilter>("ALL");

  const [reportFilter, setReportFilter] =
    useState<ReportStatusFilter>("ALL");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [
    historyLoadingMore,
    setHistoryLoadingMore,
  ] = useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      apiRequest<ModerationOverview>(
        "/moderation/overview",
      ),
      apiRequest<ModerationMessagePage>(
        "/moderation/messages?limit=12",
      ),
    ])
      .then(
        ([
          overviewResponse,
          messagesResponse,
        ]) => {
          if (!active) {
            return;
          }

          setOverview(overviewResponse);
          setMessages(
            messagesResponse.messages,
          );
          setMessageCursor(
            messagesResponse.nextCursor,
          );
          setError(null);
        },
      )
      .catch((requestError: unknown) => {
        if (!active) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "The moderation dashboard could not load.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshOverview = async () => {
    try {
      const response =
        await apiRequest<ModerationOverview>(
          "/moderation/overview",
        );

      setOverview(response);
    } catch {
      // The completed moderation action remains
      // valid even if the counter refresh fails.
    }
  };

  const loadFilteredMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      const query = createMessageQuery(
        statusFilter,
        reportFilter,
        searchQuery,
      );

      const response =
        await apiRequest<ModerationMessagePage>(
          `/moderation/messages?${query}`,
        );

      setMessages(response.messages);
      setMessageCursor(
        response.nextCursor,
      );
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Messages could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    void loadFilteredMessages();
  };

  const loadMoreMessages = async () => {
    if (!messageCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const query = createMessageQuery(
        statusFilter,
        reportFilter,
        searchQuery,
        messageCursor,
      );

      const response =
        await apiRequest<ModerationMessagePage>(
          `/moderation/messages?${query}`,
        );

      setMessages((currentMessages) => {
        const existingIds = new Set(
          currentMessages.map(
            (message) => message.id,
          ),
        );

        return [
          ...currentMessages,
          ...response.messages.filter(
            (message) =>
              !existingIds.has(message.id),
          ),
        ];
      });

      setMessageCursor(
        response.nextCursor,
      );
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "More messages could not be loaded.",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const openHistory = async () => {
    setActiveTab("history");

    if (historyLoaded || historyLoading) {
      return;
    }

    setHistoryLoading(true);
    setError(null);

    try {
      const response =
        await apiRequest<ModerationHistoryPage>(
          "/moderation/history?limit=20",
        );

      setHistory(response.history);
      setHistoryCursor(
        response.nextCursor,
      );
      setHistoryLoaded(true);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Audit history could not be loaded.",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadMoreHistory = async () => {
    if (
      !historyCursor ||
      historyLoadingMore
    ) {
      return;
    }

    setHistoryLoadingMore(true);

    try {
      const parameters =
        new URLSearchParams({
          limit: "20",
          cursor: historyCursor,
        });

      const response =
        await apiRequest<ModerationHistoryPage>(
          `/moderation/history?${parameters.toString()}`,
        );

      setHistory((currentHistory) => [
        ...currentHistory,
        ...response.history,
      ]);

      setHistoryCursor(
        response.nextCursor,
      );
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Older history could not be loaded.",
      );
    } finally {
      setHistoryLoadingMore(false);
    }
  };

  const messageMatchesCurrentFilters = (
    message: ModerationMessage,
  ): boolean => {
    const matchesMessageStatus =
      statusFilter === "ALL" ||
      message.status === statusFilter;

    const matchesReportStatus =
      reportFilter === "ALL" ||
      message.reports.some(
        (report) =>
          report.status === reportFilter,
      );

    const normalizedQuery =
      searchQuery.trim().toLowerCase();

    const matchesSearch =
      normalizedQuery.length < 2 ||
      message.content
        .toLowerCase()
        .includes(normalizedQuery);

    return (
      matchesMessageStatus &&
      matchesReportStatus &&
      matchesSearch
    );
  };

  const handleMessageUpdated = (
    updatedMessage: ModerationMessage,
  ) => {
    setMessages((currentMessages) => {
      if (
        !messageMatchesCurrentFilters(
          updatedMessage,
        )
      ) {
        return currentMessages.filter(
          (message) =>
            message.id !== updatedMessage.id,
        );
      }

      return currentMessages.map((message) =>
        message.id === updatedMessage.id
          ? updatedMessage
          : message,
      );
    });

    setHistoryLoaded(false);
    void refreshOverview();
  };

  const overviewCards = overview
    ? [
        {
          label: "Pending reports",
          value: overview.reports.pending,
          icon: Flag,
          color: "text-rose bg-rose/10",
        },
        {
          label: "Published",
          value:
            overview.messages.published,
          icon: Eye,
          color: "text-sage bg-sage/10",
        },
        {
          label: "Hidden",
          value: overview.messages.hidden,
          icon: EyeOff,
          color: "text-blue bg-blue/10",
        },
        {
          label: "Removed",
          value: overview.messages.removed,
          icon: Archive,
          color: "text-coral bg-coral/10",
        },
      ]
    : [];

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted">
            <ShieldCheck
              aria-hidden="true"
              className="h-3.5 w-3.5 text-sage"
            />
            {user.role} workspace
          </div>

          <h1 className="mt-5 font-display text-5xl font-bold tracking-[-0.045em] sm:text-6xl">
            Moderation dashboard
          </h1>

          <p className="mt-3 text-sm leading-7 text-muted">
            Signed in as {user.name} · {user.email}
          </p>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full border border-line bg-surface/70 px-5 text-sm font-bold text-muted transition hover:text-foreground lg:self-auto"
        >
          <LogOut
            aria-hidden="true"
            className="h-4 w-4"
          />
          Sign out
        </button>
      </div>

      {overviewCards.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-[1.7rem] border border-line bg-surface/75 p-5 shadow-sm backdrop-blur-xl"
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-2xl ${card.color}`}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <p className="mt-5 font-display text-4xl font-bold">
                  {card.value}
                </p>

                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">
                  {card.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 flex gap-2 rounded-full border border-line bg-surface/65 p-1.5 sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("queue")}
          className={`flex-1 rounded-full px-5 py-2.5 text-sm font-bold transition sm:flex-none ${
            activeTab === "queue"
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          Review queue
        </button>

        <button
          type="button"
          onClick={() => void openHistory()}
          className={`flex-1 rounded-full px-5 py-2.5 text-sm font-bold transition sm:flex-none ${
            activeTab === "history"
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          Audit history
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-2xl border border-rose/25 bg-rose/10 px-4 py-3 text-sm text-rose-deep"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          {error}
        </p>
      )}

      {activeTab === "queue" ? (
        <>
          <form
            onSubmit={handleFilterSubmit}
            className="mt-7 grid gap-3 rounded-[1.7rem] border border-line bg-surface/70 p-4 backdrop-blur-xl md:grid-cols-[1fr_12rem_12rem_auto]"
          >
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              />

              <input
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
                placeholder="Search message content..."
                className="min-h-11 w-full rounded-2xl border border-line bg-background/70 pl-11 pr-4 text-sm outline-none focus:border-sage"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as MessageStatusFilter,
                )
              }
              aria-label="Message status"
              className="min-h-11 rounded-2xl border border-line bg-background/70 px-4 text-sm outline-none focus:border-sage"
            >
              <option value="ALL">
                All statuses
              </option>
              <option value="PENDING">
                Pending
              </option>
              <option value="PUBLISHED">
                Published
              </option>
              <option value="HIDDEN">
                Hidden
              </option>
              <option value="REMOVED">
                Removed
              </option>
              <option value="EXPIRED">
                Expired
              </option>
            </select>

            <select
              value={reportFilter}
              onChange={(event) =>
                setReportFilter(
                  event.target
                    .value as ReportStatusFilter,
                )
              }
              aria-label="Report status"
              className="min-h-11 rounded-2xl border border-line bg-background/70 px-4 text-sm outline-none focus:border-sage"
            >
              <option value="ALL">
                All reports
              </option>
              <option value="PENDING">
                Pending reports
              </option>
              <option value="REVIEWED">
                Reviewed
              </option>
              <option value="DISMISSED">
                Dismissed
              </option>
              <option value="ACTIONED">
                Actioned
              </option>
            </select>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background"
            >
              <RefreshCw
                aria-hidden="true"
                className="h-4 w-4"
              />
              Apply
            </button>
          </form>

          <div className="mt-7">
            {loading ? (
              <div className="grid min-h-72 place-items-center rounded-[2rem] border border-line bg-surface/50">
                <LoaderCircle
                  aria-hidden="true"
                  className="h-7 w-7 animate-spin text-sage"
                />
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
                <ShieldCheck
                  aria-hidden="true"
                  className="mx-auto h-8 w-8 text-sage"
                />
                <h2 className="mt-5 font-display text-3xl font-bold">
                  The queue is clear
                </h2>
                <p className="mt-3 text-sm text-muted">
                  No messages match the current
                  filters.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => (
                  <ModerationMessageCard
                    key={message.id}
                    message={message}
                    user={user}
                    onUpdated={
                      handleMessageUpdated
                    }
                  />
                ))}
              </div>
            )}

            {messageCursor && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() =>
                    void loadMoreMessages()
                  }
                  disabled={loadingMore}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 text-sm font-bold disabled:opacity-60"
                >
                  {loadingMore && (
                    <LoaderCircle
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />
                  )}
                  Load more messages
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-7">
          <ModerationHistoryPanel
            history={history}
            loading={historyLoading}
            loadingMore={historyLoadingMore}
            nextCursor={historyCursor}
            onLoadMore={() =>
              void loadMoreHistory()
            }
          />
        </div>
      )}
    </section>
  );
}