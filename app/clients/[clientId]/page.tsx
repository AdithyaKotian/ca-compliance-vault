import React from "react";
import Link from "next/link";
import DashboardShell from "../../../components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  getClientById,
  getClientEngagements,
  getClientInvoices,
  getEngagementProgress,
  getEngagementChecklist,
  contacts,
  notes,
  auditLogs,
} from "../../../lib/mock-data";

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

function fmtINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params;
  const client = getClientById(clientId);

  if (!client) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-3xl py-24">
          <Card>
            <CardHeader>
              <CardTitle>Client not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">This client record does not exist or may have been removed.</p>
              <div className="mt-4">
                <Link href="/clients">
                  <Button variant="outline">Back to Clients</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  const mainContact = contacts.find((c) => c.id === client.primaryContactId);
  const clientEngs = getClientEngagements(client.id);
  const clientInvoices = getClientInvoices(client.id);

  const activeEngagements = clientEngs.filter((e) => e.status !== "Completed" && e.status !== "Filed");

  const pendingDocsCount = clientEngs.reduce((sum, e) => {
    const items = getEngagementChecklist(e.id).filter((it) => it.status === "Pending" || it.status === "Requested");
    return sum + items.length;
  }, 0);

  const unpaidTotal = clientInvoices.filter((i) => i.status === "Sent" || i.status === "Overdue").reduce((s, it) => s + it.amountINR, 0);

  // Notes for client
  const clientNotes = notes.filter((n) => n.clientId === client.id);

  // Timeline: audit logs for client or its engagements
  const engagementIds = new Set(clientEngs.map((e) => e.id));
  const clientTimeline = auditLogs.filter(
    (a) => a.entityType === "Client" && a.entityId === client.id || (a.entityType === "Engagement" && engagementIds.has(a.entityId))
  );

  const clientTypeLabel = client.type === "Proprietorship" ? "Individual" : "Business";

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/clients" className="text-sm text-slate-600">← Back</Link>
            <div>
              <h1 className="text-2xl font-semibold">{client.name}</h1>
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-600">{clientTypeLabel}</div>
                <Badge>{/* risk */}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button>New Engagement</Button>
            <Button variant="outline">Send Reminder</Button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="font-medium">{mainContact?.name ?? "-"}</div>
                <div className="text-slate-600">{mainContact?.email ?? "-"}</div>
                <div className="text-slate-600">{mainContact?.phone ?? "-"}</div>
                {client.gstin && <div className="mt-2 text-sm">GSTIN: {client.gstin}</div>}
                {client.pan && <div className="text-sm">PAN: {client.pan}</div>}
                {client.address && <div className="text-sm mt-2">{client.address}</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">Active Engagements</div>
                  <div className="font-medium">{activeEngagements.length}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">Pending Documents</div>
                  <div className="font-medium">{pendingDocsCount}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">Unpaid Amount</div>
                  <div className="font-medium">{fmtINR(unpaidTotal)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">Risk Level</div>
                  <div className="font-medium">{/* determine risk */}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="outline">Share Client Link</Button>
                <Button variant="ghost">Export Data</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Active Engagements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeEngagements.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <div className="font-medium">{e.title}</div>
                      <div className="text-sm text-slate-600">{e.type}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge>{e.status}</Badge>
                      <div className="text-sm text-slate-500">Due {new Date(e.dueDate).toLocaleDateString("en-IN")}</div>
                      <div className="text-sm">{getEngagementProgress(e.id)}% complete</div>
                      <Link href={`/engagements/${e.id}`}>
                        <Button size="sm" variant="outline">Open</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientEngs.flatMap((e) => getEngagementChecklist(e.id)).filter((it) => it.status === "Pending" || it.status === "Requested").map((it) => {
                  const eng = clientEngs.find((en) => en.id === it.engagementId);
                  return (
                    <div key={it.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{it.title}</div>
                        <div className="text-sm text-slate-600">{eng?.title}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-slate-500">Due {it.dueDate ? new Date(it.dueDate).toLocaleDateString("en-IN") : "-"}</div>
                        <Badge>{it.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Unpaid Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientInvoices.filter((i) => i.status === "Sent" || i.status === "Overdue").map((inv) => {
                  const eng = clientEngs.find((e) => e.id === inv.engagementId);
                  return (
                    <div key={inv.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{inv.number}</div>
                        <div className="text-sm text-slate-600">{eng?.title ?? "-"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{fmtINR(inv.amountINR)}</div>
                        <Badge>{inv.status}</Badge>
                        <div className="text-sm text-slate-500">Due {new Date(inv.dueDate).toLocaleDateString("en-IN")}</div>
                        {inv.paymentLink && (
                          <a href={inv.paymentLink} target="_blank" rel="noopener noreferrer">
                            <Button size="sm">Pay</Button>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientNotes.map((n) => (
                  <div key={n.id} className="rounded-md border p-3">
                    <div className="text-sm text-slate-800">{n.content}</div>
                    <div className="text-xs text-slate-500 mt-2">{n.author} • {new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientTimeline.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <div className="font-medium">{a.action}</div>
                      <div className="text-sm text-slate-600">{a.details}</div>
                    </div>
                    <div className="text-sm text-slate-500">{new Date(a.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  );
}
