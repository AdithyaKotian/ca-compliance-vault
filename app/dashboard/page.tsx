import React from "react";
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
import {
  getJobsDueThisWeek,
  getPendingDocumentsCount,
  getOverdueInvoicesTotal,
  getHighRiskEngagements,
  getClientById,
  getEngagementChecklist,
  engagements,
  checklistItems,
  invoices,
} from "../../lib/mock-data";
import { Calendar, FileText, DollarSign, AlertTriangle } from "lucide-react";

function fmtINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function Page() {
  const jobs = getJobsDueThisWeek();
  const pendingDocs = getPendingDocumentsCount();
  const unpaidTotal = getOverdueInvoicesTotal();
  const highRisk = getHighRiskEngagements();

  // SLA Risk Monitor: include High and Medium
  const slaRisks = engagements.filter((e) => e.risk === "High" || e.risk === "Medium");

  // Upcoming deadlines: sort by due date ascending
  const upcoming = [...engagements]
    .filter((e) => new Date(e.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 8);

  // Pending checklist items
  const pendingChecklist = checklistItems.filter((c) => c.status === "Pending" || c.status === "Requested");

  // Unpaid invoices (Sent or Overdue)
  const unpaidInvoices = invoices.filter((i) => i.status === "Sent" || i.status === "Overdue");

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Firm Dashboard</h1>
            <p className="text-sm text-slate-600">Track client documents, filing deadlines, approvals, and unpaid invoices in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button>New Engagement</Button>
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
                  <div className="text-2xl font-semibold">{jobs.length}</div>
                  <div className="text-sm text-slate-500">Active jobs due this week</div>
                </div>
                <Calendar className="h-6 w-6 text-slate-600" />
              </div>
              <div className="mt-4">
                <Progress value={Math.min(100, Math.round((jobs.length / 20) * 100))} />
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
                  <div className="text-2xl font-semibold">{highRisk.length}</div>
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
                {slaRisks.map((e) => {
                  const client = getClientById(e.clientId);
                  const pending = getEngagementChecklist(e.id).filter((c) => c.status === "Pending").length;
                  return (
                    <div key={e.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{client?.name ?? "-"}</div>
                        <div className="text-sm text-slate-600">{e.title}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500">Due {new Date(e.dueDate).toLocaleDateString("en-IN")}</div>
                        <div className="text-sm text-slate-700">{pending} pending</div>
                        <Badge variant={e.risk === "High" ? "destructive" : e.risk === "Medium" ? "secondary" : undefined}>{e.risk}</Badge>
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
                {upcoming.map((e) => {
                  const client = getClientById(e.clientId);
                  return (
                    <div key={e.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{e.title}</div>
                        <div className="text-sm text-slate-600">{client?.name}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge>{e.status}</Badge>
                        <div className="text-sm text-slate-500">{new Date(e.dueDate).toLocaleDateString("en-IN")}</div>
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
                {pendingChecklist.slice(0, 6).map((c) => {
                  const eng = engagements.find((e) => e.id === c.engagementId);
                  const client = eng ? getClientById(eng.clientId) : undefined;
                  return (
                    <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{c.title}</div>
                        <div className="text-sm text-slate-600">{eng?.title} • {client?.name}</div>
                      </div>
                      <Badge>{c.status}</Badge>
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
                {unpaidInvoices.map((inv) => {
                  const client = getClientById(inv.clientId);
                  return (
                    <div key={inv.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{inv.number}</div>
                        <div className="text-sm text-slate-600">{client?.name}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">{fmtINR(inv.amountINR)}</div>
                        <Badge>{inv.status}</Badge>
                        <div className="text-sm text-slate-500">Due {new Date(inv.dueDate).toLocaleDateString("en-IN")}</div>
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
