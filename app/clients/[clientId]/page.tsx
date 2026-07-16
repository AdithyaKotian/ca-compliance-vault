"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN");
}

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

const firm = {
  name: "CA Compliance Vault",
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export default function ClientPortalPage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id') || searchParams.get('id') || "";
  
  const [client, setClient] = useState<ClientRow | null>(null);
  const [engagements, setEngagements] = useState<EngagementRow[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!clientId) {
        setError("No client ID provided. Please use a valid client portal link.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch client by ID
        const clientRes = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .maybeSingle();
        
        if (clientRes.error) throw clientRes.error;
        
        if (!clientRes.data) {
          setError(`Client not found. Please check your portal link and try again.`);
          setLoading(false);
          return;
        }

        const clientData = clientRes.data as ClientRow;
        setClient(clientData);

        // Fetch engagements for this client
        const engagementsRes = await supabase
          .from("engagements")
          .select("*")
          .eq("client_id", clientData.id);
        
        if (engagementsRes.error) throw engagementsRes.error;
        const engagementRows = (engagementsRes.data ?? []) as EngagementRow[];

        let checklistRows: ChecklistItemRow[] = [];
        if (engagementRows.length > 0) {
          const engagementIds = engagementRows.map((e) => e.id);
          const checklistRes = await supabase
            .from("checklist_items")
            .select("*")
            .in("engagement_id", engagementIds);
          
          if (checklistRes.error) throw checklistRes.error;
          checklistRows = (checklistRes.data ?? []) as ChecklistItemRow[];
        }

        const [documentsRes, invoicesRes] = await Promise.all([
          supabase.from("documents").select("*").eq("client_id", clientData.id),
          supabase.from("invoices").select("*").eq("client_id", clientData.id),
        ]);
        
        if (documentsRes.error) throw documentsRes.error;
        if (invoicesRes.error) throw invoicesRes.error;

        setEngagements(engagementRows);
        setChecklistItems(checklistRows);
        setDocuments((documentsRes.data ?? []) as DocumentRow[]);
        setInvoices((invoicesRes.data ?? []) as InvoiceRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load client portal data. Please try again later.");
        setLoading(false);
        return;
      }

      setLoading(false);
    };

    void load();
  }, [clientId]);

  const activeEngagement = useMemo<EngagementRow | undefined>(() => {
    return engagements.find((e) => e.status === "Waiting for Client" || e.status === "In Review") || engagements[0];
  }, [engagements]);

  const checklist = useMemo(
    () => (activeEngagement ? checklistItems.filter((item) => item.engagement_id === activeEngagement.id) : []),
    [activeEngagement, checklistItems]
  );

  const pendingDocs = useMemo(
    () => checklist.filter((c) => c.status === "Pending" || c.status === "Requested"),
    [checklist]
  );

  const approvalItems = useMemo(
    () => checklist.filter((c) => c.status === "Uploaded"),
    [checklist]
  );

  const documentsForEngagement = useMemo(
    () => (activeEngagement ? documents.filter((doc) => doc.engagement_id === activeEngagement.id) : []),
    [activeEngagement, documents]
  );

  const progress = useMemo(() => {
    if (!activeEngagement) return 0;
    const completedItems = checklist.filter(c => c.status === "Approved" || c.status === "Verified").length;
    const totalItems = checklist.length;
    return totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 0;
  }, [activeEngagement, checklist]);

  const unpaidInvoice = useMemo(
    () => invoices.find((inv) => inv.engagement_id === activeEngagement?.id && inv.status !== "Paid"),
    [activeEngagement, invoices]
  );

  const handleUploadClick = (itemId?: string) => {
    toast.success(`Document upload initiated for ${itemId ? `item ${itemId}` : 'document'}. Storage integration coming soon.`);
  };

  const handleApprove = (itemId?: string) => {
    toast.success(`Approval ${itemId ? `for item ${itemId}` : ''} recorded. Workflow integration coming soon.`);
  };

  const handlePayNow = (link?: string) => {
    if (link) {
      window.open(link, "_blank");
    } else {
      toast.error("Payment link is not configured yet. Please contact your CA firm.");
    }
  };

  const handleSendComment = async () => {
    if (!comment.trim()) {
      toast.error("Please enter a message before sending.");
      return;
    }
    
    const FIRM_ID = "11111111-1111-1111-1111-111111111111";
    
    try {
      const { data: inserted, error } = await supabase
        .from("notes")
        .insert([{
          firm_id: FIRM_ID,
          client_id: clientId,
          engagement_id: activeEngagement?.id ?? null,
          body: comment.trim(),
          created_by: null
        }])
        .select()
        .single();
      
      if (error) {
        toast.error(error.message || "Failed to send message. Please try again.");
        return;
      }

      await supabase
        .from("audit_logs")
        .insert([{
          firm_id: FIRM_ID,
          client_id: clientId,
          engagement_id: activeEngagement?.id ?? null,
          action: "note_added",
          metadata: { note_id: inserted.id },
          created_by: null
        }]);
      
      setComment("");
      toast.success("Message sent successfully to your CA firm.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="h-6 w-40 rounded bg-slate-200 animate-pulse" />
            <div className="mt-3 h-4 w-64 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="h-4 w-32 rounded bg-slate-200 animate-pulse mb-4" />
                <div className="space-y-3">
                  <div className="h-3 w-full rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl py-24">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Unable to Load Client Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">{error}</p>
              <Link href="/">
                <Button variant="outline" className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Return to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl py-24">
          <Card>
            <CardHeader>
              <CardTitle>Client Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                We couldn&apos;t find your client information. Please check your portal link or contact your CA firm for assistance.
              </p>
              <Link href="/">
                <Button variant="outline" className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Return to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <nav className="mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-slate-700" />
          <div>
            <div className="font-semibold">CA Compliance Vault</div>
            <div className="text-sm text-slate-600">{firm.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Secure Client Portal</Badge>
          <Link href="/">
            <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto mt-6 max-w-4xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Welcome, {client.name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Here is what your CA firm needs from you to complete your current work.
          </p>
          {client.email && (
            <p className="mt-1 text-sm text-slate-500">
              Account: {client.email}
            </p>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {activeEngagement ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{activeEngagement.title}</div>
                      <div className="text-sm text-slate-600">
                        Due {activeEngagement.due_date ? formatDate(activeEngagement.due_date) : "—"}
                      </div>
                    </div>
                    <Badge variant={activeEngagement.status === "Overdue" ? "destructive" : "secondary"}>
                      {activeEngagement.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-600">Progress: {progress}%</div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div 
                      className="h-full rounded-full bg-slate-900 transition-all duration-300" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">Pending documents</div>
                    <div className="font-medium">{pendingDocs.length}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">Approvals needed</div>
                    <div className="font-medium">{approvalItems.length}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600">
                  No active engagements found. Please contact your CA firm for updates.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingDocs.length === 0 ? (
                <div className="text-sm text-slate-600">
                  No pending documents. Great job!
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingDocs.map((item) => (
                    <div key={item.id} className="rounded-md border px-3 py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-slate-600">
                            {item.requested_at ? `Requested on ${formatDate(item.requested_at)}` : "Requested"}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={item.status === "Requested" ? "destructive" : "outline"}>
                            {item.status}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleUploadClick(item.id)}
                          >
                            Upload
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        Due {item.due_date ? formatDate(item.due_date) : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documentsForEngagement.length === 0 ? (
                <div className="text-sm text-slate-600">
                  No documents uploaded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {documentsForEngagement.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium">{doc.file_name}</div>
                        <div className="text-sm text-slate-600">
                          Uploaded {doc.uploaded_at ? formatDate(doc.uploaded_at) : "—"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={
                            doc.status === "Verified" ? "secondary" : 
                            doc.status === "Rejected" ? "destructive" : 
                            "outline"
                          }
                        >
                          {doc.status}
                        </Badge>
                        <div className="text-sm text-slate-500">{doc.title ?? "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Approvals Needed</CardTitle>
            </CardHeader>
            <CardContent>
              {approvalItems.length === 0 ? (
                <div className="text-sm text-slate-600">
                  No pending approvals at this time.
                </div>
              ) : (
                <div className="space-y-3">
                  {approvalItems.map((item) => (
                    <div key={item.id} className="rounded-md border px-3 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-slate-600">
                          {item.due_date ? `Due ${formatDate(item.due_date)}` : "—"}
                        </div>
                      </div>
                      <Button onClick={() => handleApprove(item.id)}>Approve</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice / Payment</CardTitle>
            </CardHeader>
            <CardContent>
              {unpaidInvoice ? (
                <div className="space-y-3">
                  <div className="font-medium">{unpaidInvoice.invoice_number}</div>
                  <div className="text-sm text-slate-600">
                    Amount: {formatINR(unpaidInvoice.amount)}
                  </div>
                  <div className="text-sm text-slate-600">
                    Due {unpaidInvoice.due_date ? formatDate(unpaidInvoice.due_date) : "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={unpaidInvoice.status === "Overdue" ? "destructive" : "outline"}>
                      {unpaidInvoice.status}
                    </Badge>
                    <Button onClick={() => handlePayNow(unpaidInvoice.payment_link ?? undefined)}>
                      Pay Now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600">
                  No unpaid invoices. All caught up!
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">
                  If you&apos;re unsure which document to upload or have questions about your engagement, leave a message for your CA firm.
                </div>
                <Textarea 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  placeholder="Type your message here..." 
                  rows={3}
                />
                <Button 
                  onClick={handleSendComment}
                  disabled={!comment.trim()}
                  className="w-full"
                >
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}