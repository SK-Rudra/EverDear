"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Heart,
  House,
  LoaderCircle,
  LockKeyhole,
  Trash2,
  Users,
} from "lucide-react";
import {
  apiRequest,
  type Letter,
  type LetterType,
  type UpdateLetterInput,
} from "@/lib/everdear-api";
import { LetterAttachments } from "./letter-attachments";

type LetterEditorProps = {
  letter: Letter;
  onUpdated: (letter: Letter) => void;
  onDeleted: (letterId: string) => void;
};

type SaveState =
  | "saved"
  | "unsaved"
  | "saving"
  | "error";

type ThemeOption = {
  type: LetterType;
  label: string;
  icon: LucideIcon;
  activeClass: string;
};

const themeOptions: ThemeOption[] = [
  {
    type: "LOVED",
    label: "Loved",
    icon: Heart,
    activeClass:
      "border-rose/50 bg-rose/15 text-rose",
  },
  {
    type: "FRIEND",
    label: "Friend",
    icon: Users,
    activeClass:
      "border-blue/50 bg-blue/15 text-blue",
  },
  {
    type: "FAMILY",
    label: "Family",
    icon: House,
    activeClass:
      "border-sage/50 bg-sage/15 text-sage",
  },
];

function getAccentClass(type: LetterType): string {
  switch (type) {
    case "LOVED":
      return "bg-rose";
    case "FRIEND":
      return "bg-blue";
    case "FAMILY":
      return "bg-sage";
  }
}

