import type { Metadata } from "next";
import { LetterStudio } from "@/components/letters/letter-studio";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Write a letter",
  description:
    "Create a private EverDear letter for someone who matters.",
};

export default function WriteLetterPage() {
  return (
    <>
      <SiteHeader />

      <main
        id="main-content"
        className="relative min-h-[calc(100svh-90px)] overflow-hidden border-t border-line"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -left-40 top-10 h-[30rem] w-[30rem] rounded-full bg-rose/10 blur-[110px]" />
          <div className="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-sage/10 blur-[110px]" />
        </div>

        <div className="relative z-10">
          <LetterStudio />
        </div>
      </main>
    </>
  );
}