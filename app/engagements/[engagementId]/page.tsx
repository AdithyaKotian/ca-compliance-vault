"use client"

import { useMemo } from "react";
import Link from "next/link";
import DashboardShell from "../../../components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import {
  getEngagementById,
  getClientById,
  getEngagementChecklist,
  getEngagementDocuments,
  getEngagementProgress,
  getClientInvoices,
  notes,
  auditLogs,
} from "../../../lib/mock-data";

type EngagementDetailPageProps = {
  params: {
    engagementId: string;
  };
};

function fmtINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function getDaysUntil(dueDate: string) {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getRiskVariant(risk: string) {
  if (risk === "High") return "destructive";
  if (risk === "Medium") return "secondary";
  return "default";
}

function CopyReminderButton({ clientName, engagementTitle, pendingItems }: { clientName: string; engagementTitle: string; pendingItems: string[] }) {
  const message = useMemo(() => {
    if (pendingItems.length === 0) {
      return `Hi ${clientName}, your ${engagementTitle} is in progress. No new document uploads are pending right now.`;
    }

    return `Hi ${clientName}, your ${engagementTitle} is pending. Please upload the following documents: ${pendingItems.join(", ")}. You can share them through your CA Compliance Vault portal.`;
  }, [clientName, engagementTitle, pendingItems]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    toast.success("Reminder message copied");
  };

  return (
    <Button onClick={handleCopy} variant="outline" size="sm">
      <ClipboardCopy className="mr-2 h-4 w-4" />
      Copy WhatsApp Reminder
    </Button>
  );
}

export default function EngagementDetailPage({ params }: EngagementDetailPageProps) {
  const engagement = getEngagementById(params.engagementId);

  if (!engagement) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-3xl py-24">
          <Card>
            <CardHeader>
              <CardTitle>Engagement not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">This engagement record does not exist or may have been removed.</p>
              <div className="mt-4">
                <Link href="/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  const client = getClientById(engagement.clientId);
  const checklist = getEngagementChecklist(engagement.id);
  const documents = getEngagementDocuments(engagement.id);
  const progress = getEngagementProgress(engagement.id);
  const invoice = getClientInvoices(engagement.clientId).find((inv) => inv.engagementId === engagement.id);
  const engagementNotes = notes.filter((note) => note.engagementId === engagement.id);
  const engagementTimeline = auditLogs.filter((audit) => audit.entityType === "Engagement" && audit.entityId === engagement.id);
  const pendingItems = checklist.filter((item) => item.status === "Pending" || item.status === "Requested").map((item) => item.title);
  const dueDays = getDaysUntil(engagement.dueDate);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Link href="/dashboard" className="hover:text-slate-900">← Dashboard</Link>
              {client && (
                <Link href={`/clients/${client.id}`} className="hover:text-slate-900">
                  / {client.name}
                </Link>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{engagement.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>{engagement.type}</span>
                <Badge variant={engagement.status === "Completed" ? "secondary" : engagement.status === "Overdue" ? "destructive" : "default"}>{engagement.status}</Badge>
                <Badge variant={getRiskVariant(engagement.risk)}>{engagement.risk}</Badge>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Due {new Date(engagement.dueDate).toLocaleDateString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CopyReminderButton clientName={client?.name ?? "Client"} engagementTitle={engagement.title} pendingItems={pendingItems} />
            <Button variant="outline" size="sm">Request Documents</Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Completion Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{progress}%</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{pendingItems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Days Until Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{dueDays >= 0 ? dueDays : 0}</div>
              <div className="text-sm text-slate-500">{dueDays < 0 ? "Overdue" : "Days remaining"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Status</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold">{fmtINR(invoice.amountINR)}</div>
                  <Badge variant={invoice.status === "Overdue" ? "destructive" : invoice.status === "Paid" ? "secondary" : "default"}>{invoice.status}</Badge>
                </div>
              ) : (
                <div className="text-sm text-slate-500">No invoice attached</div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.map((item) => {
                  const importance = item.status === "Requested" ? "Required" : "Optional";
                  const actionLabel = item.status === "Pending" || item.status === "Requested" ? "Awaiting Client" : item.status === "Uploaded" ? "Review" : "Approved";
                  return (
                    <div key={item.id} className="rounded-md border px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-slate-500">{item.requestedAt ? `Requested ${new Date(item.requestedAt).toLocaleDateString("en-IN")}` : "No request date"}</div>
                        </div>
                        <Badge variant={item.status === "Rejected" ? "destructive" : item.status === "Approved" ? "secondary" : "outline"}>{item.status}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <Badge variant="outline">{importance}</Badge>
                        <span>{item.dueDate ? `Due ${new Date(item.dueDate).toLocaleDateString("en-IN")}` : "No due date"}</span>
                        {item.assignee && <span>Assigned to {item.assignee}</span>}
                      </div>
                      <div className="mt-3">
                        <Button size="sm" variant={item.status === "Uploaded" ? "default" : "outline"}>{actionLabel}</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-sm text-slate-500">No documents uploaded yet.</div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const relatedItem = checklist.find((item) => doc.title.toLowerCase().includes(item.title.toLowerCase().split(" ")[0]));
                    return (
                      <div key={doc.id} className="rounded-md border px-3 py-3">
                        <div className="flex flex-col gap-2">
                          <div className="font-medium">{doc.fileName}</div>
                          <div className="text-sm text-slate-600">Uploaded by {doc.uploadedBy ?? "Unknown"} on {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN") : "Unknown"}</div>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant={doc.status === "Verified" ? "secondary" : doc.status === "Rejected" ? "destructive" : "default"}>{doc.status}</Badge>
                            <span>{relatedItem ? `Checklist: ${relatedItem.title}` : "No related checklist"}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button size="sm" variant="outline">View File</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice ? (
                <div className="space-y-3">
                  <div className="font-medium">{invoice.number}</div>
                  <div className="text-sm text-slate-600">Amount: {fmtINR(invoice.amountINR)}</div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant={invoice.status === "Overdue" ? "destructive" : invoice.status === "Paid" ? "secondary" : "default"}>{invoice.status}</Badge>
                    <span>Due {new Date(invoice.dueDate).toLocaleDateString("en-IN")}</span>
                  </div>
                  {invoice.paymentLink ? (
                    <div className="flex flex-wrap gap-2">
                      <a href={invoice.paymentLink} target="_blank" rel="noreferrer">
                        <Button size="sm">Open Payment</Button>
                      </a>
                      <Button size="sm" variant="outline" onClick={async () => {
                        await navigator.clipboard.writeText(invoice.paymentLink ?? "");
                        toast.success("Payment link copied");
                      }}>
                        Copy Payment Link
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No payment link available.</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No invoice attached to this engagement yet.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {engagementNotes.length === 0 ? (
                <div className="text-sm text-slate-500">No notes yet.</div>
              ) : (
                <div className="space-y-3">
                  {engagementNotes.map((noteItem) => (
                    <div key={noteItem.id} className="rounded-md border p-3">
                      <div className="text-sm text-slate-800">{noteItem.content}</div>
                      <div className="mt-2 text-xs text-slate-500">{noteItem.author} • {new Date(noteItem.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {engagementTimeline.length === 0 ? (
                <div className="text-sm text-slate-500">No activity yet.</div>
              ) : (
                <div className="space-y-3">
                  {engagementTimeline.map((event) => (
                    <div key={event.id} className="flex flex-col gap-2 rounded-md border px-3 py-3">
                      <div className="font-medium">{event.action}</div>
                      <div className="text-sm text-slate-500">{new Date(event.timestamp).toLocaleString()}</div>
                      {event.details && <div className="text-sm text-slate-600">{event.details}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  );
}
