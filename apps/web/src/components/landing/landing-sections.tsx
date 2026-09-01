"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ImagePlus, PenLine, Send } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

type LetterStyleKey = "loved" | "friend" | "family";

type LetterStyle = {
  label: string;
  selectedLabel: string;
  symbol: string;
  title: string;
  description: string;
  cardClass: string;
  accent: string;
  softAccent: string;
};

function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: reduceMotion ? 0 : 28,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.16,
      }}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const letterStyleOrder: LetterStyleKey[] = [
  "loved",
  "friend",
  "family",
];

const letterStyles: Record<LetterStyleKey, LetterStyle> = {
  loved: {
    label: "Loved ones",
    selectedLabel: "Loved ones — soft and intimate",
    symbol: "♡",
    title: "For the one",
    description:
      "Soft rose, intimate details, and a cinematic reveal for words held close to the heart.",
    cardClass:
      "bg-[linear-gradient(145deg,#f7dfe3_0%,#edb8c1_100%)]",
    accent: "#c86b7a",
    softAccent: "rgba(200, 107, 122, 0.13)",
  },
  friend: {
    label: "Friends",
    selectedLabel: "Friends — bright and playful",
    symbol: "✦",
    title: "For your people",
    description:
      "Playful blue, bright moments, and a little energy for the friends who make life lighter.",
    cardClass:
      "bg-[linear-gradient(145deg,#dce8f2_0%,#b9cde0_100%)]",
    accent: "#6c89a8",
    softAccent: "rgba(108, 137, 168, 0.13)",
  },
  family: {
    label: "Family",
    selectedLabel: "Family — warm and timeless",
    symbol: "⌂",
    title: "For home",
    description:
      "Calm sage, familiar warmth, and a timeless keepsake for the people who feel like home.",
    cardClass:
      "bg-[linear-gradient(145deg,#e3ebe0_0%,#bdceb9_100%)]",
    accent: "#78947b",
    softAccent: "rgba(120, 148, 123, 0.14)",
  },
};

const steps = [
  {
    number: "01",
    title: "Choose their world",
    description:
      "Pick a visual style for a loved one, a friend, or family. The complete reading experience adapts with it.",
    icon: PenLine,
  },
  {
    number: "02",
    title: "Tell the whole story",
    description:
      "Write freely, then add a photograph and a short video when your words need a little company.",
    icon: ImagePlus,
  },
  {
    number: "03",
    title: "Send one private link",
    description:
      "EverDear wraps everything into a distraction-free page the receiver can open on any device.",
    icon: Send,
  },
];

