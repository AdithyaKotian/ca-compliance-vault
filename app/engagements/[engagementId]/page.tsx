"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DashboardShell from "../../../components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

type EngagementRow = {
  id: string;
  firm_id: string | null;
  client_id: string;
  title: string;
  type: string;
  status: string;
  risk: string | null;
  due_date: string | null;
  priority: string | null;
  created_at: string | null;
};

type ClientRow = {
  id: string;
  firm_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  pan: string | null;
  gstin: string | null;
  address: string | null;
  risk_level: string | null;
  created_at: string | null;
};

type ChecklistItemRow = {
  id: string;
  engagement_id: string;
  title: string;
  description: string | null;
  status: string;
  requested_at: string | null;
  due_date: string | null;
  assigned_staff: string | null;
  created_at: string | null;
};

type DocumentRow = {
  id: string;
  engagement_id: string;
  title: string | null;
  file_name: string;
  file_type: string | null;
  status: string;
  uploaded_by: string | null;
  uploaded_at: string | null;
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

type NoteRow = {
  id: string;
  firm_id: string | null;
  client_id: string;
  engagement_id: string | null;
  body: string;
  created_by: string | null;
  created_at: string | null;
};

type AuditLogRow = {
  id: string;
  firm_id: string | null;
  client_id: string | null;
  engagement_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string | null;
};

function fmtINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN");
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
}

function getRiskVariant(risk: string | null) {
  if (risk === "High") return "destructive";
  if (risk === "Medium") return "secondary";
  return "default";
}

function getEngagementProgress(checklist: ChecklistItemRow[]) {
  if (checklist.length === 0) return 0;
  const completed = checklist.filter((item) => {
    const status = item.status.toLowerCase();
    return status === "approved" || status === "uploaded";
  }).length;
  return Math.min(100, Math.round((completed / checklist.length) * 100));
}

function metadataSummary(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "No metadata";
  try {
    const text = JSON.stringify(metadata);
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  } catch {
    return "Metadata unavailable";
  }
}

function CopyReminderButton({ clientId, clientName, engagementTitle, pendingItems }: { clientId?: string | null; clientName: string; engagementTitle: string; pendingItems: string[] }) {
  const message = useMemo(() => {
    if (pendingItems.length === 0) {
      return `Hi ${clientName}, your ${engagementTitle} is in progress. No new document uploads are pending right now.`;
    }
    return `Hi ${clientName}, your ${engagementTitle} is pending. Please upload the following documents: ${pendingItems.join(", ")}. You can share them through your CA Compliance Vault portal.`;
  }, [clientName, engagementTitle, pendingItems]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    try {
      const FIRM_ID = "11111111-1111-1111-1111-111111111111";
      await supabase.from("reminders").insert([{ firm_id: FIRM_ID, client_id: clientId ?? null, engagement_id: undefined, message, channel: "manual", status: "sent" }]);
    } catch {
      // ignore logging errors
    }
    toast.success("Reminder message copied");
  };

  return (
    <Button onClick={handleCopy} variant="outline" size="sm">
      <ClipboardCopy className="mr-2 h-4 w-4" />
      Copy WhatsApp Reminder
    </Button>
  );
}

