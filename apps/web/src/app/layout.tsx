import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  themeColor: "#f7f3ee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        {children}
        <Analytics />
      </body>
    </html>
  );
}