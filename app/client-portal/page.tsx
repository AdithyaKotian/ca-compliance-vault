"use client"

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  firm,
  getClientById,
  getClientEngagements,
  getEngagementChecklist,
  getEngagementDocuments,
  getEngagementProgress,
  getClientInvoices,
  type Engagement,
  type ChecklistItem,
} from "../../lib/mock-data";

export default function ClientPortalPage() {
  const clientId = "client_abc"; // ABC Traders
  const client = useMemo(() => getClientById(clientId), [clientId]);

  const engagements = useMemo(() => (client ? getClientEngagements(client.id) : []), [client]);

  const activeEngagement = useMemo<Engagement | undefined>(() => {
    if (!engagements || engagements.length === 0) return undefined;
    return (
      engagements.find((e) => e.status === "Waiting for Client" || e.status === "In Review") || engagements[0]
    );
  }, [engagements]);

  const checklist = useMemo(() => (activeEngagement ? getEngagementChecklist(activeEngagement.id) : []), [activeEngagement]);
  const pendingDocs = checklist.filter((c) => c.status === "Pending" || c.status === "Requested");
  const approvalItems = checklist.filter((c) => c.status === "Uploaded");

  const documents = useMemo(() => (activeEngagement ? getEngagementDocuments(activeEngagement.id) : []), [activeEngagement]);

  const progress = activeEngagement ? getEngagementProgress(activeEngagement.id) : 0;

  const invoices = useMemo(() => (client ? getClientInvoices(client.id) : []), [client]);
  const unpaidInvoice = invoices.find((inv) => inv.engagementId === activeEngagement?.id && inv.status !== "Paid") ?? undefined;

  const [comment, setComment] = useState("");

  const handleUploadClick = () => toast.success("Document upload will be connected in Supabase Storage step.");
  const handleApprove = () => toast.success("Approval workflow will be connected in Supabase step.");
  const handlePayNow = (link?: string) => {
    if (link) {
      window.open(link, "_blank");
    } else {
      toast.error("Payment link is not attached yet.");
    }
  };
  const handleSendComment = () => {
    toast.success("Client comments will be connected in Supabase step.");
    setComment("");
  };

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
          <h1 className="text-2xl font-semibold">Welcome, {client?.name ?? "Client"}</h1>
          <p className="mt-2 text-sm text-slate-600">Here is what your CA firm needs from you to complete your current work.</p>
          <p className="mt-3 text-sm text-slate-500">Your documents and approvals are shared securely with your CA firm.</p>
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
                      <div className="text-sm text-slate-600">Due {new Date(activeEngagement.dueDate).toLocaleDateString("en-IN")}</div>
                    </div>
                    <Badge variant={activeEngagement.status === "Overdue" ? "destructive" : "secondary"}>{activeEngagement.status}</Badge>
                  </div>

                  <div className="text-sm text-slate-600">Progress: {progress}%</div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
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
                <div className="text-sm text-slate-600">No active engagement found.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingDocs.length === 0 ? (
                <div className="text-sm text-slate-600">No pending documents.</div>
              ) : (
                <div className="space-y-3">
                  {pendingDocs.map((item: ChecklistItem) => (
                    <div key={item.id} className="rounded-md border px-3 py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-slate-600">{item.requestedAt ? `Requested on ${new Date(item.requestedAt).toLocaleDateString("en-IN")}` : "Requested"}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={item.status === "Requested" ? "destructive" : "outline"}>{item.status}</Badge>
                          <Button size="sm" variant="outline" onClick={handleUploadClick}>Upload</Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-500">Due {item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-IN") : "—"}</div>
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
              {documents.length === 0 ? (
                <div className="text-sm text-slate-600">No documents uploaded yet.</div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const related = checklist.find((c) => c.engagementId === doc.engagementId && doc.title.toLowerCase().includes(c.title.toLowerCase().split(" ")[0]));
                    return (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div>
                          <div className="font-medium">{doc.fileName}</div>
                          <div className="text-sm text-slate-600">Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN") : "—"}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={doc.status === "Verified" ? "secondary" : doc.status === "Rejected" ? "destructive" : "outline"}>{doc.status}</Badge>
                          <div className="text-sm text-slate-500">{related ? related.title : "—"}</div>
                        </div>
                      </div>
                    );
                  })}
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
                <div className="space-y-3">
                  <div className="text-sm text-slate-700">Confirm GST filing summary</div>
                  <div className="mt-3">
                    <Button onClick={handleApprove}>Approve</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvalItems.map((item) => (
                    <div key={item.id} className="rounded-md border px-3 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-slate-600">{item.dueDate ? `Due ${new Date(item.dueDate).toLocaleDateString("en-IN")}` : "—"}</div>
                      </div>
                      <div>
                        <Button onClick={handleApprove}>Approve</Button>
                      </div>
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
                  <div className="font-medium">{unpaidInvoice.number}</div>
                  <div className="text-sm text-slate-600">Amount: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(unpaidInvoice.amountINR)}</div>
                  <div className="text-sm text-slate-600">Due {new Date(unpaidInvoice.dueDate).toLocaleDateString("en-IN")}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={unpaidInvoice.status === "Overdue" ? "destructive" : "outline"}>{unpaidInvoice.status}</Badge>
                    <Button onClick={() => handlePayNow(unpaidInvoice.paymentLink)}>Pay Now</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600">No unpaid invoices.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">If you are unsure which document to upload, leave a comment for your CA firm.</div>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Type your message..." />
                <div>
                  <Button onClick={handleSendComment}>Send Comment</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
