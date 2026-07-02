"use client"

import React from "react";
import AppSidebar from "./app-sidebar";
import Topbar from "./topbar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-full">
        <AppSidebar />

        <div className="flex w-full flex-1 flex-col">
          <Topbar />

          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
