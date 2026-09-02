"use client";

import {
  type FormEvent,
  useState,
} from "react";
import {
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  apiRequest,
  type AuthenticatedUser,
  type AuthenticationResponse,
} from "@/lib/everdear-api";

type AdminLoginPanelProps = {
  onAuthenticated: (
    user: AuthenticatedUser,
  ) => void;
};

export function AdminLoginPanel({
  onAuthenticated,
}: AdminLoginPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response =
        await apiRequest<AuthenticationResponse>(
          "/auth/login",
          {
            method: "POST",
            json: {
              email,
              password,
            },
          },
        );

      onAuthenticated(response.user);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Staff authentication failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-[calc(100svh-91px)] w-full max-w-[1180px] items-center gap-12 px-5 py-12 lg:grid-cols-[1fr_0.82fr] lg:py-20">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-muted backdrop-blur-xl">
          <ShieldCheck
            aria-hidden="true"
            className="h-3.5 w-3.5 text-sage"
          />
          EverDear staff
        </div>

        <h1 className="mt-7 font-display text-5xl font-bold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
          Keep the Wall{" "}
          <span className="italic text-rose-deep">
            gentle.
          </span>
        </h1>

        <p className="mt-7 max-w-xl text-base leading-8 text-muted sm:text-lg">
          Review community concerns, protect
          private information, and make careful
          moderation decisions with a complete
          audit history.
        </p>

        <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
          {[
            "Role protected",
            "Audited actions",
            "Private reports",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-line bg-surface/55 px-4 py-4 text-sm font-semibold text-muted backdrop-blur-xl"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute -inset-8 rounded-[3rem] bg-sage/10 blur-3xl"
        />

        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface/90 p-6 shadow-[0_30px_90px_rgba(34,29,36,0.13)] backdrop-blur-2xl sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sage/15 text-sage">
            <LockKeyhole
              aria-hidden="true"
              className="h-5 w-5"
            />
          </span>

          <h2 className="mt-6 font-display text-3xl font-bold tracking-[-0.035em]">
            Staff sign in
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            This area is restricted to EverDear
            moderators and administrators.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted"
              >
                Email
              </label>

              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                />

                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  autoComplete="email"
                  placeholder="staff@everdear.com"
                  className="min-h-12 w-full rounded-2xl border border-line bg-background/70 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted/50 focus:border-sage"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                />

                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Your secure password"
                  className="min-h-12 w-full rounded-2xl border border-line bg-background/70 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted/50 focus:border-sage"
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-2xl border border-rose/25 bg-rose/10 px-4 py-3 text-sm leading-6 text-rose-deep"
              >
                {error}
              </p>
            )}

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
                  Checking access
                </>
              ) : (
                "Open moderation dashboard"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-muted">
            New staff accounts cannot be created
            from this page. Roles must be assigned
            securely by an administrator.
          </p>
        </div>
      </div>
    </section>
  );
}