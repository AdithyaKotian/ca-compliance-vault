"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Home,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Calendar as Cal,
  Settings,
  Globe,
  Menu,
  LogOut,
  Shield,
  Search,
} from "lucide-react";
import { useProfile } from "@/components/providers/profile-provider";
import { supabase } from "@/lib/supabase/client";

export default function Topbar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { profile } = useProfile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = (profile?.role?.toLowerCase() as "admin" | "accountant") || "admin";

  const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: Home, roles: ["admin", "accountant"] },
    { title: "Clients", href: "/clients", icon: Users, roles: ["admin", "accountant"] },
    { title: "Engagements", href: "/engagements", icon: Briefcase, roles: ["admin", "accountant"] },
    { title: "Documents", href: "/documents", icon: FileText, roles: ["admin", "accountant"] },
    { title: "Invoices", href: "/invoices", icon: CreditCard, roles: ["admin", "accountant"] },
    { title: "Calendar", href: "/calendar", icon: Cal, roles: ["admin", "accountant"] },
    { title: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
    { title: "Client Portal", href: "/client-portal", icon: Globe, roles: ["admin"] },
  ];

  const visibleNav = navItems.filter((item) => item.roles.includes(userRole));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "CA";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 mx-auto">
        {/* Mobile Navigation Drawer Trigger */}
        <div className="flex items-center gap-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Menu className="h-5 w-5 text-slate-700" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-6 flex flex-col justify-between">
              <div>
                <SheetHeader className="text-left pb-4 border-b border-slate-100">
                  <SheetTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    CA Compliance Vault
                  </SheetTitle>
                </SheetHeader>

                <nav className="mt-4 space-y-1">
                  {visibleNav.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-slate-900 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="text-xs text-slate-500">
                  Logged in as{" "}
                  <span className="font-semibold text-slate-800">
                    {profile?.full_name || "Staff"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="font-bold text-slate-900 text-sm">
            CA Vault
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="hidden sm:flex flex-1 max-w-md items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Quick search across clients, engagements..."
              className="pl-9 bg-slate-50/70 border-slate-200 focus:bg-white text-xs h-9"
            />
          </div>
        </div>

        {/* User profile & Workspace pill */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-800">
              {profile?.full_name || "Adithya Kotian"}
            </span>
            <span className="text-[10px] text-slate-500 capitalize">
              {profile?.role || "Firm Admin"}
            </span>
          </div>

          <Link href="/settings">
            <Avatar className="h-9 w-9 border border-slate-200 hover:ring-2 hover:ring-slate-300 transition-all cursor-pointer">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs font-semibold text-white">
                  {getInitials(profile?.full_name)}
                </div>
              )}
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
