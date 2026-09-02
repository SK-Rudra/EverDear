import type { Metadata } from "next";
import { PublicWallExperience } from "@/components/public-wall/public-wall-experience";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "The Wall",
  description:
    "Leave an anonymous message of kindness, honesty, or hope on the EverDear public wall.",
};

export default function PublicWallPage() {
  return (
    <>
      <SiteHeader />

      <main
        id="main-content"
        className="relative min-h-[calc(100svh-90px)] overflow-hidden border-t border-line"
      >
        <PublicWallExperience />
      </main>
    </>
  );
}