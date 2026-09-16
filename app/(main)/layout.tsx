import { Navbar } from "@/components/layout/Navbar";
import { QuickActions } from "@/components/layout/QuickActions";
import { Footer } from "@/components/layout/Footer";
import { NewsletterPopup } from "@/components/shared/NewsletterPopup";
import { ToolsMarquee } from "@/components/layout/ToolsMarquee";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Tools marquee banner — fixed at the very top (z-[60]) */}
      <div className="fixed top-0 left-0 right-0 z-[60]">
        <ToolsMarquee />
      </div>
      {/* Navbar is fixed at top-[28px] (marquee height) — see Navbar.tsx */}
      <Navbar />
      {/* pt = marquee (28px) + navbar (64px) = 92px */}
      <main className="flex-1 pt-[92px]">
        <QuickActions />
        {children}
      </main>
      <Footer />
      <NewsletterPopup />
    </div>
  );
}

