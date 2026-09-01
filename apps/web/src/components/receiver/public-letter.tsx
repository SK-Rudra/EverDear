"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Heart,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import {
  ApiError,
  apiRequest,
  type PublicLetterResponse,
} from "@/lib/everdear-api";
import { ReceiverExperience } from "./receiver-experience";

type PublicLetterProps = {
  token: string;
};

export function PublicLetter({
  token,
}: PublicLetterProps) {
  const [letter, setLetter] =
    useState<PublicLetterResponse | null>(null);

  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    const abortController =
      new AbortController();

    let active = true;

    void apiRequest<PublicLetterResponse>(
      `/public/letters/${token}`,
      {
        signal: abortController.signal,
      },
    )
      .then((loadedLetter) => {
        if (active) {
          setLetter(loadedLetter);
        }
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
          requestError.status === 410
        ) {
          setError(
            "This private letter is no longer available. Its link may have expired or been revoked.",
          );
          return;
        }

        setError(
          "This private letter could not be found. Check that the link is complete.",
        );
      });

    return () => {
      active = false;
      abortController.abort();
    };
  }, [token]);

  if (error) {
    return (
      <main className="grid min-h-svh place-items-center bg-[radial-gradient(circle_at_top,#fff4f3_0%,#f7eee8_48%,#efe6df_100%)] px-6 text-[#352d32]">
        <section className="w-full max-w-lg rounded-[2.25rem] border border-[#352d32]/10 bg-white/70 p-8 text-center shadow-[0_30px_100px_rgba(65,45,55,0.15)] backdrop-blur-xl">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#a85161]/10 text-[#a85161]">
            <LockKeyhole className="h-7 w-7" />
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold tracking-[-0.04em]">
            A private letter
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#352d32]/60">
            {error}
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#352d32] px-5 text-sm font-bold text-white"
          >
            <Heart className="h-4 w-4" />
            Visit EverDear
          </Link>
        </section>
      </main>
    );
  }

  if (!letter) {
    return (
      <main className="grid min-h-svh place-items-center bg-[radial-gradient(circle_at_top,#fff4f3_0%,#f7eee8_48%,#efe6df_100%)] px-6 text-[#352d32]">
        <div
          role="status"
          className="flex items-center gap-3 rounded-full border border-[#352d32]/10 bg-white/65 px-5 py-3 text-sm font-semibold shadow-xl backdrop-blur-xl"
        >
          <LoaderCircle className="h-4 w-4 animate-spin text-[#a85161]" />
          Preparing your letter...
        </div>
      </main>
    );
  }

  return (
    <ReceiverExperience
      letter={letter}
      attachments={letter.attachments}
      publicToken={token}
    />
  );
}