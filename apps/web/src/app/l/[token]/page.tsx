import type { Metadata } from "next";
import { PublicLetter } from "@/components/receiver/public-letter";

export const metadata: Metadata = {
  title: "A private letter for you",
  description:
    "A private letter shared through EverDear.",
  referrer: "no-referrer",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

type PublicLetterPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function PublicLetterPage({
  params,
}: PublicLetterPageProps) {
  const { token } = await params;

  return <PublicLetter token={token} />;
}