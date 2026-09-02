import type { Metadata } from "next";
import { ModerationGate } from "@/components/moderation/moderation-gate";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Moderation",
  description:
    "EverDear staff moderation dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ModerationPage() {
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
          <div className="absolute -left-40 top-10 h-[32rem] w-[32rem] rounded-full bg-sage/10 blur-[120px]" />
          <div className="absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-rose/8 blur-[120px]" />
        </div>

        <div className="relative z-10">
          <ModerationGate />
        </div>
      </main>
    </>
  );
}