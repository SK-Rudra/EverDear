"use client";

import {
  type FormEvent,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Heart,
  House,
  Sparkles,
  Users,
} from "lucide-react";
import {
  apiRequest,
  type Letter,
  type LetterType,
} from "@/lib/everdear-api";

type NewLetterFormProps = {
  defaultSenderName: string;
  initialType?: LetterType | undefined;
  onCreated: (letter: Letter) => void;
  onCancel?: (() => void) | undefined;
};

type LetterOption = {
  type: LetterType;
  label: string;
  description: string;
  icon: LucideIcon;
  activeClass: string;
  iconClass: string;
};

const letterOptions: LetterOption[] = [
  {
    type: "LOVED",
    label: "Loved one",
    description:
      "Tender, romantic, and deeply personal.",
    icon: Heart,
    activeClass:
      "border-rose/60 bg-rose/10 shadow-[0_18px_45px_rgba(200,107,122,0.12)]",
    iconClass: "bg-rose/15 text-rose",
  },
  {
    type: "FRIEND",
    label: "Friend",
    description:
      "Warm, bright, and full of shared stories.",
    icon: Users,
    activeClass:
      "border-blue/60 bg-blue/10 shadow-[0_18px_45px_rgba(108,137,168,0.12)]",
    iconClass: "bg-blue/15 text-blue",
  },
  {
    type: "FAMILY",
    label: "Family",
    description:
      "Grounded, familiar, and made to last.",
    icon: House,
    activeClass:
      "border-sage/60 bg-sage/10 shadow-[0_18px_45px_rgba(120,148,123,0.12)]",
    iconClass: "bg-sage/15 text-sage",
  },
];

export function NewLetterForm({
  defaultSenderName,
  initialType,
  onCreated,
  onCancel,
}: NewLetterFormProps) {
  const [type, setType] =
    useState<LetterType>(
      initialType ?? "LOVED",
    );

  const [recipientName, setRecipientName] =
    useState("");

  const [senderName, setSenderName] = useState(
    defaultSenderName,
  );

  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const letter = await apiRequest<Letter>(
        "/letters",
        {
          method: "POST",
          json: {
            type,
            recipientName,
            senderName,
            ...(title.trim()
              ? {
                  title,
                }
              : {}),
            content: {
              body: "",
            },
          },
        },
      );

      onCreated(letter);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The draft could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-line bg-surface/80 p-5 shadow-[0_25px_80px_rgba(44,36,48,0.1)] backdrop-blur-xl sm:p-8">
      <div className="mb-8">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-rose/15 text-rose">
          <Sparkles
            aria-hidden="true"
            className="h-5 w-5"
          />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose">
          New private draft
        </p>

        <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
          Who are these words for?
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          Choose the feeling first. EverDear will
          shape the paper, color, and reading
          experience around it.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-7"
      >
        <fieldset>
          <legend className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Letter style
          </legend>

          <div className="grid gap-3 md:grid-cols-3">
            {letterOptions.map((option) => {
              const Icon = option.icon;
              const selected = type === option.type;

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() =>
                    setType(option.type)
                  }
                  aria-pressed={selected}
                  className={`rounded-3xl border p-4 text-left transition duration-300 hover:-translate-y-0.5 ${
                    selected
                      ? option.activeClass
                      : "border-line bg-background/40 hover:border-foreground/25"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-2xl ${option.iconClass}`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-4 w-4"
                    />
                  </span>

                  <span className="mt-4 block text-sm font-bold">
                    {option.label}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-muted">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted">
              To
            </span>

            <input
              required
              minLength={1}
              maxLength={120}
              value={recipientName}
              onChange={(event) =>
                setRecipientName(event.target.value)
              }
              placeholder="Their name"
              className="h-14 w-full appearance-none rounded-2xl border border-line bg-background/50 px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-rose/60 focus:ring-4 focus:ring-rose/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted">
              From
            </span>

            <input
              required
              minLength={1}
              maxLength={120}
              value={senderName}
              onChange={(event) =>
                setSenderName(event.target.value)
              }
              placeholder="Your name"
              className="h-14 w-full appearance-none rounded-2xl border border-line bg-background/50 px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-rose/60 focus:ring-4 focus:ring-rose/10"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Title{" "}
            <span className="normal-case tracking-normal">
              (optional)
            </span>
          </span>

          <input
            maxLength={160}
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="For all the words I kept meaning to say"
            className="h-14 w-full appearance-none rounded-2xl border border-line bg-background/50 px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-rose/60 focus:ring-4 focus:ring-rose/10"
          />
        </label>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose-deep"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-13 rounded-full border border-line px-6 text-sm font-bold text-muted transition hover:text-foreground"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-bold text-background transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Creating draft..."
              : "Begin this letter"}

            {!submitting && (
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
              />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}