export function LetterEditor({
  letter,
  onUpdated,
  onDeleted,
}: LetterEditorProps) {
  const [type, setType] =
    useState<LetterType>(letter.type);

  const [recipientName, setRecipientName] =
    useState(letter.recipientName);

  const [senderName, setSenderName] = useState(
    letter.senderName,
  );

  const [title, setTitle] = useState(
    letter.title ?? "",
  );

  const [body, setBody] = useState(
    letter.content.body,
  );

  const [saveState, setSaveState] =
    useState<SaveState>("saved");

  const [saveError, setSaveError] = useState<
    string | null
  >(null);

  const [deleting, setDeleting] =
    useState(false);

  const initialSnapshot = JSON.stringify({
    type: letter.type,
    recipientName: letter.recipientName,
    senderName: letter.senderName,
    title: letter.title,
    content: {
      body: letter.content.body,
    },
  });

  const savedSnapshotRef = useRef(
    initialSnapshot,
  );

  const namesComplete =
    recipientName.trim().length > 0 &&
    senderName.trim().length > 0;

  useEffect(() => {
    const updateInput: UpdateLetterInput = {
      type,
      recipientName,
      senderName,
      title: title.trim() ? title.trim() : null,
      content: {
        body,
      },
    };

    const currentSnapshot =
      JSON.stringify(updateInput);

    if (
      currentSnapshot ===
        savedSnapshotRef.current ||
      !recipientName.trim() ||
      !senderName.trim()
    ) {
      return;
    }

    const abortController =
      new AbortController();

    const timer = window.setTimeout(() => {
      setSaveState("saving");
      setSaveError(null);

      void apiRequest<Letter>(
        `/letters/${letter.id}`,
        {
          method: "PATCH",
          json: updateInput,
          signal: abortController.signal,
        },
      )
        .then((updatedLetter) => {
          if (abortController.signal.aborted) {
            return;
          }

          savedSnapshotRef.current =
            currentSnapshot;

          setSaveState("saved");
          onUpdated(updatedLetter);
        })
        .catch((requestError: unknown) => {
          if (abortController.signal.aborted) {
            return;
          }

          setSaveState("error");
          setSaveError(
            requestError instanceof Error
              ? requestError.message
              : "Your changes could not be saved.",
          );
        });
    }, 850);

    return () => {
      window.clearTimeout(timer);
      abortController.abort();
    };
  }, [
    body,
    letter.id,
    onUpdated,
    recipientName,
    senderName,
    title,
    type,
  ]);

  const markUnsaved = () => {
    setSaveState("unsaved");
    setSaveError(null);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this draft permanently?",
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setSaveError(null);

    try {
      await apiRequest<void>(
        `/letters/${letter.id}`,
        {
          method: "DELETE",
        },
      );

      onDeleted(letter.id);
    } catch (requestError: unknown) {
      setSaveError(
        requestError instanceof Error
          ? requestError.message
          : "The draft could not be deleted.",
      );

      setSaveState("error");
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-line bg-surface/70 p-3 backdrop-blur-xl sm:flex-row sm:items-center">
        <div
          className="flex flex-wrap gap-2"
          aria-label="Letter style"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const selected =
              type === option.type;

            return (
              <button
                key={option.type}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setType(option.type);
                  markUnsaved();
                }}
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-xs font-bold transition ${
                  selected
                    ? option.activeClass
                    : "border-transparent text-muted hover:border-line hover:text-foreground"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div
            aria-live="polite"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-background/50 px-3 text-xs font-semibold text-muted"
          >
            {!namesComplete ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-coral" />
                Add both names
              </>
            ) : saveState === "saving" ? (
              <>
                <LoaderCircle className="h-3.5 w-3.5 animate-spin text-blue" />
                Saving...
              </>
            ) : saveState === "saved" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-sage" />
                Saved
              </>
            ) : saveState === "error" ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-rose" />
                Save failed
              </>
            ) : (
              <>
                <Cloud className="h-3.5 w-3.5 text-muted" />
                Unsaved
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            aria-label="Delete draft"
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition hover:border-rose/40 hover:bg-rose/10 hover:text-rose disabled:opacity-50"
          >
            {deleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <article className="relative overflow-hidden rounded-[2rem] border border-line bg-paper text-paper-ink shadow-[0_28px_90px_rgba(44,36,48,0.12)]">
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-1.5 ${getAccentClass(type)}`}
        />

        <div className="p-6 sm:p-9 lg:p-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-paper-ink/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-paper-ink/55">
              <LockKeyhole className="h-3.5 w-3.5" />
              Private draft
            </span>

            <span className="text-xs font-semibold text-paper-ink/45">
              {body.length.toLocaleString()} / 20,000
            </span>
          </div>

          <label className="mt-9 block">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-paper-ink/45">
              To
            </span>

            <input
              value={recipientName}
              onChange={(event) => {
                setRecipientName(
                  event.target.value,
                );
                markUnsaved();
              }}
              maxLength={120}
              placeholder="Recipient name"
              className="mt-2 h-12 w-full appearance-none border-0 bg-transparent p-0 font-display text-2xl font-bold text-paper-ink outline-none ring-0 placeholder:text-paper-ink/25 focus:outline-none focus:ring-0"
            />
          </label>

          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              markUnsaved();
            }}
            maxLength={160}
            aria-label="Letter title"
            placeholder="Give this letter a title..."
            className="mt-7 w-full appearance-none border-0 bg-transparent p-0 font-display text-4xl font-bold tracking-[-0.04em] text-paper-ink outline-none ring-0 placeholder:text-paper-ink/20 focus:outline-none focus:ring-0 sm:text-5xl"
          />

          <div className="my-8 h-px bg-paper-ink/10" />

          <textarea
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              markUnsaved();
            }}
            maxLength={20_000}
            spellCheck
            aria-label="Letter body"
            placeholder="Dear someone who matters..."
            className="min-h-[25rem] w-full resize-y appearance-none border-0 bg-transparent p-0 font-display text-lg leading-9 text-paper-ink/85 outline-none ring-0 placeholder:text-paper-ink/25 focus:outline-none focus:ring-0"
          />

          <LetterAttachments letterId={letter.id} />

          <div className="mt-10 border-t border-paper-ink/10 pt-7">
            <p className="text-right text-sm text-paper-ink/45">
              With care,
            </p>

            <input
              value={senderName}
              onChange={(event) => {
                setSenderName(
                  event.target.value,
                );
                markUnsaved();
              }}
              maxLength={120}
              aria-label="Sender name"
              placeholder="Your name"
              className="ml-auto mt-2 block h-12 w-full max-w-sm appearance-none border-0 bg-transparent p-0 text-right font-display text-2xl font-bold text-paper-ink outline-none ring-0 placeholder:text-paper-ink/25 focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </article>

      {saveError && (
        <div
          role="alert"
          className="rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose-deep"
        >
          {saveError}
        </div>
      )}

      <p className="text-center text-xs leading-5 text-muted">
        Changes are encrypted in transit and
        automatically saved to your private
        account.
      </p>
    </div>
  );
}