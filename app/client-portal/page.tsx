"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  CreditCard,
  Send,
  FileText,
  AlertCircle,
  LogOut,
  Loader2,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers/profile-provider";
import PortalDocumentUpload from "@/components/portal/document-upload";

type ClientData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  pan: string | null;
  gstin: string | null;
  address: string | null;
};

type EngagementData = {
  id: string;
  title: string;
  type: string;
  status: string;
  due_date: string | null;
  priority: string | null;
};

type ChecklistItemData = {
  id: string;
  engagement_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  required: boolean | null;
};

type DocumentData = {
  id: string;
  engagement_id: string | null;
  title: string | null;
  file_name: string;
  file_path: string | null;
  file_url: string | null;
  file_size: number | null;
  status: string;
  uploaded_at: string | null;
};

type InvoiceData = {
  id: string;
  invoice_number: string;
  amount: number;
  tax: number | null;
  total_amount: number | null;
  status: string;
  due_date: string | null;
  payment_link: string | null;
};

type NoteData = {
  id: string;
  body: string;
  created_at: string;
  created_by?: string | null;
};

const FIRM_ID = "11111111-1111-1111-1111-111111111111";

function fmtINR(amount?: number | null) {
  if (amount === undefined || amount === null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ClientPortalPage() {
  const router = useRouter();
  const { loading: profileLoading } = useProfile();

  const [client, setClient] = useState<ClientData | null>(null);
  const [clientId, setClientId] = useState<string>("");
  const [engagements, setEngagements] = useState<EngagementData[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [targetEngagementId, setTargetEngagementId] = useState<string | null>(null);
  const [targetChecklistId, setTargetChecklistId] = useState<string | null>(null);
  const [targetChecklistTitle, setTargetChecklistTitle] = useState<string | null>(null);

  // Messaging state
  const [newComment, setNewComment] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);

  const loadPortalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        router.push("/login");
        return;
      }

      // Query profile to obtain client_id securely
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      let targetClientId = profile?.client_id || null;

      // If no client_id in profile, find client by email
      if (!targetClientId && user.email) {
        const { data: clientByEmail } = await supabase
          .from("clients")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        targetClientId = clientByEmail?.id || null;

        // Auto-link client_id in profile for subsequent queries
        if (targetClientId) {
          await supabase
            .from("profiles")
            .update({ client_id: targetClientId, role: "client" })
            .eq("id", user.id);
        }
      }

      // If user is firm admin previewing portal, resolve first available client
      if (!targetClientId && profile?.role !== "client") {
        const { data: firstClient } = await supabase
          .from("clients")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        targetClientId = firstClient?.id || null;
      }

      if (!targetClientId) {
        setError("No client found for this account. Please contact your CA firm.");
        setLoading(false);
        return;
      }

      setClientId(targetClientId);

      // Fetch all client data filtered strictly by targetClientId
      const [clientRes, engRes, docRes, invRes, notesRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", targetClientId).maybeSingle(),
        supabase.from("engagements").select("*").eq("client_id", targetClientId),
        supabase.from("documents").select("*").eq("client_id", targetClientId),
        supabase.from("invoices").select("*").eq("client_id", targetClientId),
        supabase.from("notes").select("*").eq("client_id", targetClientId).order("created_at", { ascending: false }),
      ]);

      if (clientRes.error) throw clientRes.error;
      if (!clientRes.data) {
        setError("Client record not found in the vault. Please verify your account setup with your CA firm.");
        setLoading(false);
        return;
      }

      setClient(clientRes.data);
      setEngagements(engRes.data ?? []);
      setDocuments(docRes.data ?? []);
      setInvoices(invRes.data ?? []);
      setNotes(notesRes.data ?? []);

      // Fetch checklist items for client engagements
      const engIds = (engRes.data ?? []).map((e) => e.id);
      if (engIds.length > 0) {
        const { data: items } = await supabase
          .from("checklist_items")
          .select("*")
          .in("engagement_id", engIds);
        setChecklistItems(items ?? []);
      } else {
        setChecklistItems([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portal data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadPortalData();
  }, [loadPortalData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !client) return;

    setIsSendingComment(true);
    try {
      const activeEngagement = engagements[0];
      const { data: inserted, error: noteErr } = await supabase
        .from("notes")
        .insert([
          {
            firm_id: FIRM_ID,
            client_id: client.id,
            engagement_id: activeEngagement?.id || null,
            body: newComment.trim(),
          },
        ])
        .select()
        .single();

      if (noteErr) {
        toast.error(noteErr.message || "Failed to send message");
        return;
      }

      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: client.id,
          engagement_id: activeEngagement?.id || null,
          action: "client_message_sent",
          metadata: { note_id: inserted.id },
          created_by: null,
        },
      ]);

      setNotes((prev) => [inserted, ...prev]);
      setNewComment("");
      toast.success("Message sent to your CA team");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error sending message");
    } finally {
      setIsSendingComment(false);
    }
  };

  // Metrics
  const pendingDocsCount = checklistItems.filter((i) =>
    ["pending", "requested"].includes(i.status.toLowerCase())
  ).length;

  const totalChecklistCount = checklistItems.length;
  const approvedChecklistCount = checklistItems.filter((i) =>
    ["approved", "verified", "uploaded"].includes(i.status.toLowerCase())
  ).length;
  const overallProgress =
    totalChecklistCount > 0
      ? Math.round((approvedChecklistCount / totalChecklistCount) * 100)
      : 100;

  const unpaidInvoices = invoices.filter((i) =>
    ["sent", "overdue"].includes(i.status.toLowerCase())
  );
  const totalUnpaid = unpaidInvoices.reduce(
    (sum, i) => sum + (i.total_amount ?? i.amount),
    0
  );

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-sm font-medium text-slate-600">
            Accessing secure client vault...
          </p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200 bg-white">
          <CardHeader>
            <CardTitle className="text-red-700">Client Portal Access</CardTitle>
            <CardDescription>{error || "Client record not found."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => void loadPortalData()} className="w-full">
              Retry
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">CA Compliance Vault</div>
              <div className="text-[11px] text-slate-500">Client Portal • Kotian &amp; Co.</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-slate-800">{client.name}</div>
              <div className="text-[10px] text-slate-500 font-mono">
                {client.pan ? `PAN: ${client.pan}` : "Verified Account"}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                Active Compliance Vault
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome, {client.name}
              </h1>
              <p className="text-sm text-slate-300">
                Review your active filings, pending document requests, and invoices.
              </p>
            </div>

            <Button
              onClick={() => {
                setTargetEngagementId(engagements[0]?.id || null);
                setTargetChecklistId(null);
                setTargetChecklistTitle(null);
                setUploadOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 shadow-sm"
            >
              <Upload className="h-4 w-4" /> Upload Document
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Document Checklist Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">
                  {overallProgress}%
                </span>
                <span className="text-xs text-slate-500">
                  {approvedChecklistCount} of {totalChecklistCount} completed
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Pending Files Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {pendingDocsCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Documents requested by your CA team
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Outstanding Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {fmtINR(totalUnpaid)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {unpaidInvoices.length} unpaid bill(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Portal Tabs Navigation */}
        <Tabs defaultValue="engagements" className="space-y-4">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="engagements" className="text-xs font-medium gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Active Filings &amp; Checklist
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs font-medium gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Uploaded Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs font-medium gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Invoices &amp; Payments ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs font-medium gap-1.5">
              <Send className="h-3.5 w-3.5" /> Contact CA ({notes.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Engagements & Checklist */}
          <TabsContent value="engagements" className="space-y-4">
            {engagements.length === 0 ? (
              <Card className="border-slate-200 text-center py-12">
                <CardContent className="text-slate-500 text-sm">
                  No active filings currently scheduled for your account.
                </CardContent>
              </Card>
            ) : (
              engagements.map((eng) => {
                const engChecklist = checklistItems.filter(
                  (i) => i.engagement_id === eng.id
                );

                return (
                  <Card key={eng.id} className="border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{eng.title}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {eng.type}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">
                            Due Date:{" "}
                            <span className="font-semibold text-slate-700">
                              {formatDate(eng.due_date)}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge
                          className={
                            eng.status.toLowerCase() === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {eng.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Required Documents &amp; Tasks:
                      </h4>

                      {engChecklist.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          All initial requirements cleared.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {engChecklist.map((item) => {
                            const isUploaded =
                              item.status.toLowerCase() === "uploaded" ||
                              item.status.toLowerCase() === "approved" ||
                              item.status.toLowerCase() === "verified";

                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                              >
                                <div className="flex items-center gap-3">
                                  {isUploaded ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                                  )}
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">
                                      {item.title}
                                    </div>
                                    {item.description && (
                                      <div className="text-xs text-slate-500">
                                        {item.description}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  {isUploaded ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                      {item.status}
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs gap-1"
                                      onClick={() => {
                                        setTargetEngagementId(eng.id);
                                        setTargetChecklistId(item.id);
                                        setTargetChecklistTitle(item.title);
                                        setUploadOpen(true);
                                      }}
                                    >
                                      <Upload className="h-3.5 w-3.5" /> Upload File
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Tab 2: Uploaded Documents */}
          <TabsContent value="documents">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Document Vault Repository</CardTitle>
                <CardDescription>
                  All files securely stored and accessible by your CA team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No documents uploaded yet. Click &quot;Upload Document&quot; above to begin.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-6 w-6 text-slate-500 shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {doc.title || doc.file_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatDate(doc.uploaded_at)} • {doc.file_name}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={
                            doc.status.toLowerCase() === "verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Invoices */}
          <TabsContent value="invoices">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Invoices &amp; Fee Statements</CardTitle>
                <CardDescription>
                  View and settle professional fees and compliance filing retainers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No invoices generated for your account.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {invoices.map((inv) => {
                      const total = inv.total_amount ?? (inv.amount + (inv.tax || 0));
                      const isPaid = inv.status.toLowerCase() === "paid";

                      return (
                        <div
                          key={inv.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-slate-900">
                                {inv.invoice_number}
                              </span>
                              <Badge
                                className={
                                  isPaid
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }
                              >
                                {inv.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Due: {formatDate(inv.due_date)}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-base font-bold text-slate-900">
                              {fmtINR(total)}
                            </span>
                            {!isPaid && inv.payment_link && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
                                onClick={() => window.open(inv.payment_link!, "_blank")}
                              >
                                <CreditCard className="h-3.5 w-3.5" /> Pay Now
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Messages with CA Firm */}
          <TabsContent value="messages">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">CA Communication Thread</CardTitle>
                <CardDescription>
                  Send queries, notes, and instructions directly to your assigned CA.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSendComment} className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your message or query here..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isSendingComment || !newComment.trim()}>
                      {isSendingComment ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-1.5 h-3.5 w-3.5" /> Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  {notes.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">
                      No message history yet. Send a note above to initiate communication.
                    </p>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-semibold text-slate-700">Client Note</span>
                          <span>{formatDate(note.created_at)}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed">{note.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Document Upload Modal */}
        <PortalDocumentUpload
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          clientId={clientId || client.id}
          engagementId={targetEngagementId}
          checklistItemId={targetChecklistId}
          checklistItemTitle={targetChecklistTitle}
          onSuccess={() => void loadPortalData()}
        />
      </main>
    </div>
  );
}