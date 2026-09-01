import { AnnouncementBar } from "@/components/landing/announcement-bar";
import {
  LandingClosing,
  SiteFooter,
} from "@/components/landing/landing-closing";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingSections } from "@/components/landing/landing-sections";

export default function Home() {
  return (
    <>
      <AnnouncementBar />

      <main id="main-content">
        <LandingHero />
        <LandingSections />
        <LandingClosing />
      </main>

      <SiteFooter />
    </>
  );
}