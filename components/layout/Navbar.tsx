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
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "next-themes";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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
  const navLinkBase = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200";
  const navLinkActive = isLight
    ? "text-blue-700 bg-blue-50 font-semibold"
    : "text-cyan-400 bg-cyan-400/10";
  const navLinkInactive = isLight
    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    : "text-slate-400 hover:text-white hover:bg-white/5";

  const iconBtnClass = isLight
    ? "p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
    : "p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all";

  const dropdownClass = isLight
    ? "absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-[0_8px_32px_rgba(15,23,42,0.12)] overflow-hidden"
    : "absolute right-0 mt-2 w-52 glass rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden";

  const dropdownHeaderClass = isLight
    ? "p-3 border-b border-slate-100"
    : "p-3 border-b border-white/10";

  const dropdownNameClass = isLight
    ? "text-sm font-semibold text-slate-900 truncate"
    : "text-sm font-semibold text-white truncate";

  const dropdownEmailClass = isLight
    ? "text-xs text-slate-500 truncate"
    : "text-xs text-slate-400 truncate";

  const logoTextClass = isLight
    ? "font-display font-bold text-base md:text-lg text-slate-900 group-hover:text-blue-700 transition-colors"
    : "font-display font-bold text-base md:text-lg text-white group-hover:text-cyan-400 transition-colors";

  const logoBadgeClass = isLight ? "text-blue-600" : "text-cyan-400";

  const headerScrolledClass = isLight
    ? "bg-white/90 border-b border-slate-200 shadow-[0_2px_16px_rgba(15,23,42,0.06)] backdrop-blur-md"
    : "glass border-b border-white/10 shadow-[0_4px_32px_rgba(0,0,0,0.4)]";

  const mobileDrawerClass = isLight
    ? "fixed right-0 top-0 bottom-0 z-50 w-72 bg-white border-l border-slate-200 md:hidden overflow-y-auto shadow-2xl"
    : "fixed right-0 top-0 bottom-0 z-50 w-72 glass border-l border-white/10 md:hidden overflow-y-auto";

  const mobileHeaderClass = isLight
    ? "p-4 flex items-center justify-between border-b border-slate-100"
    : "p-4 flex items-center justify-between border-b border-white/10";

  const mobileMenuLinkBase = "block px-4 py-3 rounded-xl text-sm font-medium transition-all";
  const mobileMenuLinkActive = isLight ? "text-blue-700 bg-blue-50 font-semibold" : "text-cyan-400 bg-cyan-400/10";
  const mobileMenuLinkInactive = isLight
    ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
    : "text-slate-300 hover:text-white hover:bg-white/5";

  const searchFormClass = isLight
    ? "bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_rgba(15,23,42,0.12)] p-4"
    : "glass rounded-2xl border border-white/10 p-4";

  const searchInputClass = isLight
    ? "flex-1 bg-transparent text-slate-900 placeholder-slate-400 outline-none text-base"
    : "flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-base";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? headerScrolledClass : "bg-transparent"
        )}
      >
        <nav className="container-app flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group min-w-0 shrink">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_16px_rgba(56,189,248,0.35)] group-hover:shadow-[0_0_24px_rgba(56,189,248,0.55)] transition-all duration-300 shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className={cn(logoTextClass, "truncate")}>
              CampusVault <span className={logoBadgeClass}>GBPIET</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
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
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className={iconBtnClass}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <ThemeToggle />

            {/* Upload CTA */}
            <Link
              href="/upload"
              className="hidden sm:flex items-center gap-1.5 btn-primary text-sm py-2 px-4 rounded-lg"
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
                    isLight ? "hover:bg-slate-100" : "hover:bg-white/5"
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
                        <MenuLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" isLight={isLight} />
                        <MenuLink href="/profile" icon={<User className="w-4 h-4" />} label="Profile" isLight={isLight} />
                        <MenuLink href="/wishlist" icon={<BookmarkPlus className="w-4 h-4" />} label="Wishlist" isLight={isLight} />
                        <MenuLink href="/upload" icon={<Upload className="w-4 h-4" />} label="Upload" isLight={isLight} />
                        {isAdmin && (
                          <MenuLink href="/admin" icon={<Shield className="w-4 h-4" />} label="Admin Panel" isLight={isLight} className={isLight ? "text-blue-600 font-semibold" : "text-cyan-400"} />
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
                className={cn(
                  "btn-ghost text-sm py-2 px-4 rounded-lg",
                  isLight && "border-slate-300 text-slate-700 hover:text-slate-900 hover:border-blue-400"
                )}
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn("md:hidden", iconBtnClass)}
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
                "fixed inset-0 z-40 backdrop-blur-sm md:hidden",
                isLight ? "bg-slate-900/30" : "bg-black/60"
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
                <span className={isLight ? "font-display font-bold text-slate-900" : "font-display font-bold text-white"}>Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className={iconBtnClass}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && (
                <div className={cn("p-4 flex items-center gap-3", isLight ? "border-b border-slate-100" : "border-b border-white/10")}>
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt="" width={40} height={40} className="rounded-full border border-blue-400/30" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {user.displayName?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <p className={isLight ? "text-sm font-semibold text-slate-900" : "text-sm font-semibold text-white"}>{user.displayName}</p>
                    <p className={isLight ? "text-xs text-slate-500" : "text-xs text-slate-400"}>{user.email}</p>
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
                      <Link href="/admin" className={cn(mobileMenuLinkBase, isLight ? "text-blue-600 bg-blue-50 font-semibold" : "text-cyan-400 bg-cyan-400/5 hover:bg-cyan-400/10")}>Admin Panel</Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className={cn(mobileMenuLinkBase, "w-full text-left text-red-500", isLight ? "hover:bg-red-50" : "hover:bg-red-400/10")}
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
              className={cn("fixed inset-0 z-50 backdrop-blur-md", isLight ? "bg-slate-900/30" : "bg-black/70")}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
            >
              <form onSubmit={handleSearch} className={searchFormClass}>
                <div className="flex items-center gap-3">
                  <Search className={cn("w-5 h-5 shrink-0", isLight ? "text-blue-600" : "text-cyan-400")} />
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
                        isLight
                          ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                          : "badge-cyan hover:bg-cyan-400/20"
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
  href, icon, label, className, isLight,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
  isLight: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all",
        isLight
          ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          : "text-slate-300 hover:text-white hover:bg-white/5",
        className
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
