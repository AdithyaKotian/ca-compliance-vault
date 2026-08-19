import React from "react";
import { Loader2, Shield } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
        <Shield className="h-6 w-6 text-emerald-400" />
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        <span>Loading CA Compliance Vault...</span>
      </div>
    </div>
  );
}
