"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ApiError,
  apiRequest,
  type AuthenticatedUser,
  type AuthenticationResponse,
} from "@/lib/everdear-api";
import {
  AlertCircle,
  LoaderCircle,
  LogOut,
  ShieldX,
} from "lucide-react";
import { AdminLoginPanel } from "./admin-login-panel";
import { ModerationDashboard } from "./moderation-dashboard";

type ModerationGateStatus =
  | "loading"
  | "guest"
  | "authorized"
  | "forbidden"
  | "error";

type SessionResult = {
  status: Exclude<
    ModerationGateStatus,
    "loading"
  >;
  user: AuthenticatedUser | null;
  error: string | null;
};

async function checkStaffSession(): Promise<SessionResult> {
  try {
    const response =
      await apiRequest<AuthenticationResponse>(
        "/auth/me",
      );

    if (response.user.role === "USER") {
      return {
        status: "forbidden",
        user: response.user,
        error: null,
      };
    }

    return {
      status: "authorized",
      user: response.user,
      error: null,
    };
  } catch (requestError: unknown) {
    if (
      requestError instanceof ApiError &&
      requestError.status === 401
    ) {
      return {
        status: "guest",
        user: null,
        error: null,
      };
    }

    return {
      status: "error",
      user: null,
      error:
        requestError instanceof Error
          ? requestError.message
          : "Unable to reach the EverDear API.",
    };
  }
}

export function ModerationGate() {
  const [status, setStatus] =
    useState<ModerationGateStatus>("loading");

  const [user, setUser] =
    useState<AuthenticatedUser | null>(null);

  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    void checkStaffSession().then((result) => {
      if (!active) {
        return;
      }

      setStatus(result.status);
      setUser(result.user);
      setError(result.error);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleRetry = async () => {
    setStatus("loading");
    setError(null);

    const result = await checkStaffSession();

    setStatus(result.status);
    setUser(result.user);
    setError(result.error);
  };

  const handleAuthenticated = (
    authenticatedUser: AuthenticatedUser,
  ) => {
    setUser(authenticatedUser);

    setStatus(
      authenticatedUser.role === "USER"
        ? "forbidden"
        : "authorized",
    );
  };

  const handleSignOut = async () => {
    try {
      await apiRequest<void>("/auth/logout", {
        method: "POST",
      });
    } finally {
      setUser(null);
      setError(null);
      setStatus("guest");
    }
  };

  if (status === "loading") {
    return (
      <section className="grid min-h-[calc(100svh-91px)] place-items-center px-5">
        <div
          className="text-center"
          role="status"
        >
          <LoaderCircle
            aria-hidden="true"
            className="mx-auto h-7 w-7 animate-spin text-sage"
          />
          <p className="mt-4 text-sm font-semibold text-muted">
            Verifying staff access...
          </p>
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="grid min-h-[calc(100svh-91px)] place-items-center px-5">
        <div className="w-full max-w-lg rounded-[2rem] border border-line bg-surface/85 p-8 text-center shadow-xl backdrop-blur-xl">
          <AlertCircle
            aria-hidden="true"
            className="mx-auto h-8 w-8 text-rose"
          />

          <h1 className="mt-5 font-display text-3xl font-bold">
            The dashboard could not open
          </h1>

          <p className="mt-3 text-sm leading-7 text-muted">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void handleRetry()}
            className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (status === "guest") {
    return (
      <AdminLoginPanel
        onAuthenticated={
          handleAuthenticated
        }
      />
    );
  }

  if (status === "forbidden") {
    return (
      <section className="grid min-h-[calc(100svh-91px)] place-items-center px-5 py-12">
        <div className="w-full max-w-xl rounded-[2.25rem] border border-line bg-surface/85 p-8 text-center shadow-xl backdrop-blur-xl sm:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose/12 text-rose">
            <ShieldX
              aria-hidden="true"
              className="h-7 w-7"
            />
          </span>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-rose">
            Access restricted
          </p>

          <h1 className="mt-3 font-display text-4xl font-bold">
            This account is not a staff account.
          </h1>

          <p className="mt-4 text-sm leading-7 text-muted">
            {user?.email} is signed in, but the
            moderation dashboard requires a
            Moderator or Administrator role.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                void handleSignOut()
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-bold text-background"
            >
              <LogOut
                aria-hidden="true"
                className="h-4 w-4"
              />
              Sign out
            </button>

            <Link
              href="/wall"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-6 text-sm font-bold text-muted"
            >
              Return to the Wall
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ModerationDashboard
      user={user}
      onSignOut={() => void handleSignOut()}
    />
  );
}