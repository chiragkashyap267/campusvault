"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Upload } from "lucide-react";

/**
 * The two things anyone comes here to do, one tap from every page.
 *
 * Sits directly under the header. On a phone the navigation is behind a
 * hamburger, so without this both core actions are two taps and a menu away —
 * which is a lot of friction for a site whose whole job is handing over a past
 * paper quickly.
 *
 * Hidden on the pages they lead to, so neither ever points at itself.
 */
export function QuickActions() {
  const pathname = usePathname();

  const onResources = pathname === "/resources";
  const onUpload = pathname === "/upload";
  if (onResources && onUpload) return null;

  return (
    <div className="border-b border-white/[0.06] bg-[#070d1a]">
      <div className="container-app py-3 sm:py-3.5">
        {/* Phone: side by side and equal width, so neither is a stray
            full-width block when the other is hidden.
            Desktop: centred. Left-aligned they sat under the logo and read as
            a layout mistake rather than a deliberate action bar — the header
            above and the hero below are both balanced across the full width. */}
        <div className="flex items-stretch justify-center gap-2.5 sm:gap-3">
          {!onResources && (
            <Link
              href="/resources"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 btn-primary px-4 sm:px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              Download Papers
            </Link>
          )}
          {!onUpload && (
            <Link
              href="/upload"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 btn-ghost px-4 sm:px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap"
            >
              <Upload className="w-4 h-4 shrink-0" />
              Upload Papers
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
