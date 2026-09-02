"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

const navigation = [
  {
    label: "How it works",
    href: "/#how-it-works",
  },
  {
    label: "Letters",
    href: "/#letters",
  },
  {
    label: "The Wall",
    href: "/wall",
  },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
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
        onClick={() =>
          setMenuOpen((current) => !current)
        }
        className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface/70 text-foreground backdrop-blur-xl lg:hidden"
        aria-label={
          menuOpen ? "Close menu" : "Open menu"
        }
        aria-expanded={menuOpen}
        aria-controls="mobile-site-navigation"
      >
        {menuOpen ? (
          <X
            aria-hidden="true"
            className="h-5 w-5"
          />
        ) : (
          <Menu
            aria-hidden="true"
            className="h-5 w-5"
          />
        )}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-site-navigation"
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
  );
}