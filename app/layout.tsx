import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { RobotAssistant } from "@/components/shared/RobotAssistant";
import Script from "next/script";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
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
  themeColor: "#030712",
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
      className={`${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-[#030712] text-[#f1f5f9] antialiased overflow-x-hidden">
        <SmoothScroll>
          <Providers>{children}</Providers>
          <RobotAssistant />
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
