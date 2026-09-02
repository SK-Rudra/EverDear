"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { LetterEditor } from "./letter-editor";
import {
  ChevronRight,
  FileText,
  LogOut,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { NewLetterForm } from "./new-letter-form";
import {
  apiRequest,
  type AuthenticatedUser,
  type Letter,
  type LetterType,
} from "@/lib/everdear-api";

type LetterWorkspaceProps = {
  user: AuthenticatedUser;
  initialType?: LetterType | undefined;
  onSignOut: () => Promise<void>;
};

type WorkspaceResult = {
  letters: Letter[];
  error: string | null;
};

async function fetchLetters(): Promise<WorkspaceResult> {
  try {
    return {
      letters:
        await apiRequest<Letter[]>("/letters"),
      error: null,
    };
  } catch (requestError: unknown) {
    return {
      letters: [],
      error:
        requestError instanceof Error
          ? requestError.message
          : "Your drafts could not be loaded.",
    };
  }
}

const dateFormatter = new Intl.DateTimeFormat(
  "en",
  {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
);

function getTypeLabel(letter: Letter): string {
  switch (letter.type) {
    case "LOVED":
      return "Loved one";
    case "FRIEND":
      return "Friend";
    case "FAMILY":
      return "Family";
  }
}

function getTypeClasses(letter: Letter): string {
  switch (letter.type) {
    case "LOVED":
      return "bg-rose/15 text-rose";
    case "FRIEND":
      return "bg-blue/15 text-blue";
    case "FAMILY":
      return "bg-sage/15 text-sage";
  }
}

export function LetterWorkspace({
  user,
  initialType,
  onSignOut,
}: LetterWorkspaceProps) {
  const [letters, setLetters] = useState<
    Letter[]
  >([]);

  const [selectedLetter, setSelectedLetter] =
    useState<Letter | null>(null);

  const [showNewLetter, setShowNewLetter] =
    useState(initialType !== undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    void fetchLetters().then((result) => {
      if (!active) {
        return;
      }

      setLetters(result.letters);
      setSelectedLetter(
        result.letters[0] ?? null,
      );
      setError(result.error);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleCreated = (letter: Letter) => {
    setLetters((current) => [
      letter,
      ...current,
    ]);

    setSelectedLetter(letter);
    setShowNewLetter(false);
  };

  const handleLetterUpdated = useCallback(
    (updatedLetter: Letter) => {
      setLetters((current) =>
        current.map((letter) =>
          letter.id === updatedLetter.id
            ? updatedLetter
            : letter,
        ),
      );

      setSelectedLetter((current) =>
        current?.id === updatedLetter.id
          ? updatedLetter
          : current,
      );
    },
    [],
  );

  const handleLetterDeleted = useCallback(
    (letterId: string) => {
      setLetters((current) =>
        current.filter(
          (letter) => letter.id !== letterId,
        ),
      );

      setSelectedLetter((current) =>
        current?.id === letterId
          ? null
          : current,
      );

      setShowNewLetter(true);
    },
    [],
  );

  const handleRetry = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchLetters();

    setLetters(result.letters);
    setSelectedLetter(
      result.letters[0] ?? null,
    );
    setError(result.error);
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="mx-auto grid min-h-[calc(100svh-91px)] max-w-[1180px] place-items-center px-5">
        <div
          role="status"
          className="flex items-center gap-3 text-sm font-semibold text-muted"
        >
          <span className="h-3 w-3 animate-pulse rounded-full bg-rose" />
          Gathering your drafts...
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto min-h-[calc(100svh-91px)] w-full max-w-[1180px] px-5 py-10 lg:py-14">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose">
            Your private studio
          </p>

          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Welcome, {user.name}.
          </h1>

          <p className="mt-3 text-sm text-muted">
            Every draft remains private until
            you decide otherwise.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {(user.role === "ADMIN" ||
            user.role === "MODERATOR") && (
            <Link
              href="/admin/moderation"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-rose/30 bg-rose/10 px-5 text-sm font-bold text-rose-deep transition hover:border-rose/50 hover:bg-rose/15"
            >
              <ShieldCheck
                aria-hidden="true"
                className="h-4 w-4"
              />

              Moderation dashboard
            </Link>
          )}

          <button
            type="button"
            onClick={() =>
              setShowNewLetter(true)
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background"
          >
            <Plus
              aria-hidden="true"
              className="h-4 w-4"
            />
            New letter
          </button>

          <button
            type="button"
            onClick={() => void onSignOut()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface/60 px-5 text-sm font-bold text-muted transition hover:text-foreground"
          >
            <LogOut
              aria-hidden="true"
              className="h-4 w-4"
            />
            Sign out
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-[2rem] border border-rose/30 bg-rose/10 p-8 text-center">
          <p className="text-sm text-rose-deep">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void handleRetry()}
            className="mt-5 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background"
          >
            Try again
          </button>
        </div>
      ) : showNewLetter ||
        letters.length === 0 ? (
        <NewLetterForm
          defaultSenderName={user.name}
          initialType={initialType}
          onCreated={handleCreated}
          onCancel={
            letters.length > 0
              ? () => setShowNewLetter(false)
              : undefined
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-line bg-surface/70 p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between px-3 pb-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Your letters
              </p>

              <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-bold text-muted">
                {letters.length}
              </span>
            </div>

            <div className="space-y-2">
              {letters.map((letter) => {
                const selected =
                  selectedLetter?.id === letter.id;

                return (
                  <button
                    key={letter.id}
                    type="button"
                    onClick={() =>
                      setSelectedLetter(letter)
                    }
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      selected
                        ? "border-foreground/20 bg-foreground/5"
                        : "border-transparent hover:border-line hover:bg-background/40"
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${getTypeClasses(letter)}`}
                    >
                      <FileText
                        aria-hidden="true"
                        className="h-4 w-4"
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {letter.title ||
                          `For ${letter.recipientName}`}
                      </span>

                      <span className="mt-1 block text-xs text-muted">
                        {getTypeLabel(letter)} ·{" "}
                        {dateFormatter.format(
                          new Date(
                            letter.updatedAt,
                          ),
                        )}
                      </span>
                    </span>

                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5"
                    />
                  </button>
                );
              })}
            </div>
          </aside>

          {selectedLetter && (
            <LetterEditor
              key={selectedLetter.id}
              letter={selectedLetter}
              onUpdated={handleLetterUpdated}
              onDeleted={handleLetterDeleted}
            />
          )}
        </div>
      )}
    </section>
  );
}