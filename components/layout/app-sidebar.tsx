"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Badge } from "../ui/badge";
import {
  Home,
  Users,
  FileText,
  CreditCard,
  Calendar as Cal,
  Settings,
  Globe,
} from "lucide-react";

const nav = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Clients", href: "/clients", icon: Users },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Invoices", href: "/invoices", icon: CreditCard },
  { title: "Calendar", href: "/calendar", icon: Cal },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Client Portal", href: "/client-portal", icon: Globe },
];

export default function AppSidebar() {
  const pathname = usePathname() || "/";

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:gap-6 md:border-r md:bg-white md:px-6 md:py-6">
      <div className="flex flex-col gap-2">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          CA Compliance Vault
        </Link>
        <div className="text-sm text-slate-500">Client portal for CA firms</div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 ${
                active ? "bg-slate-100 font-semibold text-slate-900" : ""
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t pt-4">
        <div className="text-sm text-slate-600">Firm: <span className="font-medium text-slate-900">Kotian &amp; Co.</span></div>
        <div className="text-sm text-slate-600 mt-1">Plan: <Badge variant="outline">Growth workspace</Badge></div>
      </div>
    </aside>
  );
}
