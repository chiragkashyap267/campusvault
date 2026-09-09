"use client";

import Link from "next/link";
import { BookOpen, Globe, Link2, Heart, ExternalLink } from "lucide-react";
import { CREATOR_LINKS, CREATOR_NAME, NAV_LINKS, SITE_NAME } from "@/lib/constants";

/**
 * Only links that actually go somewhere.
 *
 * "Notes Editor" (/notes) and "Todo Tracker" (/todo) were listed here but
 * neither route exists — both were plain 404s. "B.Tech CSE" filtered on
 * branch=cse, which is not one of the branch values resources are stored
 * under, so it always returned an empty library.
 */
const FOOTER_LINKS = {
  Platform: [
    { label: "Resources", href: "/resources" },
    { label: "Upload", href: "/upload" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Forms", href: "/forms" },
  ],
  Institution: [
    { label: "About GBPIET", href: "/about" },
    { label: "MCA", href: "/resources?branch=mca" },
    { label: "BCA", href: "/resources?branch=bca" },
    { label: "B.Tech", href: "/resources?branch=btech" },
    { label: "Contact", href: "/contact" },
  ],
  Resources: [
    { label: "PYQ Papers", href: "/resources?type=pyq" },
    { label: "Notes", href: "/resources?type=notes" },
    { label: "Lab Manuals", href: "/resources?type=lab_manual" },
    { label: "Study Material", href: "/resources?type=study_material" },
  ],
};

const SOCIAL_LINKS = [
  { label: "GitHub", href: CREATOR_LINKS.github, icon: <Globe className="w-4 h-4" /> },
  { label: "LinkedIn", href: CREATOR_LINKS.linkedin, icon: <Link2 className="w-4 h-4" /> },
  { label: "Portfolio", href: CREATOR_LINKS.portfolio, icon: <ExternalLink className="w-4 h-4" /> },
];

export function Footer() {
  return (
    <footer className="relative bg-[#030712] border-t border-white/5">
      {/* No top margin here on purpose: the footer's own padding provides the
          separation. mt-12 stacked on pt-16 put 112px of dead space above the
          first line of footer text. */}

      <div className="container-app py-12 md:py-14">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-6 mb-10">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-black" />
              </div>
              <span className="font-display font-bold text-white">
                CampusVault <span className="text-cyan-400">GBPIET</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
              The ultimate academic resource hub for GBPIET students. Share, discover, and
              collaborate on study materials, PYQs, and more.
            </p>

            {/* Creator Card */}
            <div className="glass-card p-4 rounded-xl max-w-xs">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Created by</p>
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src="/chirag.png" 
                  alt={CREATOR_NAME}
                  className="w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{CREATOR_NAME}</p>
                  <p className="text-xs text-slate-400">MCA Student, GBPIET</p>
                </div>
              </div>
              <div className="flex gap-2">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-4">
                {section}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            Made with{" "}
            <span>
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
            </span>{" "}
            by{" "}
            <span className="text-cyan-400 font-medium">{CREATOR_NAME}</span>
          </p>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <Link href="/about" className="hover:text-slate-400 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-slate-400 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
