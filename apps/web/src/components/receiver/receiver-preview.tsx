"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import {
  ApiError,
  apiRequest,
  type Letter,
  type LetterAttachment,
} from "@/lib/everdear-api";
import { ReceiverExperience } from "./receiver-experience";

type ReceiverPreviewProps = {
  letterId: string;
};

type PreviewData = {
  letter: Letter;
  attachments: LetterAttachment[];
};

export function ReceiverPreview({
  letterId,
}: ReceiverPreviewProps) {
  const [previewData, setPreviewData] =
    useState<PreviewData | null>(null);

  const [error, setError] = useState<
    string | null
  >(null);

  const [authenticationRequired, setAuthenticationRequired] =
    useState(false);

  useEffect(() => {
    const abortController =
      new AbortController();

    let active = true;

    void Promise.all([
      apiRequest<Letter>(
        `/letters/${letterId}`,
        {
          signal: abortController.signal,
        },
      ),

      apiRequest<LetterAttachment[]>(
        `/letters/${letterId}/attachments`,
        {
          signal: abortController.signal,
        },
      ),
    ])
      .then(([letter, attachments]) => {
        if (!active) {
          return;
        }

        setPreviewData({
          letter,
          attachments,
        });
      })
      .catch((requestError: unknown) => {
        if (
          !active ||
          abortController.signal.aborted
        ) {
          return;
        }

        if (
          requestError instanceof ApiError &&
          requestError.status === 401
        ) {
          setAuthenticationRequired(true);
          setError(
            "Sign in to preview this private letter.",
          );
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "This letter preview could not be loaded.",
        );
      });

    return () => {
      active = false;
      abortController.abort();
    };
  }, [letterId]);

  if (error) {
    return (
      <main className="grid min-h-svh place-items-center bg-background px-6 text-foreground">
        <section className="w-full max-w-lg rounded-[2rem] border border-line bg-surface/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose/10 text-rose">
            <LockKeyhole
              aria-hidden="true"
              className="h-6 w-6"
            />
          </span>

          <h1 className="mt-5 font-display text-3xl font-bold">
            Private preview
          </h1>

          <p className="mt-3 text-sm leading-7 text-muted">
            {error}
          </p>

          <Link
            href="/write"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background"
          >
            <ArrowLeft className="h-4 w-4" />
            {authenticationRequired
              ? "Go to sign in"
              : "Return to your letters"}
          </Link>
        </section>
      </main>
    );
  }

  if (!previewData) {
    return (
      <main className="grid min-h-svh place-items-center bg-background px-6 text-foreground">
        <div
          role="status"
          className="flex items-center gap-3 rounded-full border border-line bg-surface/80 px-5 py-3 text-sm font-semibold text-muted shadow-xl backdrop-blur-xl"
        >
          <LoaderCircle
            aria-hidden="true"
            className="h-4 w-4 animate-spin text-rose"
          />
          Preparing your private preview...
        </div>
      </main>
    );
  }

  return (
    <ReceiverExperience
      letter={previewData.letter}
      attachments={previewData.attachments}
      previewMode
    />
  );
}