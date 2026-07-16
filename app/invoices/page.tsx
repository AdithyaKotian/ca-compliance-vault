"use client"

import { useEffect, useMemo, useState } from "react";
// Link not used in this page
import DashboardShell from "../../components/layout/dashboard-shell";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ClipboardCopy, Search, PlusCircle, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

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

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

type InvoiceRow = {
  id: string;
  firm_id: string | null;
  client_id: string;
  engagement_id: string | null;
  invoice_number: string;
  number?: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string | null;
  payment_link: string | null;
  issued_at: string | null;
  created_at: string | null;
};

type InvoiceFilter = "All" | InvoiceStatus;
const invoiceStatuses: InvoiceFilter[] = ["All", "Draft", "Sent", "Paid", "Overdue"];

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (date?: string) => {
  if (!date) return "-";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const statusVariant = (status: InvoiceStatus) => {
  if (status === "Paid") return "secondary" as const;
  if (status === "Overdue") return "destructive" as const;
  if (status === "Draft") return "outline" as const;
  return "default" as const;
};

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceFilter>("All");
  const [selectedClientId] = useState<string>("all");
  const [selectedEngagementId] = useState<string>("all");
  const [newClientId, setNewClientId] = useState<string>("all");
  const [newEngagementId, setNewEngagementId] = useState<string>("all");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [engagements, setEngagements] = useState<EngagementRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const [clientsRes, engagementsRes, invoicesRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("engagements").select("*"),
        supabase.from("invoices").select("*"),
      ]);

      const fetchError = clientsRes.error || engagementsRes.error || invoicesRes.error;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const clientRows = (clientsRes.data ?? []) as ClientRow[];
      const engagementRows = (engagementsRes.data ?? []) as EngagementRow[];
      const invoiceRows = (invoicesRes.data ?? []) as InvoiceRow[];

      setClients(clientRows);
      setEngagements(engagementRows);
      setInvoices(invoiceRows);
      setNewClientId(clientRows[0]?.id ?? "all");
      setNewEngagementId(engagementRows.find((engagement) => engagement.client_id === clientRows[0]?.id)?.id ?? "all");
      setLoading(false);
    };

    void load();
  }, []);

  // filteredEngagements not currently required in invoices page

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const engagement = invoice.engagement_id ? engagements.find((eng) => eng.id === invoice.engagement_id) : undefined;
      const client = clients.find((clientRow) => clientRow.id === invoice.client_id);
      if (selectedClientId !== "all" && invoice.client_id !== selectedClientId) return false;
      if (selectedEngagementId !== "all" && invoice.engagement_id !== selectedEngagementId) return false;
      if (statusFilter !== "All" && invoice.status !== statusFilter) return false;
      if (!normalizedSearch) return true;
      const values = [invoice.invoice_number ?? invoice.number ?? "", client?.name ?? "", engagement?.title ?? ""];
      return values.some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [searchTerm, selectedClientId, selectedEngagementId, statusFilter, invoices, engagements, clients]);

  const followUpInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "Sent" || invoice.status === "Overdue"),
    [invoices]
  );

  const totalInvoiced = useMemo(
    () => invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    [invoices]
  );

  const unpaidAmount = useMemo(
    () => invoices.filter((invoice) => invoice.status === "Sent").reduce((sum, invoice) => sum + invoice.amount, 0),
    [invoices]
  );

  const overdueAmount = useMemo(
    () => invoices.filter((invoice) => invoice.status === "Overdue").reduce((sum, invoice) => sum + invoice.amount, 0),
    [invoices]
  );

  const paidThisMonth = useMemo(
    () => invoices
      .filter((invoice) => {
        if (invoice.status !== "Paid") return false;
        if (!invoice.issued_at) return false;
        const issued = new Date(invoice.issued_at);
        const now = new Date();
        return issued.getMonth() === now.getMonth() && issued.getFullYear() === now.getFullYear();
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0),
    [invoices]
  );

  const invoiceEngagementOptions = useMemo(
    () => engagements.filter((engagement) => engagement.client_id === newClientId),
    [engagements, newClientId]
  );

  const handleCopyLink = async (link?: string) => {
    if (link) {
      await navigator.clipboard.writeText(link);
      toast.success("Payment link copied");
    } else {
      toast.error("No payment link attached");
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    if (!invoiceId) {
      toast.error("Invoice id missing");
      return;
    }
    const FIRM_ID = "11111111-1111-1111-1111-111111111111";
    try {
      const { error } = await supabase.from("invoices").update({ status: "Paid" }).eq("id", invoiceId);
      if (error) {
        toast.error(error.message || "Failed to mark paid");
        return;
      }
      await supabase.from("audit_logs").insert([{ firm_id: FIRM_ID, action: "invoice_marked_paid", metadata: { invoice_id: invoiceId }, created_by: null }]);
      const { data: refreshed } = await supabase.from("invoices").select("*");
      setInvoices((refreshed ?? []) as InvoiceRow[]);
      toast.success("Invoice marked paid");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mark paid error";
      toast.error(message);
    }
  };

  const handleCreateInvoice = () => {
    (async () => {
      if (!invoiceNumber.trim() || !amount) {
        toast.error("Invoice number and amount are required");
        return;
      }
      const FIRM_ID = "11111111-1111-1111-1111-111111111111";
      try {
        const { data: created, error } = await supabase.from("invoices").insert([{ firm_id: FIRM_ID, client_id: newClientId, engagement_id: newEngagementId === "all" ? null : newEngagementId, invoice_number: invoiceNumber.trim(), amount: Number(amount), due_date: dueDate || null, payment_link: paymentLink || null, status: "Sent" }]).select().single();
        if (error) {
          toast.error(error.message || "Failed to create invoice");
          return;
        }
        await supabase.from("audit_logs").insert([{ firm_id: FIRM_ID, client_id: newClientId, engagement_id: newEngagementId === "all" ? null : newEngagementId, action: "invoice_created", metadata: { invoice_id: created.id }, created_by: null }]);
        const { data: refreshed } = await supabase.from("invoices").select("*");
        setInvoices((refreshed ?? []) as InvoiceRow[]);
        toast.success("Invoice created");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invoice creation error";
        toast.error(message);
      }
    })();
  };

  const handleNewClientChange = (clientId: string) => {
    setNewClientId(clientId);
    const firstEngagement = engagements.find((engagement) => engagement.client_id === clientId);
    setNewEngagementId(firstEngagement?.id ?? "all");
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <header className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/50">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
              <p className="text-sm text-slate-600">Loading invoice data from Supabase.</p>
            </div>
          </header>
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
              <CardTitle>Unable to load invoices</CardTitle>
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
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Invoices</div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Invoices</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Track unpaid invoices, overdue payments, and payment links across every client engagement.
              </p>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
                <DialogDescription>
                  This is a mock invoice creation flow. The saved invoice will connect to Supabase later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Client</label>
                    <Select value={newClientId} onValueChange={handleNewClientChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Client</SelectLabel>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Engagement</label>
                    <Select value={newEngagementId} onValueChange={setNewEngagementId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select engagement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Engagement</SelectLabel>
                          {invoiceEngagementOptions.length > 0 ? (
                            invoiceEngagementOptions.map((engagement) => (
                              <SelectItem key={engagement.id} value={engagement.id}>{engagement.title}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="all" disabled>No engagements available</SelectItem>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Invoice number</label>
                    <Input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="Enter invoice number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Amount</label>
                    <Input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Due date</label>
                    <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Payment link</label>
                    <Input value={paymentLink} onChange={(event) => setPaymentLink(event.target.value)} placeholder="https://" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Notes</label>
                  <Textarea value={invoiceNotes} onChange={(event) => setInvoiceNotes(event.target.value)} placeholder="Any additional invoice notes" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className="w-full" onClick={handleCreateInvoice}>Create Invoice</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Invoiced</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{formatINR(totalInvoiced)}</p>
              <CardDescription>All invoices generated across clients.</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Unpaid Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{formatINR(unpaidAmount)}</p>
              <CardDescription>Amount billed and awaiting payment.</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Overdue Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{formatINR(overdueAmount)}</p>
              <CardDescription>Past due invoices requiring follow-up.</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Paid This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{formatINR(paidThisMonth)}</p>
              <CardDescription>Invoices paid in the current month.</CardDescription>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-2xl bg-slate-100 p-2 text-slate-500">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search invoices, clients, engagements..."
                  className="min-w-0"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
              {invoiceStatuses.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
          <CardHeader className="px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Invoice Ledger</CardTitle>
                <CardDescription>View current billing status and payment links for every engagement.</CardDescription>
              </div>
              <div className="text-sm text-slate-500">{filteredInvoices.length} results</div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No invoices found.</div>
            ) : (
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Link</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const client = clients.find((clientRow) => clientRow.id === invoice.client_id);
                    const engagement = invoice.engagement_id ? engagements.find((eng) => eng.id === invoice.engagement_id) : undefined;
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-slate-900">{invoice.invoice_number ?? invoice.number ?? "—"}</TableCell>
                        <TableCell>{client?.name ?? "Unknown"}</TableCell>
                        <TableCell>{engagement?.title ?? "—"}</TableCell>
                        <TableCell>{formatINR(invoice.amount)}</TableCell>
                        <TableCell>{formatDate(invoice.due_date as string | undefined)}</TableCell>
                        <TableCell><Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge></TableCell>
                        <TableCell>
                          {invoice.payment_link ? (
                            <Badge variant="outline" className="inline-flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" />Link</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleCopyLink(invoice.payment_link as string | undefined)}>Copy Link</Button>
                          <Button size="sm" onClick={() => handleMarkPaid(invoice.id)}>Mark Paid</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Payment Follow-ups</h2>
              <p className="text-sm text-slate-600">Invoices that need a client payment reminder.</p>
            </div>
            <Badge variant="outline">{followUpInvoices.length} pending</Badge>
          </div>
          <div className="mt-6 space-y-4">
            {followUpInvoices.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No pending payment follow-ups.</div>
            ) : (
              followUpInvoices.map((invoice) => {
                const client = clients.find((clientRow) => clientRow.id === invoice.client_id);
                const message = `Hi ${client?.name ?? "Client"}, payment for invoice ${invoice.invoice_number ?? invoice.number ?? "#"} amounting to ${formatINR(invoice.amount)} is pending. Please complete the payment using your CA Compliance Vault portal/payment link.`;
                return (
                  <div key={invoice.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="text-sm text-slate-500">{client?.name ?? "Unknown client"}</div>
                        <div className="text-base font-medium text-slate-900">Invoice {invoice.invoice_number ?? invoice.number ?? "—"}</div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span>{formatINR(invoice.amount)}</span>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">Due {formatDate(invoice.due_date as string | undefined)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await navigator.clipboard.writeText(message);
                            toast.success("Payment reminder copied");
                          }}
                        >
                          <ClipboardCopy className="mr-2 h-4 w-4" />
                          Copy Payment Reminder
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
