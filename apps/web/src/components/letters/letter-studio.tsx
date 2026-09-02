"use client";

import {
  useEffect,
  useState,
} from "react";
import { LetterWorkspace } from "./letter-workspace";
import { AuthPanel } from "./auth-panel";
import {
  ApiError,
  apiRequest,
  type AuthenticatedUser,
  type AuthenticationResponse,
  type LetterType,
} from "@/lib/everdear-api";

type StudioStatus =
  | "loading"
  | "guest"
  | "authenticated"
  | "error";

type SessionCheckResult = {
  status: Exclude<StudioStatus, "loading">;
  user: AuthenticatedUser | null;
  error: string | null;
};

async function checkCurrentSession(): Promise<SessionCheckResult> {
  try {
    const result =
      await apiRequest<AuthenticationResponse>(
        "/auth/me",
      );

    return {
      status: "authenticated",
      user: result.user,
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

type LetterStudioProps = {
  initialType?: LetterType | undefined;
};

export function LetterStudio({
  initialType,
}: LetterStudioProps) {
  const [status, setStatus] =
    useState<StudioStatus>("loading");

  const [user, setUser] =
    useState<AuthenticatedUser | null>(null);

  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    void checkCurrentSession().then((result) => {
      if (!active) {
        return;
      }

      setUser(result.user);
      setError(result.error);
      setStatus(result.status);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleRetry = async () => {
    setStatus("loading");
    setError(null);

    const result = await checkCurrentSession();

    setUser(result.user);
    setError(result.error);
    setStatus(result.status);
  };

  const handleAuthenticated = (
    authenticatedUser: AuthenticatedUser,
  ) => {
    setUser(authenticatedUser);
    setStatus("authenticated");
  };

  const handleSignOut = async () => {
    try {
      await apiRequest<void>("/auth/logout", {
        method: "POST",
      });
    } finally {
      setUser(null);
      setStatus("guest");
    }
  };

  if (status === "loading") {
    return (
      <section className="mx-auto grid min-h-[calc(100svh-91px)] max-w-[1180px] place-items-center px-5">
        <div
          className="flex items-center gap-3 text-sm font-semibold text-muted"
          role="status"
        >
          <span className="h-3 w-3 animate-pulse rounded-full bg-rose" />
          Opening your private studio...
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="mx-auto grid min-h-[calc(100svh-91px)] max-w-[1180px] place-items-center px-5">
        <div className="max-w-lg rounded-[2rem] border border-line bg-surface/80 p-8 text-center shadow-xl backdrop-blur-xl">
          <h1 className="font-display text-3xl font-bold">
            The studio could not open.
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
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
      <AuthPanel
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <LetterWorkspace
      user={user}
      initialType={initialType}
      onSignOut={handleSignOut}
    />
  );
}