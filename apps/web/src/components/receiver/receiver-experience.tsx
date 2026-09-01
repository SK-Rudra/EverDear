"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  Heart,
  House,
  RotateCcw,
  Users,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  getApiUrl,
  type Letter,
  type LetterAttachment,
  type LetterType,
} from "@/lib/everdear-api";
import { ReceiverLetterView } from "./receiver-letter-view";

type ReceiverExperienceProps = {
  letter: Letter;
  attachments: LetterAttachment[];
  previewMode?: boolean;
};

type ThemeDetails = {
  label: string;
  openingLine: string;
  backgroundClass: string;
  buttonClass: string;
};

const themeDetails: Record<
  LetterType,
  ThemeDetails
> = {
  LOVED: {
    label: "Sealed with love",
    openingLine:
      "My heart has been holding these words for you.",
    backgroundClass:
      "bg-[radial-gradient(circle_at_top,#fff4f3_0%,#f6e0e3_45%,#edcfd5_100%)] text-[#4b2731]",
    buttonClass:
      "bg-gradient-to-r from-[#8f4354] to-[#b85f72] text-white shadow-[0_20px_55px_rgba(159,79,96,0.35)]",
  },
  FRIEND: {
    label: "A note from your person",
    openingLine:
      "Good stories are better when they are shared.",
    backgroundClass:
      "bg-[#e7f1f5] text-[#203d4c]",
    buttonClass:
      "bg-[#527e98] text-white shadow-[0_18px_50px_rgba(82,126,152,0.25)]",
  },
  FAMILY: {
    label: "A letter made of home",
    openingLine:
      "The words we keep become part of our story.",
    backgroundClass:
      "bg-[#e9eee2] text-[#314132]",
    buttonClass:
      "bg-[#637d64] text-white shadow-[0_18px_50px_rgba(99,125,100,0.25)]",
  },
};

function ThemeIcon({
  type,
  className,
}: {
  type: LetterType;
  className?: string;
}) {
  switch (type) {
    case "LOVED":
      return (
        <Heart
          aria-hidden="true"
          className={className}
        />
      );

    case "FRIEND":
      return (
        <Users
          aria-hidden="true"
          className={className}
        />
      );

    case "FAMILY":
      return (
        <House
          aria-hidden="true"
          className={className}
        />
      );
  }
}

function ThemeDecorations({
  type,
}: {
  type: LetterType;
}) {
  switch (type) {
    case "LOVED":
      return (
        <>
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#e7aab4]/30 blur-3xl" />
          <div className="absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-[#fff8f4]/55 blur-3xl" />

          <Heart className="absolute left-[8%] top-[20%] h-5 w-5 rotate-[-15deg] fill-[#a85161] text-[#a85161] opacity-20" />
          <Heart className="absolute bottom-[17%] right-[11%] h-8 w-8 rotate-12 fill-[#a85161] text-[#a85161] opacity-15" />
        </>
      );

    case "FRIEND":
      return (
        <>
          <div className="absolute -left-20 top-[17%] h-32 w-32 rotate-12 rounded-[2rem] bg-[#ef9a72]/25" />
          <div className="absolute -right-14 bottom-[12%] h-40 w-40 -rotate-12 rounded-full border-[28px] border-[#527e98]/15" />
          <div className="absolute right-[16%] top-[18%] h-7 w-7 rotate-45 bg-[#f1c95f]/55" />
          <div className="absolute bottom-[22%] left-[13%] h-5 w-16 rotate-[-8deg] rounded-full bg-[#ef9a72]/45" />
        </>
      );

    case "FAMILY":
      return (
        <>
          <div className="absolute -left-32 -top-24 h-96 w-96 rounded-full border-[55px] border-[#81957a]/10" />
          <div className="absolute -bottom-32 -right-28 h-[28rem] w-[28rem] rounded-full bg-[#fffaf0]/55 blur-3xl" />
          <div className="absolute left-[10%] top-[28%] h-16 w-10 rotate-[-25deg] rounded-[100%_0_100%_0] bg-[#81957a]/16" />
          <div className="absolute bottom-[18%] right-[12%] h-20 w-12 rotate-[22deg] rounded-[100%_0_100%_0] bg-[#bd8e5c]/15" />
        </>
      );
  }
}

export function ReceiverExperience({
  letter,
  attachments,
  previewMode = false,
}: ReceiverExperienceProps) {
  const [opened, setOpened] = useState(false);
  const reduceMotion = useReducedMotion();
  const theme = themeDetails[letter.type];

  const readyAttachments = attachments.filter(
    (attachment) =>
      attachment.status === "READY",
  );

  const getContentUrl = (
    attachment: LetterAttachment,
  ) =>
    getApiUrl(
      `/letters/${letter.id}/attachments/${attachment.id}/content`,
    );

  return (
    <div
      className={`relative min-h-svh overflow-hidden ${theme.backgroundClass}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
      >
        <ThemeDecorations type={letter.type} />
      </div>

      {previewMode && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 border-b border-black/10 bg-white/65 px-4 py-3 text-[#2b2528] backdrop-blur-2xl sm:px-6">
          <Link
            href="/write"
            className="inline-flex items-center gap-2 text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to editor
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full bg-black/[0.055] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]">
            <Eye className="h-3.5 w-3.5" />
            Private preview
          </span>
        </div>
      )}

      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {!opened ? (
          <motion.main
            key="closed-letter"
            initial={{
              opacity: 0,
              scale: reduceMotion ? 1 : 0.97,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : -20,
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`relative z-10 grid min-h-svh place-items-center px-6 py-24 ${
              previewMode ? "pt-32" : ""
            }`}
          >
            <section className="w-full max-w-2xl text-center">
              <motion.div
                initial={{
                  opacity: 0,
                  y: reduceMotion ? 0 : 16,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: reduceMotion ? 0 : 0.15,
                  duration: reduceMotion ? 0 : 0.55,
                }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-current/15 bg-white/45 shadow-xl backdrop-blur-xl"
              >
                <ThemeIcon
                  type={letter.type}
                  className="h-8 w-8"
                />
              </motion.div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em] opacity-55">
                {theme.label}
              </p>

              <h1 className="mt-5 font-display text-5xl font-bold tracking-[-0.045em] sm:text-7xl">
                For {letter.recipientName}
              </h1>

              <p className="mx-auto mt-5 max-w-lg text-base leading-8 opacity-65 sm:text-lg">
                {theme.openingLine}
              </p>

              <button
                type="button"
                onClick={() => setOpened(true)}
                className={`mt-9 inline-flex min-h-14 items-center justify-center gap-3 rounded-full px-7 text-sm font-bold transition duration-300 hover:-translate-y-1 ${theme.buttonClass}`}
              >
                <ThemeIcon
                  type={letter.type}
                  className="h-4 w-4"
                />

                Open your letter
              </button>
            </section>
          </motion.main>
        ) : (
          <motion.main
            key="opened-letter"
            initial={{
              opacity: 0,
              y: reduceMotion ? 0 : 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`relative z-10 min-h-svh w-full px-5 pb-20 ${
              previewMode ? "pt-28" : "pt-12"
            }`}
          >
            <ReceiverLetterView
              letter={letter}
              attachments={readyAttachments}
              getContentUrl={getContentUrl}
            />

            <button
              type="button"
              onClick={() => setOpened(false)}
              className="mx-auto mt-8 flex items-center gap-2 rounded-full border border-current/15 bg-white/40 px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-xl transition hover:bg-white/65"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Replay opening
            </button>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}