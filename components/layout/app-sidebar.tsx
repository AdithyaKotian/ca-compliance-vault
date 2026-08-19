"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Calendar as Cal,
  Settings,
  Globe,
  LogOut,
  Shield,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers/profile-provider";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("admin" | "accountant")[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home, roles: ["admin", "accountant"] },
  { title: "Clients", href: "/clients", icon: Users, roles: ["admin", "accountant"] },
  { title: "Engagements", href: "/engagements", icon: Briefcase, roles: ["admin", "accountant"] },
  { title: "Documents", href: "/documents", icon: FileText, roles: ["admin", "accountant"] },
  { title: "Invoices", href: "/invoices", icon: CreditCard, roles: ["admin", "accountant"] },
  { title: "Calendar", href: "/calendar", icon: Cal, roles: ["admin", "accountant"] },
  { title: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
  { title: "Client Portal Preview", href: "/client-portal", icon: Globe, roles: ["admin"] },
];

export default function AppSidebar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { profile } = useProfile();

  const userRole = (profile?.role?.toLowerCase() as "admin" | "accountant") || "admin";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const visibleNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:gap-6 md:border-r md:border-slate-200 md:bg-white md:px-6 md:py-6 shrink-0">
      <div className="flex flex-col gap-1">
        <Link href="/dashboard" className="flex items-center gap-2 text-base font-bold text-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
            <Shield className="h-4 w-4 text-emerald-400" />
          </div>
          <span>CA Compliance Vault</span>
        </Link>
        <div className="text-xs text-slate-500 pl-10">Client & Compliance Cloud</div>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {visibleNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-emerald-400" : "text-slate-500"}`} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 border-t border-slate-200 pt-4">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
          <div className="text-xs font-semibold text-slate-900">Kotian &amp; Co.</div>
          <div className="mt-1 flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] uppercase font-semibold text-slate-600">
              {profile?.role || "Firm Staff"}
            </Badge>
            <span className="text-[10px] text-emerald-600 font-medium">Active</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}