export default function EngagementDetailPage() {
  const params = useParams();
  const engagementId = String(params?.engagementId ?? "");

  const [engagement, setEngagement] = useState<EngagementRow | null>(null);
  const [client, setClient] = useState<ClientRow | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItemRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [timeline, setTimeline] = useState<AuditLogRow[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(engagementId !== "");
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(engagementId === "");

  useEffect(() => {
    if (!engagementId) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);

      const engagementRes = await supabase.from("engagements").select("*").eq("id", engagementId).maybeSingle();
      if (engagementRes.error) {
        setError(engagementRes.error.message);
        setLoading(false);
        return;
      }

      const engagementRow = engagementRes.data as EngagementRow | null;
      if (!engagementRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const [clientRes, checklistRes, documentsRes, invoicesRes, notesRes, timelineRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", engagementRow.client_id).maybeSingle(),
        supabase.from("checklist_items").select("*").eq("engagement_id", engagementId),
        supabase.from("documents").select("*").eq("engagement_id", engagementId),
        supabase.from("invoices").select("*").eq("engagement_id", engagementId),
        supabase.from("notes").select("*").eq("engagement_id", engagementId),
        supabase.from("audit_logs").select("*").eq("engagement_id", engagementId),
      ]);

      const fetchError = clientRes.error || checklistRes.error || documentsRes.error || invoicesRes.error || notesRes.error || timelineRes.error;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setEngagement(engagementRow);
      setClient(clientRes.data as ClientRow | null);
      setChecklist((checklistRes.data ?? []) as ChecklistItemRow[]);
      setDocuments((documentsRes.data ?? []) as DocumentRow[]);
      setInvoice(((invoicesRes.data ?? []) as InvoiceRow[])[0] ?? null);
      setNotes((notesRes.data ?? []) as NoteRow[]);
      setTimeline((timelineRes.data ?? []) as AuditLogRow[]);
      setLoading(false);
    };

    void load();
  }, [engagementId]);

  const pendingItems = useMemo(
    () => checklist
      .filter((item) => {
        const status = item.status.toLowerCase();
        return status === "pending" || status === "requested";
      })
      .map((item) => item.title),
    [checklist]
  );

  const progress = useMemo(() => getEngagementProgress(checklist), [checklist]);
  const dueDays = engagement ? Math.max(0, Math.ceil((parseDate(engagement.due_date)?.getTime() ?? 0 - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  if (loading) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-3xl py-24">
          <Card>
            <CardHeader>
              <CardTitle>Loading engagement…</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Fetching engagement details from Supabase.</p>
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
              <CardTitle>Unable to load engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  if (notFound || !engagement) {
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
                <Badge variant={getRiskVariant(engagement.risk)}>{engagement.risk ?? "Unknown"}</Badge>
                {engagement.due_date ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Due {formatDate(engagement.due_date)}</span>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">No due date</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CopyReminderButton clientId={client?.id} clientName={client?.name ?? "Client"} engagementTitle={engagement.title} pendingItems={pendingItems} />
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
              <div className="text-3xl font-semibold">{dueDays}</div>
              <div className="text-sm text-slate-500">{engagement.due_date ? "Days remaining" : "No due date"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Status</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold">{fmtINR(invoice.amount)}</div>
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
                          <div className="text-sm text-slate-500">{item.requested_at ? `Requested ${formatDate(item.requested_at)}` : "No request date"}</div>
                        </div>
                        <Badge variant={item.status === "Rejected" ? "destructive" : item.status === "Approved" ? "secondary" : "outline"}>{item.status}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <Badge variant="outline">{importance}</Badge>
                        <span>{item.due_date ? `Due ${formatDate(item.due_date)}` : "No due date"}</span>
                        {item.assigned_staff && <span>Assigned to {item.assigned_staff}</span>}
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
                  {documents.map((doc) => (
                    <div key={doc.id} className="rounded-md border px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <div className="font-medium">{doc.file_name}</div>
                        <div className="text-sm text-slate-600">Uploaded by {doc.uploaded_by ?? "Unknown"} on {formatDate(doc.uploaded_at)}</div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant={doc.status === "Verified" ? "secondary" : doc.status === "Rejected" ? "destructive" : "default"}>{doc.status}</Badge>
                          <span>{doc.file_type ?? "Document"}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button size="sm" variant="outline" onClick={() => toast.success("File preview will be connected in Supabase Storage step.")}>View File</Button>
                      </div>
                    </div>
                  ))}
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
                  <div className="font-medium">{invoice.invoice_number}</div>
                  <div className="text-sm text-slate-600">Amount: {fmtINR(invoice.amount)}</div>
                  <div className="text-sm text-slate-600">Due {formatDate(invoice.due_date)}</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={invoice.status.toLowerCase() === "overdue" ? "destructive" : invoice.status.toLowerCase() === "paid" ? "secondary" : "default"}>{invoice.status}</Badge>
                    {invoice.payment_link ? (
                      <>
                        <a href={invoice.payment_link} target="_blank" rel="noreferrer">
                          <Button size="sm">Open Payment</Button>
                        </a>
                        <Button size="sm" variant="outline" onClick={async () => {
                          await navigator.clipboard.writeText(invoice.payment_link ?? "");
                          toast.success("Payment link copied");
                        }}>
                          Copy Payment Link
                        </Button>
                      </>
                    ) : (
                      <div className="text-sm text-slate-500">No payment link available.</div>
                    )}
                  </div>
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
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="text-sm text-slate-500">No notes yet.</div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((noteItem) => (
                      <div key={noteItem.id} className="rounded-md border p-3">
                        <div className="text-sm text-slate-800">{noteItem.body}</div>
                        <div className="mt-2 text-xs text-slate-500">{noteItem.created_by ?? "Firm staff"} • {formatDateTime(noteItem.created_at)}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700">Add note</label>
                  <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Write a comment or internal note" />
                  <div className="mt-2">
                    <Button onClick={async () => {
                      if (!newNote.trim()) {
                        toast.error("Note cannot be empty");
                        return;
                      }
                      const FIRM_ID = "11111111-1111-1111-1111-111111111111";
                      try {
                        const { data: inserted, error: insertErr } = await supabase.from("notes").insert([{ firm_id: FIRM_ID, client_id: client?.id ?? "", engagement_id: engagement.id, body: newNote.trim(), created_by: null }]).select().single();
                        if (insertErr) {
                          toast.error(insertErr.message || "Failed to add note");
                          return;
                        }

                        await supabase.from("audit_logs").insert([{ firm_id: FIRM_ID, client_id: client?.id ?? null, engagement_id: engagement.id, action: "note_added", metadata: { note_id: inserted.id }, created_by: null }]);

                        const { data: refreshedNotes } = await supabase.from("notes").select("*").eq("engagement_id", engagement.id);
                        setNotes(refreshedNotes ?? []);

                        const { data: refreshedTimeline } = await supabase.from("audit_logs").select("*").eq("engagement_id", engagement.id);
                        setTimeline(refreshedTimeline ?? []);

                        setNewNote("");
                        toast.success("Note added");
                      } catch (err) {
                        const message = err instanceof Error ? err.message : "Note creation error";
                        toast.error(message);
                      }
                    }}>Add Note</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="text-sm text-slate-500">No activity yet.</div>
              ) : (
                <div className="space-y-3">
                  {timeline.map((event) => (
                    <div key={event.id} className="flex flex-col gap-2 rounded-md border px-3 py-3">
                      <div className="font-medium">{event.action}</div>
                      <div className="text-sm text-slate-500">{formatDateTime(event.created_at)}</div>
                      <div className="text-sm text-slate-600">{metadataSummary(event.metadata)}</div>
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
