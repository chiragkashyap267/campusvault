import Link from "next/link";
import { MessageSquare, HelpCircle, FileText, Upload, Shield, Sparkles, Bell, Zap } from "lucide-react";

/* Every headline used to open with an emoji as well as carrying a lucide icon,
   so each one rendered two symbols side by side — 📄 next to a document glyph,
   🛡️ next to a shield. The icon stays because it is the one that takes the
   accent colour; the emoji is gone. */
const NEWS_ITEMS = [
  { icon: MessageSquare, text: "Comments are live — share your thoughts on any resource!", href: "/resources", color: "text-brand" },
  { icon: HelpCircle, text: "Ask a question — drop your doubt on any note or PYQ page.", href: "/resources", color: "text-blue-600" },
  { icon: FileText, text: "New PYQs uploaded — End-Sem 2024 papers now available!", href: "/resources?type=pyq", color: "text-emerald-600" },
  { icon: Upload, text: "Upload your CT papers — help your juniors score better.", href: "/upload", color: "text-purple-600" },
  { icon: Shield, text: "Want to be an Admin? Reach out to the CampusVault team.", href: "/contact", color: "text-amber-600" },
  { icon: Sparkles, text: "New Notes section is here — find handwritten notes by toppers!", href: "/resources?type=notes", color: "text-pink-600" },
  { icon: Bell, text: "Newsletter is LIVE — get study alerts delivered to your inbox.", href: "/#newsletter", color: "text-orange-600" },
  { icon: FileText, text: "Lab Manuals added — all branches now covered. Check it out!", href: "/resources?type=lab_manual", color: "text-teal-600" },
  { icon: Zap, text: "500+ resources — search and download instantly, no login needed.", href: "/resources", color: "text-brand" },
  { icon: Upload, text: "Upload & earn your rank — top contributors featured on Leaderboard!", href: "/leaderboard", color: "text-blue-600" },
];

const TICKER_ITEMS = [...NEWS_ITEMS, ...NEWS_ITEMS];

/**
 * Scrolling announcements bar.
 *
 * The marquee is a pure CSS animation, deliberately.
 *
 * The previous version ran a requestAnimationFrame loop that read
 * `track.scrollWidth` and wrote `track.style.transform` on every frame. Reading
 * scrollWidth forces the browser to flush layout synchronously, so that loop
 * triggered a full layout recalculation sixty times a second, for the entire
 * life of the page, whether or not the ticker was even on screen.
 *
 * A keyframe animation on `transform` is handed to the compositor instead: it
 * costs the main thread nothing, keeps running while JavaScript is busy, and
 * pauses on hover with a single CSS property.
 *
 * The track renders the item list twice, so translating by exactly -50% lands
 * on a seamless loop point without measuring anything.
 */
export function NewsTicker() {
  return (
    /* Pale blue, not the near-black it kept after the palette change: the
       gradient stops were written as `from-[#060b18]` and a sweep that
       rewrote `bg-[#...]` did not touch colours spelled that way. The dark
       band was left with ink-coloured headlines on it, which is why the text
       was unreadable. */
    <div className="ticker relative w-full overflow-hidden border-y border-line bg-surface-2">
      {/* Left cap: an opaque block behind the LIVE badge, then a fade.
          The badge used to sit on a translucent background over a fade that
          had already gone transparent by the time it reached it, so the
          scrolling headlines showed straight through the badge. */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pointer-events-none">
        <div className="h-full flex items-center pl-3 pr-2 bg-surface-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand text-white whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="h-full w-10 bg-gradient-to-r from-[#eaf3fb] to-transparent" />
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-[#eaf3fb] to-transparent" />

      {/* Left padding clears the cap so the first headline does not start
          underneath it. */}
      <div className="pl-[6.5rem] sm:pl-28 py-2.5">
        <div className="ticker-track flex items-center whitespace-nowrap">
          {TICKER_ITEMS.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="inline-flex items-center gap-2 px-5 text-sm font-medium text-ink-soft hover:text-brand transition-colors shrink-0 group"
              tabIndex={-1}
            >
              <item.icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
              <span>{item.text}</span>
              <span className="mx-3 text-xs text-brand/40 select-none">◆</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
