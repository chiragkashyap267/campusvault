"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Upload, Search, BookOpen, User,
  LogOut, LayoutDashboard, Settings, Shield, BookmarkPlus
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { signOut } from "@/lib/firebase/auth";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    // Lenis emits a scroll event every frame, so this handler runs ~60x/sec.
    // Reading window.scrollY forces a layout read each time, and calling
    // setState each time churns React even though the value rarely changes.
    // The rAF gate coalesces bursts to one read per frame, and the ref guard
    // means setState only fires on the two frames where the flag flips.
    let queued = false;
    let last = window.scrollY > 20;
    setScrolled(last);

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const next = window.scrollY > 20;
        if (next !== last) {
          last = next;
          setScrolled(next);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/resources?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Theme-adaptive class helpers
  // The header is the one blue surface on the site, so everything sitting on
  // it is white and the contrast rules invert: a link is emphasised by gaining
  // opacity, not by darkening.
  const navLinkBase = "px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200";
  const navLinkActive = "text-white bg-white/20 font-semibold";
  const navLinkInactive = "text-white/75 hover:text-white hover:bg-white/12";

  const iconBtnClass = "p-2 rounded-lg text-white/85 hover:text-white hover:bg-white/15 transition-colors";

  const dropdownClass = "absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-[0_8px_32px_rgba(15,23,42,0.12)] overflow-hidden";

  const dropdownHeaderClass = "p-3 border-b border-slate-100";

  const dropdownNameClass = "text-sm font-semibold text-slate-900 truncate";

  const dropdownEmailClass = "text-xs text-slate-500 truncate";

  // Set like the reference wordmark — 800 with the tracking pulled in. A
  // logotype is the one place on a page that should be tighter than its text.
  const logoTextClass = "font-display font-extrabold tracking-[-0.03em] text-base md:text-lg text-white transition-colors";

  const logoBadgeClass = "text-sky-200";

  // Solid at every scroll position. A header that is transparent at the top
  // and blue further down changes the colour of the logo and every control
  // under it as you scroll, which is exactly the flicker this revamp is
  // meant to remove.
  const headerBandClass = "bg-[linear-gradient(90deg,#0284c7,#0369a1)]";

  const mobileDrawerClass = "fixed right-0 top-0 bottom-0 z-50 w-72 bg-white border-l border-slate-200 lg:hidden overflow-y-auto shadow-2xl";

  const mobileHeaderClass = "p-4 flex items-center justify-between border-b border-slate-100";

  const mobileMenuLinkBase = "block px-4 py-3 rounded-xl text-sm font-medium transition-all";
  const mobileMenuLinkActive = "text-blue-700 bg-blue-50 font-semibold";
  const mobileMenuLinkInactive = "text-slate-700 hover:text-slate-900 hover:bg-slate-100";

  const searchFormClass = "bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_rgba(15,23,42,0.12)] p-4";

  const searchInputClass = "flex-1 bg-transparent text-slate-900 placeholder-slate-400 outline-none text-base";

  return (
    <>
      <header
        className={cn(
          "fixed top-[28px] left-0 right-0 z-50 transition-shadow duration-300",
          headerBandClass,
          scrolled && "shadow-[0_2px_18px_rgba(3,105,161,0.28)]"
        )}
      >
        <nav className="container-app flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group min-w-0 shrink">
            <div className="w-8 h-8 rounded-lg bg-white/18 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            {/* "GBPIET" is dropped on a phone rather than letting the whole
                name truncate to "CampusVault ...". The full name is on every
                page title and in the footer. */}
            <span className={cn(logoTextClass, "whitespace-nowrap")}>
              CampusVault{" "}
              <span className={cn(logoBadgeClass, "hidden sm:inline")}>GBPIET</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV_LINKS.filter(link => !link.adminOnly || isAdmin).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  navLinkBase,
                  pathname === link.href ? navLinkActive : navLinkInactive
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className={iconBtnClass}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Upload CTA */}
            <Link
              href="/upload"
              className="hidden sm:flex items-center gap-1.5 bg-white text-[#0369a1] hover:bg-sky-50 font-semibold text-sm py-2 px-4 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Link>

            {/* User Menu / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 p-1 rounded-full transition-all",
                    "hover:bg-slate-100"
                  )}
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      width={32}
                      height={32}
                      className="rounded-full border border-blue-400/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {user.displayName?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={dropdownClass}
                    >
                      <div className={dropdownHeaderClass}>
                        <p className={dropdownNameClass}>
                          {user.displayName || "User"}
                        </p>
                        <p className={dropdownEmailClass}>{user.email}</p>
                      </div>
                      <div className="p-1">
                        <MenuLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                        <MenuLink href="/profile" icon={<User className="w-4 h-4" />} label="Profile" />
                        <MenuLink href="/wishlist" icon={<BookmarkPlus className="w-4 h-4" />} label="Wishlist" />
                        <MenuLink href="/upload" icon={<Upload className="w-4 h-4" />} label="Upload" />
                        {isAdmin && (
                          <MenuLink href="/admin" icon={<Shield className="w-4 h-4" />} label="Admin Panel" className={"text-blue-600 font-semibold"} />
                        )}
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold py-2 px-4 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn("lg:hidden", iconBtnClass)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "fixed inset-0 z-40 backdrop-blur-sm lg:hidden",
                "bg-slate-900/30"
              )}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={mobileDrawerClass}
            >
              <div className={mobileHeaderClass}>
                <span className={"font-display font-bold text-slate-900"}>Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className={iconBtnClass}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && (
                <div className={cn("p-4 flex items-center gap-3", "border-b border-slate-100")}>
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt="" width={40} height={40} className="rounded-full border border-blue-400/30" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {user.displayName?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <p className={"text-sm font-semibold text-slate-900"}>{user.displayName}</p>
                    <p className={"text-xs text-slate-500"}>{user.email}</p>
                  </div>
                </div>
              )}

              <nav className="p-4 space-y-1">
                {NAV_LINKS.filter(link => !link.adminOnly || isAdmin).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      mobileMenuLinkBase,
                      pathname === link.href ? mobileMenuLinkActive : mobileMenuLinkInactive
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link href="/dashboard" className={cn(mobileMenuLinkBase, mobileMenuLinkInactive)}>Dashboard</Link>
                    <Link href="/profile" className={cn(mobileMenuLinkBase, mobileMenuLinkInactive)}>Profile</Link>
                    <Link href="/wishlist" className={cn(mobileMenuLinkBase, mobileMenuLinkInactive)}>Wishlist</Link>
                    {isAdmin && (
                      <Link href="/admin" className={cn(mobileMenuLinkBase, "text-blue-600 bg-blue-50 font-semibold")}>Admin Panel</Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className={cn(mobileMenuLinkBase, "w-full text-left text-red-500", "hover:bg-red-50")}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="pt-4 space-y-2">
                    <Link href="/login" className="block w-full text-center btn-primary py-3 rounded-xl text-sm">
                      Sign In
                    </Link>
                    <Link href="/register" className="block w-full text-center btn-ghost py-3 rounded-xl text-sm">
                      Register
                    </Link>
                  </div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className={cn("fixed inset-0 z-50 backdrop-blur-md", "bg-slate-900/30")}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
            >
              <form onSubmit={handleSearch} className={searchFormClass}>
                <div className="flex items-center gap-3">
                  <Search className={cn("w-5 h-5 shrink-0", "text-blue-600")} />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search resources, notes, PYQs..."
                    className={searchInputClass}
                  />
                  <button type="submit" className="btn-primary text-sm px-4 py-1.5 rounded-lg">
                    Search
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["PYQ Papers", "MCA Notes", "Lab Manual", "B.Tech CSE"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className={cn(
                        "badge text-xs cursor-pointer transition-all",
                        "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuLink({
  href, icon, label, className,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all",
        "text-slate-700 hover:text-slate-900 hover:bg-slate-100",
        className
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
