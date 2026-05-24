import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { DocumentsSection } from "@/components/home/DocumentsSection";
import { SoftwaresSection } from "@/components/home/SoftwaresSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FAQSection } from "@/components/home/FAQSection";
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
      <StatsSection />
      <FeaturedSection />
      <DocumentsSection />
      <HowItWorksSection />
      <SoftwaresSection />
      <FAQSection />
    </>
  );
}

