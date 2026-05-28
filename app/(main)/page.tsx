import { HeroSection } from "@/components/home/HeroSection";
import { NewsTicker } from "@/components/home/NewsTicker";
import { StatsSection } from "@/components/home/StatsSection";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { LeaderboardPreviewSection } from "@/components/home/LeaderboardPreviewSection";
import { DocumentsSection } from "@/components/home/DocumentsSection";
import { SoftwaresSection } from "@/components/home/SoftwaresSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FAQSection } from "@/components/home/FAQSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Academic Resource Hub`,
  description: SITE_DESCRIPTION,
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <NewsTicker />
      <StatsSection />
      <FeaturedSection />
      <LeaderboardPreviewSection />
      <DocumentsSection />
      <HowItWorksSection />
      <NewsletterSection />
      <SoftwaresSection />
      <FAQSection />
    </>
  );
}
