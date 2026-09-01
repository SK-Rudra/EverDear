"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};

export function ThemeToggle() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="h-10 w-[9.25rem] rounded-full border border-line bg-surface/70"
      />
    );
  }

  const darkMode = theme === "dark";

  return (
    <div
      className="inline-flex rounded-full border border-line bg-surface/70 p-1 backdrop-blur-xl"
      role="group"
      aria-label="Choose website appearance"
    >
      <button
        type="button"
        onClick={() => setTheme("warm")}
        aria-pressed={!darkMode}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
          !darkMode
            ? "bg-foreground text-background shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
      >
        <Sun aria-hidden="true" className="h-3.5 w-3.5" />
        Warm
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={darkMode}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
          darkMode
            ? "bg-foreground text-background shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
      >
        <Moon aria-hidden="true" className="h-3.5 w-3.5" />
        Dark
      </button>
    </div>
  );
}