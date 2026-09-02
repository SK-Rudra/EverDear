"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Heart,
  Image as ImageIcon,
  LockKeyhole,
  Menu,
  Play,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const navigation = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Letters", href: "#letters" },
  { label: "The Wall", href: "/wall" },
];

export function LandingHero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const entranceY = reduceMotion ? 0 : 24;

  return (
    <section className="relative min-h-svh overflow-hidden border-b border-line">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-12 h-[32rem] w-[32rem] rounded-full bg-rose-deep/15 blur-[110px]" />
        <div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-sage/10 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose/40 to-transparent" />
        <div className="absolute left-[9%] top-36 h-2 w-2 rounded-full bg-rose shadow-[0_0_24px_var(--rose)]" />
        <div className="absolute right-[12%] top-28 h-1.5 w-1.5 rounded-full bg-amber shadow-[0_0_20px_var(--amber)]" />
      </div>

      <header className="relative z-50 mx-auto flex min-h-[90px] w-full max-w-[1180px] items-center justify-between px-5">
        <Link
          href="/"
          className="group inline-flex items-center gap-3"
          aria-label="EverDear home"
        >
          <span className="relative grid h-[38px] w-[38px] place-items-center rounded-full bg-foreground text-[0.7rem] font-bold tracking-[0.08em] text-background">
            ED

            <span className="absolute -inset-1 rounded-full border border-foreground/25" />
          </span>

          <span className="font-display text-[1.45rem] font-bold tracking-[-0.03em]">
            EverDear
          </span>
        </Link>

        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label="Primary navigation"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative py-2 text-[0.9rem] font-semibold text-muted transition-colors hover:text-foreground"
            >
              {item.label}

              <span className="absolute inset-x-0 bottom-0 h-px origin-right scale-x-0 bg-foreground transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
            </Link>
          ))}

          <ThemeToggle />

          <Link
            href="/write"
            className="group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-foreground px-5 text-[0.9rem] font-bold text-background shadow-[0_13px_30px_rgba(44,36,48,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(44,36,48,0.26)]"
          >
            Write a letter

            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface/70 text-foreground backdrop-blur-xl lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              id="mobile-navigation"
              initial={{
                opacity: 0,
                y: reduceMotion ? 0 : -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: reduceMotion ? 0 : -10,
              }}
              transition={{
                duration: 0.2,
              }}
              className="absolute left-5 right-5 top-[calc(100%+0.5rem)] rounded-3xl border border-line bg-surface/95 p-4 shadow-2xl backdrop-blur-2xl lg:hidden"
              aria-label="Mobile navigation"
            >
              <div className="flex flex-col">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="my-3 h-px bg-line" />

                <div className="flex items-center justify-between rounded-2xl px-4 py-2">
                  <span className="text-sm text-muted">Appearance</span>
                  <ThemeToggle />
                </div>

                <Link
                  href="/write"
                  onClick={() => setMenuOpen(false)}
                  className="mt-3 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-bold text-background"
                >
                  Write a letter

                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-5rem)] max-w-[1280px] items-center gap-14 px-6 pb-20 pt-12 lg:grid-cols-[1.03fr_0.97fr] lg:px-10 lg:pb-24 lg:pt-10">
        <div className="max-w-3xl text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: entranceY }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-line bg-white/[0.035] px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-muted backdrop-blur-xl"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose shadow-[0_0_16px_var(--rose)]" />
            A quieter way to say what matters
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: entranceY }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.08,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-[690px] font-display text-[clamp(3.6rem,7vw,6.8rem)] font-medium leading-[0.94] tracking-[-0.065em]"
          >
            Some words deserve{" "}
            <span className="text-rose">more</span> than a message.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: entranceY }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.16,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-7 max-w-[580px] text-[clamp(1rem,1.5vw,1.16rem)] leading-[1.6] text-muted"
          >
            Write a beautiful digital letter, add the memories that belong
            with it, and send someone one private link they will want to keep.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: entranceY }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.24,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <motion.div
              whileHover={reduceMotion ? undefined : { y: -3 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              <Link
                href="/write"
                className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-foreground px-7 font-semibold text-background shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition duration-300 hover:shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:w-auto"
              >
                Write your letter

                <ArrowRight
                  aria-hidden="true"
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            <motion.div
              whileHover={reduceMotion ? undefined : { y: -3 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              <Link
                href="#how-it-works"
                className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full border border-line bg-white/[0.035] px-7 font-medium text-foreground backdrop-blur-xl transition-colors hover:bg-foreground/[0.07] sm:w-auto"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-rose/15 text-rose">
                  <Play
                    aria-hidden="true"
                    className="ml-0.5 h-3.5 w-3.5 fill-current"
                  />
                </span>

                See how it works
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.4,
              duration: 0.6,
            }}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[0.78rem] text-muted lg:justify-start"
          >
            <span className="inline-flex items-center gap-2">
              <LockKeyhole
                aria-hidden="true"
                className="h-4 w-4 text-sage"
              />
              Private by default
            </span>

            <span className="hidden h-1 w-1 rounded-full bg-muted/50 sm:block" />

            <span>No account needed to receive</span>
          </motion.div>
        </div>

        <motion.div
          id="preview"
          initial={{
            opacity: 0,
            x: reduceMotion ? 0 : 30,
            scale: reduceMotion ? 1 : 0.96,
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
          }}
          transition={{
            delay: 0.18,
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative mx-auto w-full max-w-[530px]"
        >
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line"
          />

          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-soft-line"
          />

          <motion.div
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -8, 0],
                  }
            }
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="relative min-h-[570px]"
          >
            <div className="absolute inset-x-[5%] bottom-[2%] h-[58%] rotate-[-3deg] rounded-[2rem] border border-line bg-surface-elevated shadow-[0_40px_100px_rgba(0,0,0,0.42)]" />

            <div className="absolute inset-x-[9%] bottom-[5%] h-[54%] rotate-[4deg] rounded-[2rem] border border-rose/15 bg-rose-deep/15" />

            <article className="absolute inset-x-[8%] top-5 z-10 min-h-[500px] rotate-[-1.5deg] overflow-hidden rounded-[1.8rem] bg-paper p-7 text-paper-ink shadow-[0_42px_110px_rgba(0,0,0,0.5)] sm:p-9">
              <div className="flex items-center justify-between border-b border-black/10 pb-4 text-[0.63rem] font-semibold uppercase tracking-[0.22em] text-black/45">
                <span>EverDear</span>
                <span>For someone special</span>
              </div>

              <div className="pt-8">
                <p className="font-display text-4xl font-semibold">
                  Dear you,
                </p>

                <p className="mt-5 font-display text-[1.35rem] leading-8 text-black/70">
                  There are ordinary days, and then there are days made
                  unforgettable simply because you were part of them.
                </p>

                <div className="mt-7 grid grid-cols-[1fr_auto] gap-4 rounded-2xl bg-black/[0.045] p-3">
                  <div className="relative min-h-28 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#d9b0b9_0%,#8f5364_48%,#30242e_100%)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.42),transparent_36%)]" />

                    <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 text-[0.68rem] font-medium text-white backdrop-blur-md">
                      <ImageIcon
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                      A favourite memory
                    </div>
                  </div>

                  <div className="flex w-20 flex-col items-center justify-center rounded-xl border border-black/10 bg-white/40 text-center">
                    <Play
                      aria-hidden="true"
                      className="h-5 w-5 text-rose-deep"
                    />

                    <span className="mt-2 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-black/45">
                      0:24
                    </span>
                  </div>
                </div>

                <p className="mt-7 font-display text-2xl leading-tight">
                  Always,
                  <br />
                  someone who is grateful for you.
                </p>
              </div>

              <div className="absolute bottom-6 right-7 grid h-14 w-14 rotate-6 place-items-center rounded-full bg-rose-deep text-paper shadow-lg ring-4 ring-rose-deep/20">
                <Heart
                  aria-hidden="true"
                  className="h-5 w-5 fill-current"
                />
              </div>
            </article>

            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, 6, 0],
                      rotate: [-5, -3, -5],
                    }
              }
              transition={{
                duration: 5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute -left-1 top-[38%] z-20 rounded-2xl border border-line bg-surface/90 px-4 py-3 shadow-2xl backdrop-blur-xl sm:-left-7"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sage/15 text-sage">
                  <ImageIcon
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                </span>

                <div>
                  <p className="text-xs font-semibold">
                    Add a photograph
                  </p>

                  <p className="mt-0.5 text-[0.65rem] text-muted">
                    Keep the moment close
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, -6, 0],
                      rotate: [4, 2, 4],
                    }
              }
              transition={{
                duration: 5.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute -right-1 bottom-[15%] z-20 rounded-2xl border border-line bg-surface/90 px-4 py-3 shadow-2xl backdrop-blur-xl sm:-right-8"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose/15 text-rose">
                  <LockKeyhole
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                </span>

                <div>
                  <p className="text-xs font-semibold">
                    One private link
                  </p>

                  <p className="mt-0.5 text-[0.65rem] text-muted">
                    Made only for them
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}