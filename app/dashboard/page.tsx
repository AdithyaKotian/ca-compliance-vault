"use client"

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../components/layout/dashboard-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Calendar, FileText, DollarSign, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

type ClientRow = {
  id: string;
  firm_id: string | null;
  name: string;
  type: "individual" | "business" | string | null;
  email: string | null;
  phone: string | null;
  pan: string | null;
  gstin: string | null;
  address: string | null;
  risk_level: "low" | "medium" | "high" | string | null;
  created_at: string | null;
};

type EngagementRow = {
  id: string;
  firm_id: string | null;
  client_id: string;
  title: string;
  type: string;
  status: string;
  due_date: string | null;
  priority: string | null;
  created_at: string | null;
};

type ChecklistItemRow = {
  id: string;
  engagement_id: string;
  title: string;
  description: string | null;
  status: string;
  required: boolean | null;
  due_date: string | null;
  assigned_staff: string | null;
  created_at: string | null;
};

type InvoiceRow = {
  id: string;
  firm_id: string | null;
  client_id: string;
  engagement_id: string | null;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string | null;
  payment_link: string | null;
  created_at: string | null;
};

type Risk = "High" | "Medium" | "Low";

function fmtINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPendingChecklistItem(item: ChecklistItemRow) {
  const status = item.status.toLowerCase();
  return status === "pending" || status === "requested";
}

function isUnpaidInvoice(invoice: InvoiceRow) {
  const status = invoice.status.toLowerCase();
  return status === "sent" || status === "overdue";
}

function isActiveEngagement(engagement: EngagementRow) {
  const status = engagement.status.toLowerCase();
  return status !== "completed" && status !== "filed";
}

function getEngagementRisk(engagement: EngagementRow, pendingChecklistCount: number): Risk {
  const priority = engagement.priority?.toLowerCase();
  const due = parseDate(engagement.due_date);
  const now = new Date();
  const diff = due ? Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  if (priority === "high" || (diff !== null && diff <= 3 && diff >= 0) || (diff !== null && diff < 0) || pendingChecklistCount > 0) {
    return "High";
  }
  if (priority === "medium" || (diff !== null && diff <= 7 && diff >= 0)) {
    return "Medium";
  }
  return "Low";
}

function getRiskVariant(risk: Risk) {
  if (risk === "High") return "destructive";
  if (risk === "Medium") return "secondary";
  return "default";
}

