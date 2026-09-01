"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Film,
  Heart,
  Link2,
  Quote,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
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

const memoryFeatures = [
  {
    title: "Your words",
    description: "Write naturally on a beautiful, distraction-free page.",
    icon: Heart,
  },
  {
    title: "A photograph",
    description: "Place a favourite memory beside the moment it belongs to.",
    icon: Camera,
  },
  {
    title: "A short video",
    description: "Let them hear the laugh or see the moment again.",
    icon: Film,
  },
  {
    title: "One private link",
    description: "Send the complete experience without a registration wall.",
    icon: Link2,
  },
];

const wallMessages = [
  {
    message:
      "I hope you know how much your quiet kindness has changed the people around you.",
    time: "A moment ago",
    rotation: "md:-rotate-2",
    surface: "bg-[#fff8ef]",
  },
  {
    message:
      "To whoever reads this: you are doing better than you think.",
    time: "Today",
    rotation: "md:translate-y-10 md:rotate-1",
    surface: "bg-[#f3e5e9]",
  },
  {
    message:
      "Somewhere, someone is grateful that you stayed.",
    time: "Today",
    rotation: "md:-rotate-1",
    surface: "bg-[#edf2e9]",
  },
];

export function LandingClosing() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <section className="relative overflow-hidden bg-surface py-24 sm:py-32">
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-line to-transparent"
        />

        <div
          aria-hidden="true"
          className="absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-rose-deep/10 blur-[120px]"
        />

        <div className="relative mx-auto grid max-w-[1280px] gap-16 px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-10">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose">
              More than a letter
            </p>

            <h2 className="mt-5 max-w-xl font-display text-5xl font-medium leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              Let the memories live beside the words.
            </h2>

            <p className="mt-7 max-w-xl text-base leading-8 text-muted sm:text-lg">
              EverDear combines writing, photographs, and video into one
              gentle story. Everything appears in the right moment instead of
              feeling like a collection of separate attachments.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {memoryFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div key={feature.title} className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line bg-white/[0.04] text-rose">
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </span>

                    <div>
                      <h3 className="text-sm font-semibold">
                        {feature.title}
                      </h3>

                      <p className="mt-1 text-xs leading-6 text-muted">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative mx-auto min-h-[620px] w-full max-w-[650px]">
              <div
                aria-hidden="true"
                className="absolute inset-[7%] rounded-full border border-line"
              />

              <div
                aria-hidden="true"
                className="absolute inset-[16%] rounded-full border border-soft-line"
              />

              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        y: [0, -8, 0],
                        rotate: [-4, -3, -4],
                      }
                }
                transition={{
                  duration: 7,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="absolute left-[2%] top-[4%] w-[58%] rotate-[-4deg] rounded-[2rem] bg-paper p-3 shadow-[0_35px_90px_rgba(0,0,0,0.35)] sm:left-[8%]"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-[linear-gradient(145deg,#e7bdc6_0%,#9e5d70_44%,#332831_100%)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.42),transparent_34%)]" />

                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="font-display text-3xl font-semibold text-white">
                      That summer evening
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/65">
                      The one we still talk about.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 pb-2 pt-4 text-paper-ink">
                  <span className="font-display text-xl font-semibold">
                    A favourite memory
                  </span>

                  <Camera
                    aria-hidden="true"
                    className="h-4 w-4 text-rose-deep"
                  />
                </div>
              </motion.div>

              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        y: [0, 9, 0],
                        rotate: [3, 2, 3],
                      }
                }
                transition={{
                  duration: 6.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="absolute bottom-[3%] right-[1%] z-10 w-[63%] rotate-3 overflow-hidden rounded-[2rem] border border-white/10 bg-[#27222b] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:right-[5%]"
              >
                <div className="relative aspect-video overflow-hidden rounded-[1.4rem] bg-[linear-gradient(135deg,#7e8d7c_0%,#425047_46%,#171b19_100%)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(255,255,255,0.22),transparent_34%)]" />

                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-md">
                      <Film aria-hidden="true" className="h-6 w-6" />
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 rounded-full bg-black/30 px-3 py-1.5 text-[0.65rem] text-white backdrop-blur-md">
                    00:24
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 pb-2 pt-4">
                  <div>
                    <p className="text-sm font-semibold">One little moment</p>
                    <p className="mt-1 text-xs text-muted">
                      Press play when you are ready.
                    </p>
                  </div>

                  <Heart
                    aria-hidden="true"
                    className="h-4 w-4 fill-rose text-rose"
                  />
                </div>
              </motion.div>

              <div className="absolute right-[3%] top-[8%] z-20 max-w-52 rounded-2xl border border-line bg-background/85 p-4 shadow-2xl backdrop-blur-xl sm:right-[9%]">
                <Quote
                  aria-hidden="true"
                  className="h-5 w-5 fill-rose/20 text-rose"
                />

                <p className="mt-3 font-display text-xl leading-6">
                  “Keep this one close.”
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        id="wall"
        className="relative overflow-hidden bg-paper py-24 text-paper-ink sm:py-32"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(37,34,40,0.15)_1px,transparent_1px)] [background-size:24px_24px]"
        />

        <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10">
          <Reveal className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-deep">
                The Wall
              </p>

              <h2 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
                Leave something kind for someone you may never meet.
              </h2>
            </div>

            <Link
              href="/wall"
              className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-paper-ink px-6 font-semibold text-paper transition duration-300 hover:-translate-y-0.5"
            >
              Explore The Wall
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </Reveal>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {wallMessages.map((item, index) => (
              <Reveal key={item.message} delay={index * 0.08}>
                <motion.article
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          y: [0, index % 2 === 0 ? -5 : 5, 0],
                        }
                  }
                  transition={{
                    duration: 6 + index,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className={`relative min-h-72 rounded-[1.8rem] border border-black/10 p-7 shadow-[0_24px_60px_rgba(54,40,44,0.1)] sm:p-8 ${item.rotation} ${item.surface}`}
                >
                  <Quote
                    aria-hidden="true"
                    className="h-7 w-7 fill-rose-deep/10 text-rose-deep"
                  />

                  <p className="mt-8 font-display text-3xl font-semibold leading-[1.12]">
                    {item.message}
                  </p>

                  <div className="absolute bottom-7 left-7 right-7 flex items-center justify-between border-t border-black/10 pt-4 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-black/40 sm:left-8 sm:right-8">
                    <span>Anonymous</span>
                    <span>{item.time}</span>
                  </div>
                </motion.article>
              </Reveal>
            ))}
          </div>

          <Reveal
            delay={0.12}
            className="mt-16 flex flex-col gap-5 rounded-[2rem] border border-black/10 bg-white/45 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage/20 text-[#536c5a]">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              </span>

              <div>
                <h3 className="font-display text-2xl font-semibold">
                  Kindness, with thoughtful safeguards.
                </h3>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-paper-ink/55">
                  Public notes are moderated, rate-limited, and never connected
                  to your private letters.
                </p>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#536c5a]">
              <span className="h-2 w-2 rounded-full bg-sage" />
              Moderated space
            </span>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-background py-24 sm:py-32">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-deep/15 blur-[130px]"
        />

        <div
          aria-hidden="true"
          className="absolute left-[8%] top-[18%] h-2 w-2 rounded-full bg-rose shadow-[0_0_24px_var(--rose)]"
        />

        <div
          aria-hidden="true"
          className="absolute bottom-[20%] right-[9%] h-2 w-2 rounded-full bg-amber shadow-[0_0_24px_var(--amber)]"
        />

        <Reveal className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-rose/30 bg-rose/10 text-rose">
            <Sparkles aria-hidden="true" className="h-6 w-6" />
          </span>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-rose">
            Words worth keeping
          </p>

          <h2 className="mt-5 font-display text-5xl font-medium leading-[0.92] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
            Give someone a moment they can open again.
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            It begins with a few honest words. EverDear takes care of
            everything around them.
          </p>

          <motion.div
            whileHover={reduceMotion ? undefined : { y: -3 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="mt-10 inline-block"
          >
            <Link
              href="/create"
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-paper px-8 font-semibold text-paper-ink shadow-[0_24px_70px_rgba(0,0,0,0.32)]"
            >
              Write your first letter
              <ArrowRight
                aria-hidden="true"
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>

          <p className="mt-5 text-xs text-muted">
            Free to begin. Your recipient does not need an account.
          </p>
        </Reveal>
      </section>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-background">
      <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="EverDear home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border border-rose/35 bg-rose/10 font-display text-lg font-semibold text-rose">
              ED
            </span>

            <div>
              <p className="font-display text-xl font-semibold">EverDear</p>
              <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.17em] text-muted">
                Words worth keeping
              </p>
            </div>
          </Link>

          <nav
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted"
            aria-label="Footer navigation"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>

            <Link
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </Link>

            <Link
              href="#letters"
              className="transition-colors hover:text-foreground"
            >
              Letters
            </Link>

            <Link
              href="#wall"
              className="transition-colors hover:text-foreground"
            >
              The Wall
            </Link>
          </nav>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 EverDear. Made for the words that matter.</p>

          <p>Private letters remain private by default.</p>
        </div>
      </div>
    </footer>
  );
}