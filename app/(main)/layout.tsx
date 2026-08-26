import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NewsletterPopup } from "@/components/shared/NewsletterPopup";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Exactly the navbar's height (h-16). It was pt-24/md:pt-28, which
          left 32-48px of dead space under the nav on every single page.
          Sections own their own breathing room via the .section scale. */}
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <NewsletterPopup />
    </div>
  );
}
