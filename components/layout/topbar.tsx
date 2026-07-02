"use client"

import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar } from "../ui/avatar";

export default function Topbar() {
  return (
    <div className="w-full border-b bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="w-full max-w-lg">
            <Input placeholder="Search clients, engagements, invoices..." />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge>Demo Workspace</Badge>
          <Button>New Engagement</Button>
          <div className="flex items-center gap-2">
            {/* Avatar from shadcn/ui; fallback to simple circle if missing */}
            <Avatar>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white">
                AK
              </div>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  );
}
