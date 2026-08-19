"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/layout/dashboard-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Briefcase,
  FileText,
  CreditCard,
  ArrowRight,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type ClientRow = {
  id: string;
  name: string;
  type: string | null;
  risk_level: string | null;
};

type EngagementRow = {
  id: string;
  client_id: string;
  title: string;
  type: string;
  status: string;
  due_date: string | null;
  priority: string | null;
};

type ChecklistItemRow = {
  id: string;
  engagement_id: string;
  title: string;
  status: string;
  due_date: string | null;
};

type InvoiceRow = {
  id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  tax: number | null;
  total_amount: number | null;
  status: string;
  due_date: string | null;
};

type AuditLogRow = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function fmtINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null): string {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [engagements, setEngagements] = useState<EngagementRow[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [clientsRes, engRes, checklistRes, invRes, logsRes] =
          await Promise.all([
            supabase.from("clients").select("id, name, type, risk_level"),
            supabase
              .from("engagements")
              .select("id, client_id, title, type, status, due_date, priority")
              .order("due_date", { ascending: true }),
            supabase
              .from("checklist_items")
              .select("id, engagement_id, title, status, due_date"),
            supabase
              .from("invoices")
              .select(
                "id, client_id, invoice_number, amount, tax, total_amount, status, due_date"
              ),
            supabase
              .from("audit_logs")
              .select("id, action, metadata, created_at")
              .order("created_at", { ascending: false })
              .limit(8),
          ]);

        setClients(clientsRes.data ?? []);
        setEngagements(engRes.data ?? []);
        setChecklistItems(checklistRes.data ?? []);
        setInvoices(invRes.data ?? []);
        setAuditLogs((logsRes.data as AuditLogRow[]) ?? []);
      } catch {
        // Fallback gracefully if some tables are empty
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboardData();
  }, []);

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clients]);

  // Real KPI Metrics
  const totalClients = clients.length;
  const activeEngagements = engagements.filter(
    (e) => !["completed", "filed"].includes(e.status.toLowerCase())
  );
  const pendingDocsCount = checklistItems.filter((item) =>
    ["pending", "requested"].includes(item.status.toLowerCase())
  ).length;
  const outstandingAmount = invoices
    .filter((inv) => ["sent", "overdue"].includes(inv.status.toLowerCase()))
    .reduce((sum, inv) => sum + (inv.total_amount ?? (inv.amount + (inv.tax || 0))), 0);

  // Upcoming Urgencies
  const urgentEngagements = useMemo(() => {
    return activeEngagements.slice(0, 5);
  }, [activeEngagements]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-slate-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Firm Operations Overview
            </h1>
            <p className="text-sm text-slate-500">
              Welcome back. Real-time compliance health and client workflows across Kotian &amp; Co.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/clients">
              <Button variant="outline" size="sm" className="gap-1.5 bg-white">
                <Users className="h-4 w-4 text-slate-500" />
                Clients
              </Button>
            </Link>
            <Link href="/engagements">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Engagement
              </Button>
            </Link>
          </div>
        </header>

        {/* 4 Core Metric KPI Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
                Total Clients
              </CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalClients}</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <span className="text-emerald-600 font-semibold">Active portfolio</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
                Active Filings
              </CardTitle>
              <Briefcase className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {activeEngagements.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">In progress &amp; review</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
                Pending Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {pendingDocsCount}
              </div>
              <div className="text-xs text-slate-500 mt-1">Awaiting client upload</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
                Outstanding Invoices
              </CardTitle>
              <CreditCard className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {fmtINR(outstandingAmount)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Receivables pipeline</div>
            </CardContent>
          </Card>
        </section>

        {/* 2-Column Section: Urgent Deadlines + Live Audit Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Urgent Deadlines & Filings (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Upcoming Statutory Deadlines
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Filings due in the next 14 days.
                  </CardDescription>
                </div>
                <Link
                  href="/calendar"
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  View Calendar <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {urgentEngagements.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500">
                    No urgent filing deadlines due in the next 14 days.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {urgentEngagements.map((eng) => {
                      const clientName =
                        clientMap.get(eng.client_id) || "Unknown Client";
                      const engChecklist = checklistItems.filter(
                        (i) => i.engagement_id === eng.id
                      );
                      const total = engChecklist.length;
                      const done = engChecklist.filter((i) =>
                        ["uploaded", "approved", "verified"].includes(
                          i.status.toLowerCase()
                        )
                      ).length;
                      const progress =
                        total > 0 ? Math.round((done / total) * 100) : 0;

                      return (
                        <div
                          key={eng.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/engagements/${eng.id}`}
                                className="font-semibold text-slate-900 hover:underline text-sm"
                              >
                                {eng.title}
                              </Link>
                              <Badge variant="outline" className="text-[10px]">
                                {eng.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-500">
                              Client: <span className="font-medium text-slate-700">{clientName}</span> • Due:{" "}
                              <span className="font-semibold text-red-600">
                                {formatDate(eng.due_date)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="w-28 space-y-1 hidden sm:block">
                              <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Checklist</span>
                                <span>{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1.5" />
                            </div>

                            <Link href={`/engagements/${eng.id}`}>
                              <Button variant="outline" size="sm" className="h-8 text-xs">
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/clients">
                <Card className="border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Manage Clients</div>
                      <div className="text-[11px] text-slate-500">Add or edit profile</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/documents">
                <Card className="border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Document Vault</div>
                      <div className="text-[11px] text-slate-500">Verify client files</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/invoices">
                <Card className="border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Billing &amp; GST</div>
                      <div className="text-[11px] text-slate-500">Issue fee invoices</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Activity Stream / Audit Trail (1 col) */}
          <div className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-semibold">
                  Recent Audit Trail
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time activity across firm compliance records.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {auditLogs.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-6">
                    No recent activities recorded.
                  </div>
                ) : (
                  auditLogs.map((log) => {
                    const actionFormatted = log.action
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase());

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-2.5 text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                      >
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div className="space-y-0.5 flex-1">
                          <div className="font-semibold text-slate-800">
                            {actionFormatted}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatDate(log.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
