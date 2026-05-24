import { redirect } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Note: actual auth check is done client-side in each page using useAuthStore + isAdmin
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex">
        {/* Admin sidebar */}
        <aside className="w-56 shrink-0 border-r border-white/[0.06] glass hidden md:block">
          <AdminSidebar />
        </aside>
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Shield, FileCheck, Users, BarChart3, Trash2, LayoutDashboard } from "lucide-react";

function AdminSidebar() {
  const links = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/admin/pending", label: "Pending", icon: <FileCheck className="w-4 h-4" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { href: "/admin/resources", label: "Resources", icon: <Trash2 className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6 px-2 pt-2">
        <Shield className="w-5 h-5 text-cyan-400" />
        <span className="font-display font-bold text-white text-sm">Admin Panel</span>
      </div>
      <nav className="space-y-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            {l.icon} {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
