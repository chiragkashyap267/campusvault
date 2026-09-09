import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import Script from "next/script";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

/**
 * One family for the whole site.
 *
 * Inter is a neutral grotesque built on the same skeleton as Helvetica — which
 * is what the reference wordmark is set in — and unlike the Space Grotesk it
 * replaces it is not quirky, so it disappears into the page instead of
 * announcing itself.
 *
 * No `weight` array on purpose: that loads the variable font, giving every
 * weight from 100 to 900 in a single file. Space Grotesk only shipped 300-700,
 * so `font-black` silently rendered at 700 and there was no light or thin at
 * all — the reason headings never looked as heavy as intended.
 */
const appFont = Inter({
  subsets: ["latin"],
  variable: "--font-app",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Academic Resource Hub`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "GBPIET",
    "Govind Ballabh Pant",
    "MCA",
    "B.Tech",
    "study material",
    "PYQ papers",
    "notes",
    "GBPIET resources",
  ],
  authors: [{ name: "Chirag Kashyap" }],
  creator: "Chirag Kashyap",
  manifest: "/manifest.json",
  icons: {
    icon: "/chirag.png",
    apple: "/chirag.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: `${SITE_NAME} — Academic Resource Hub`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={appFont.variable}
      suppressHydrationWarning
    >
      <body className="bg-background text-text-primary antialiased overflow-x-hidden">
        <SmoothScroll>
          <Providers>{children}</Providers>
        </SmoothScroll>

        {/* Google Analytics Loader */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