export default function Page() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [engagements, setEngagements] = useState<EngagementRow[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      const [clientsRes, engagementsRes, checklistRes, invoicesRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("engagements").select("*"),
        supabase.from("checklist_items").select("*"),
        supabase.from("invoices").select("*"),
      ]);

      const fetchError = clientsRes.error || engagementsRes.error || checklistRes.error || invoicesRes.error;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setClients((clientsRes.data ?? []) as ClientRow[]);
      setEngagements((engagementsRes.data ?? []) as EngagementRow[]);
      setChecklistItems((checklistRes.data ?? []) as ChecklistItemRow[]);
      setInvoices((invoicesRes.data ?? []) as InvoiceRow[]);
      setLoading(false);
    };

    void loadData();
  }, []);

  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients]
  );

  const jobsDueThisWeek = useMemo(
    () => engagements.filter((engagement) => {
      if (!isActiveEngagement(engagement)) return false;
      const due = parseDate(engagement.due_date);
      if (!due) return false;
      const diff = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 7;
    }),
    [engagements]
  );

  const pendingDocs = useMemo(
    () => checklistItems.filter(isPendingChecklistItem).length,
    [checklistItems]
  );

  const unpaidTotal = useMemo(
    () => invoices.filter(isUnpaidInvoice).reduce((sum, invoice) => sum + invoice.amount, 0),
    [invoices]
  );

  const highRiskEngagements = useMemo(() => {
    const now = new Date();
    return engagements.filter((engagement) => {
      const pendingCount = checklistItems.filter((item) => item.engagement_id === engagement.id && isPendingChecklistItem(item)).length;
      const due = parseDate(engagement.due_date);
      const diff = due ? Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
      return (
        engagement.priority?.toLowerCase() === "high" ||
        (diff !== null && diff <= 0) ||
        ((diff !== null && diff <= 7 && diff >= 0) && pendingCount > 0)
      );
    });
  }, [checklistItems, engagements]);

  const upcoming = useMemo(
    () => [...engagements]
      .filter((engagement) => {
        const due = parseDate(engagement.due_date);
        return due !== null && due >= new Date();
      })
      .sort((a, b) => {
        const aDue = parseDate(a.due_date)?.getTime() ?? 0;
        const bDue = parseDate(b.due_date)?.getTime() ?? 0;
        return aDue - bDue;
      })
      .slice(0, 8),
    [engagements]
  );

  const pendingChecklist = useMemo(
    () => checklistItems.filter(isPendingChecklistItem),
    [checklistItems]
  );

  const unpaidInvoices = useMemo(
    () => invoices.filter(isUnpaidInvoice),
    [invoices]
  );

  if (loading) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-4xl py-24">
          <Card>
            <CardHeader>
              <CardTitle>Loading dashboard...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-600">
                <p>Fetching firm metrics from Supabase.</p>
                <p>This may take a moment.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-3xl py-24">
          <Card>
            <CardHeader>
              <CardTitle>Unable to load dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Firm Dashboard</h1>
            <p className="text-sm text-slate-600">Track client documents, filing deadlines, approvals, and unpaid invoices in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => toast.success("Engagement creation will be connected in the next Supabase write step.")}>New Engagement</Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Jobs Due This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold">{jobsDueThisWeek.length}</div>
                  <div className="text-sm text-slate-500">Active jobs due this week</div>
                </div>
                <Calendar className="h-6 w-6 text-slate-600" />
              </div>
              <div className="mt-4">
                <Progress value={Math.min(100, Math.round((jobsDueThisWeek.length / 20) * 100))} />
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-slate-500">Overview</div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold">{pendingDocs}</div>
                  <div className="text-sm text-slate-500">Documents awaiting upload or verification</div>
                </div>
                <FileText className="h-6 w-6 text-slate-600" />
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <Progress value={Math.min(100, Math.round((pendingDocs / 200) * 100))} />
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unpaid Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold">{fmtINR(unpaidTotal)}</div>
                  <div className="text-sm text-slate-500">Total overdue invoices</div>
                </div>
                <DollarSign className="h-6 w-6 text-slate-600" />
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-slate-500">Collections</div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>High Risk Engagements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold">{highRiskEngagements.length}</div>
                  <div className="text-sm text-slate-500">Engagements flagged high risk</div>
                </div>
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-slate-500">SLA Monitor</div>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>SLA Risk Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {highRiskEngagements.map((engagement) => {
                  const client = clientById.get(engagement.client_id);
                  const pending = checklistItems.filter((item) => item.engagement_id === engagement.id && item.status.toLowerCase() === "pending").length;
                  const risk = getEngagementRisk(engagement, pending);
                  return (
                    <div key={engagement.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{client?.name ?? "-"}</div>
                        <div className="text-sm text-slate-600">{engagement.title}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500">Due {parseDate(engagement.due_date)?.toLocaleDateString("en-IN") ?? "No due date"}</div>
                        <div className="text-sm text-slate-700">{pending} pending</div>
                        <Badge variant={getRiskVariant(risk)}>{risk}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcoming.map((engagement) => {
                  const client = clientById.get(engagement.client_id);
                  return (
                    <div key={engagement.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{engagement.title}</div>
                        <div className="text-sm text-slate-600">{client?.name ?? "-"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge>{engagement.status}</Badge>
                        <div className="text-sm text-slate-500">{parseDate(engagement.due_date)?.toLocaleDateString("en-IN") ?? "No due date"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Pending Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingChecklist.slice(0, 6).map((item) => {
                  const engagement = engagements.find((e) => e.id === item.engagement_id);
                  const client = engagement ? clientById.get(engagement.client_id) : undefined;
                  return (
                    <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-slate-600">{engagement?.title ?? "Unknown engagement"} • {client?.name ?? "Unknown client"}</div>
                      </div>
                      <Badge>{item.status}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Unpaid Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unpaidInvoices.map((invoice) => {
                  const client = clientById.get(invoice.client_id);
                  return (
                    <div key={invoice.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{invoice.invoice_number}</div>
                        <div className="text-sm text-slate-600">{client?.name ?? "Unknown client"}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">{fmtINR(invoice.amount)}</div>
                        <Badge>{invoice.status}</Badge>
                        <div className="text-sm text-slate-500">{parseDate(invoice.due_date)?.toLocaleDateString("en-IN") ?? "No due date"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  );
}
