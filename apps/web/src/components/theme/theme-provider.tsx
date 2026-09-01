"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="warm"
      enableSystem={false}
      enableColorScheme={false}
      storageKey="everdear-theme"
      themes={["warm", "dark"]}
    >
      {children}
    </NextThemeProvider>
  );
}