export function LandingSections() {
  const [selectedKey, setSelectedKey] =
    useState<LetterStyleKey>("loved");

  const reduceMotion = useReducedMotion();
  const selectedStyle = letterStyles[selectedKey];

  return (
    <>
      <section
        id="letters"
        className="relative overflow-hidden bg-paper py-24 text-paper-ink sm:py-32"
      >
        <div
          aria-hidden="true"
          className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-rose/15 blur-[110px]"
        />

        <div
          aria-hidden="true"
          className="absolute -right-48 bottom-10 h-[28rem] w-[28rem] rounded-full bg-[#6c89a8]/10 blur-[120px]"
        />

        <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10">
          <Reveal className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-deep">
                Choose the feeling
              </p>

              <h2 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[0.94] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                A different atmosphere for every kind of bond.
              </h2>
            </div>

            <p className="max-w-xl text-base leading-8 text-paper-ink/60 lg:justify-self-end">
              The words remain yours. EverDear changes the colour,
              typography, and opening experience to fit who the letter is
              for.
            </p>
          </Reveal>

          <div
            className="mt-14 grid gap-5 lg:grid-cols-3"
            role="group"
            aria-label="Select a letter style"
          >
            {letterStyleOrder.map((key, index) => {
              const style = letterStyles[key];
              const selected = selectedKey === key;

              return (
                <Reveal key={key} delay={index * 0.08}>
                  <motion.button
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    aria-pressed={selected}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : {
                            y: -8,
                          }
                    }
                    whileTap={
                      reduceMotion
                        ? undefined
                        : {
                            scale: 0.99,
                          }
                    }
                    className={`group relative min-h-[440px] w-full overflow-hidden rounded-[2rem] border p-7 text-left text-paper-ink transition-[border-color,box-shadow] duration-300 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#6c89a8]/40 sm:p-8 ${
                      selected
                        ? "border-paper-ink/25 shadow-[0_30px_75px_rgba(62,44,51,0.18)]"
                        : "border-paper-ink/10 shadow-[0_20px_55px_rgba(62,44,51,0.1)]"
                    } ${style.cardClass}`}
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[0.67rem] font-bold uppercase tracking-[0.18em] text-paper-ink/55">
                        0{index + 1} · {style.label}
                      </span>

                      <span className="grid h-8 w-8 place-items-center rounded-full border border-paper-ink/25">
                        <motion.span
                          animate={{
                            scale: selected ? 1 : 0,
                          }}
                          transition={{
                            duration: 0.2,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="h-3.5 w-3.5 rounded-full bg-paper-ink"
                        />
                      </span>
                    </div>

                    <motion.div
                      animate={{
                        rotate: selected ? -5 : 0,
                        scale: selected ? 1.07 : 1,
                      }}
                      transition={{
                        duration: 0.45,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="relative z-10 grid h-48 place-items-center font-display text-8xl font-medium text-paper-ink/80"
                      aria-hidden="true"
                    >
                      {style.symbol}
                    </motion.div>

                    <div className="relative z-10">
                      <h3 className="font-display text-4xl font-semibold tracking-[-0.035em]">
                        {style.title}
                      </h3>

                      <p className="mt-3 max-w-sm text-sm leading-7 text-paper-ink/65">
                        {style.description}
                      </p>
                    </div>

                    <div
                      aria-hidden="true"
                      className="absolute -bottom-28 -right-8 h-64 w-56 rotate-[-8deg] rounded-2xl border border-white/35 bg-white/25 p-6 transition duration-500 group-hover:-translate-y-3 group-hover:rotate-[-4deg]"
                    >
                      <div className="h-1.5 w-20 rounded-full bg-paper-ink/10" />

                      <div className="mt-7 space-y-3">
                        <div className="h-1.5 w-full rounded-full bg-paper-ink/10" />
                        <div className="h-1.5 w-[82%] rounded-full bg-paper-ink/10" />
                        <div className="h-1.5 w-[92%] rounded-full bg-paper-ink/10" />
                      </div>
                    </div>

                    <div
                      aria-hidden="true"
                      className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full border border-white/45 shadow-[0_0_0_38px_rgba(255,255,255,0.07),0_0_0_76px_rgba(255,255,255,0.04)] transition-transform duration-700 group-hover:scale-110"
                    />
                  </motion.button>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.12}>
            <div
              className="mt-6 flex flex-col gap-5 rounded-[1.5rem] border border-paper-ink/10 p-5 transition-colors duration-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              style={{
                backgroundColor: selectedStyle.softAccent,
              }}
            >
              <motion.div
                key={selectedKey}
                initial={{
                  opacity: 0,
                  x: reduceMotion ? 0 : -8,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.3,
                }}
              >
                <p className="text-xs font-medium text-paper-ink/55">
                  Selected experience
                </p>

                <p className="mt-1 font-display text-2xl font-semibold">
                  {selectedStyle.selectedLabel}
                </p>
              </motion.div>

              <Link
                href={`/create?type=${selectedKey}`}
                className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 text-sm font-bold text-white shadow-lg transition duration-300 hover:-translate-y-0.5"
                style={{
                  backgroundColor: selectedStyle.accent,
                }}
              >
                Continue with this style
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative border-y border-paper-ink/10 bg-[#eee6dc] py-24 text-paper-ink sm:py-32"
      >
        <div className="mx-auto grid max-w-[1280px] gap-14 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24 lg:px-10">
          <Reveal>
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-deep">
                From heart to link
              </p>

              <h2 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[0.94] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Made slowly. Shared simply.
              </h2>

              <p className="mt-6 max-w-lg text-base leading-8 text-paper-ink/60">
                Everything meaningful, without turning a personal moment
                into a complicated project.
              </p>

              <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-paper-ink/10 bg-white/35 px-4 py-2.5 text-xs font-semibold text-paper-ink/60">
                <span className="h-2 w-2 rounded-full bg-sage" />
                No design skills required
              </div>
            </div>
          </Reveal>

          <div>
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <Reveal key={step.number} delay={index * 0.08}>
                  <article className="grid min-h-56 grid-cols-[3.5rem_1fr] gap-5 border-b border-paper-ink/10 py-9 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[4.5rem_1fr] sm:gap-7">
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-paper-ink/15 bg-paper text-[0.65rem] font-bold tracking-[0.08em] shadow-sm sm:h-14 sm:w-14">
                      {step.number}
                    </span>

                    <div>
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-paper-ink text-paper">
                        <Icon
                          aria-hidden="true"
                          className="h-4.5 w-4.5"
                        />
                      </span>

                      <h3 className="mt-6 font-display text-4xl font-semibold tracking-[-0.03em]">
                        {step.title}
                      </h3>

                      <p className="mt-4 max-w-xl text-sm leading-7 text-paper-ink/60 sm:text-base">
                        {step.description}
                      </p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}