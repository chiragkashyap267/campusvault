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
      <div className="container-app py-2.5">
        <div className="flex items-stretch gap-2">
          {!onResources && (
            <Link
              href="/resources"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              <Download className="w-4 h-4 shrink-0" />
              Download Papers
            </Link>
          )}
          {!onUpload && (
            <Link
              href="/upload"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 btn-ghost px-5 py-2.5 rounded-xl text-sm font-semibold"
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
