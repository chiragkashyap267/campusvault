import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NewsletterPopup } from "@/components/shared/NewsletterPopup";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28">{children}</main>
      <Footer />
      <NewsletterPopup />
    </div>
  );
}
