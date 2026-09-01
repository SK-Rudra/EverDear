import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EverDear — Words worth keeping.",
    template: "%s | EverDear",
  },
  description:
    "Create beautiful digital letters filled with meaningful words, photographs, and memories.",
  applicationName: "EverDear",
};

export const viewport: Viewport = {
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#17151a",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#f7f0e8",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}