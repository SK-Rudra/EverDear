
"use client";

import {
  type FormEvent,
  useState,
} from "react";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import {
  apiRequest,
  type AuthenticatedUser,
  type AuthenticationResponse,
} from "@/lib/everdear-api";

type AuthMode = "login" | "register";

type AuthPanelProps = {
  onAuthenticated: (
    user: AuthenticatedUser,
  ) => void;
};

export function AuthPanel({
  onAuthenticated,
}: AuthPanelProps) {
  const [mode, setMode] =
    useState<AuthMode>("register");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setPassword("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const result =
        await apiRequest<AuthenticationResponse>(
          mode === "register"
            ? "/auth/register"
            : "/auth/login",
          {
            method: "POST",
            json:
              mode === "register"
                ? {
                    name,
                    email,
                    password,
                  }
                : {
                    email,
                    password,
                  },
          },
        );

      onAuthenticated(result.user);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-[calc(100svh-91px)] w-full max-w-[1180px] items-center gap-12 px-5 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
      <div className="max-w-2xl">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-rose">
          Private letter studio
        </p>

        <h1 className="font-display text-5xl font-bold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
          Some words deserve a quieter place.
        </h1>

        <p className="mt-7 max-w-xl text-base leading-8 text-muted sm:text-lg">
          Sign in to create a private draft,
          return to it later, and keep every
          meaningful word safely connected to
          your account.
        </p>

        <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
          {[
            "Private drafts",
            "Automatic saving",
            "Revocable access",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-line bg-surface/50 px-4 py-4 text-sm font-semibold text-muted backdrop-blur-xl"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute -inset-8 rounded-[3rem] bg-rose/10 blur-3xl"
        />

        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface/90 p-6 shadow-[0_30px_90px_rgba(44,36,48,0.13)] backdrop-blur-2xl sm:p-8">
          <div
            className="grid grid-cols-2 rounded-full border border-line bg-background/60 p-1"
            role="tablist"
            aria-label="Authentication method"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() =>
                changeMode("register")
              }
              className={`rounded-full px-4 py-3 text-sm font-bold transition ${
                mode === "register"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Create account
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => changeMode("login")}
              className={`rounded-full px-4 py-3 text-sm font-bold transition ${
                mode === "login"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Sign in
            </button>
          </div>

          <div className="mb-7 mt-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-rose/15 text-rose">
              <LockKeyhole
                aria-hidden="true"
                className="h-5 w-5"
              />
            </div>

            <h2 className="font-display text-3xl font-bold tracking-[-0.035em]">
              {mode === "register"
                ? "Begin your first letter"
                : "Welcome back"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              {mode === "register"
                ? "Create your private EverDear space."
                : "Continue writing where you left off."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {mode === "register" && (
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Your name
                </span>

                <span className="flex items-center gap-3 rounded-2xl border border-line bg-background/60 px-4 transition focus-within:border-rose/60 focus-within:ring-4 focus-within:ring-rose/10">
                  <UserRound
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-muted"
                  />

                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    autoComplete="name"
                    placeholder="Your name"
                    className="h-14 min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm text-foreground outline-none ring-0 placeholder:text-muted/60 focus:outline-none focus:ring-0"
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Email
              </span>

              <span className="flex items-center gap-3 rounded-2xl border border-line bg-background/60 px-4 transition focus-within:border-rose/60 focus-within:ring-4 focus-within:ring-rose/10">
                <Mail
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-muted"
                />

                <input
                  required
                  type="email"
                  maxLength={320}
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-14 min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm text-foreground outline-none ring-0 placeholder:text-muted/60 focus:outline-none focus:ring-0"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Password
              </span>

              <span className="flex items-center gap-3 rounded-2xl border border-line bg-background/60 px-4 transition focus-within:border-rose/60 focus-within:ring-4 focus-within:ring-rose/10">
                <LockKeyhole
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-muted"
                />

                <input
                  required
                  type="password"
                  minLength={
                    mode === "register" ? 15 : 1
                  }
                  maxLength={128}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete={
                    mode === "register"
                      ? "new-password"
                      : "current-password"
                  }
                  placeholder={
                    mode === "register"
                      ? "At least 15 characters"
                      : "Your password"
                  }
                  className="h-14 min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm text-foreground outline-none ring-0 placeholder:text-muted/60 focus:outline-none focus:ring-0"
                />
              </span>

              {mode === "register" && (
                <span className="mt-2 block text-xs leading-5 text-muted">
                  Use a memorable passphrase of at
                  least 15 characters.
                </span>
              )}
            </label>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm leading-6 text-rose-deep"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-bold text-background transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Please wait..."
                : mode === "register"
                  ? "Create my space"
                  : "Enter my studio"}

              {!submitting && (
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}