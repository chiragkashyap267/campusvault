"use client";

import { cn } from "@/lib/utils";

const TOOLS = [
  { emoji: "PDF", label: "PDF Merge" },
  { emoji: "PDF", label: "PDF Split" },
  { emoji: "PDF", label: "PDF Compress" },
  { emoji: "PDF", label: "PDF Convert" },
  { emoji: "IMG", label: "Image Compressor" },
  { emoji: "IMG", label: "Remove Background" },
  { emoji: "IMG", label: "Watermark Tool" },
  { emoji: "QR", label: "QR Generator" },
  { emoji: "BAR", label: "Barcode Generator" },
  { emoji: "PWD", label: "Password Generator" },
  { emoji: "TXT", label: "Word Counter" },
  { emoji: "TXT", label: "Remove Spaces" },
  { emoji: "AI", label: "ATS Resume Checker" },
  { emoji: "EDU", label: "CGPA Calculator" },
  { emoji: "FIN", label: "GST Calculator" },
  { emoji: "FIN", label: "SIP Calculator" },
  { emoji: "FIN", label: "EMI Calculator" },
  { emoji: "FIN", label: "Salary Calculator" },
  { emoji: "CLR", label: "Color Picker" },
  { emoji: "DOC", label: "Resume Builder" },
  { emoji: "DOC", label: "Invoice Generator" },
  { emoji: "DOC", label: "Signature Tool" },
  { emoji: "LNK", label: "Short Link Generator" },
  { emoji: "AUD", label: "Text to Speech" },
  { emoji: "AUD", label: "Speech to Text" },
  { emoji: "ZIP", label: "ZIP Tool" },
  { emoji: "ZIP", label: "Unzip Tool" },
  { emoji: "VID", label: "Media Converter" },
  { emoji: "TMR", label: "Pomodoro Timer" },
  { emoji: "LST", label: "Todo List" },
  { emoji: "NOT", label: "Notes Tool" },
];

const MARQUEE_ITEMS = [...TOOLS, ...TOOLS];

export function ToolsMarquee() {
  const bannerClass = cn(
    "w-full overflow-hidden py-1.5 border-b",
    "bg-[#075985] border-white/10"
  );

  const labelClass = cn(
    "text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap mr-3 shrink-0",
    "text-sky-200"
  );

  const itemClass = cn(
    "inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0",
    "text-white/80 hover:text-white hover:bg-white/15"
  );

  const separatorClass = cn(
    "mx-2 shrink-0",
    "text-white/30"
  );

  return (
    <div className={bannerClass} aria-label="Free utility tools by YourTools">
      <div className="flex items-center overflow-hidden">
        <span className={cn(labelClass, "pl-3 hidden sm:block")}>
          Free Tools:
        </span>

        <div className="flex-1 overflow-hidden relative">
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none",
              "bg-gradient-to-r from-[#f8fafc] to-transparent"
            )}
          />
          <div
            className={cn(
              "absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none",
              "bg-gradient-to-l from-[#f8fafc] to-transparent"
            )}
          />

          <div className="tools-marquee-track flex items-center">
            {MARQUEE_ITEMS.map((tool, i) => (
              <a
                key={i}
                href="https://yourtools-rust.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={itemClass}
                title={"Open " + tool.label + " tool"}
              >
                <span className="text-[10px] font-bold opacity-60">{tool.emoji}</span>
                <span>{tool.label}</span>
                {i < MARQUEE_ITEMS.length - 1 && (
                  <span className={separatorClass}>{"·"}</span>
                )}
              </a>
            ))}
          </div>
        </div>

        <a
          href="https://yourtools-rust.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "shrink-0 px-3 mr-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap rounded-full py-0.5 transition-all hidden sm:block",
            "text-blue-700 bg-blue-100 hover:bg-blue-200"
          )}
        >
          {"Try All \u2192"}
        </a>
      </div>
    </div>
  );
}
