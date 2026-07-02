"use client"

import { useMemo, useState } from "react";
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
import {
  clients,
  engagements,
  invoices,
  getClientById,
  getEngagementById,
  type InvoiceStatus,
} from "../../lib/mock-data";

type InvoiceFilter = "All" | InvoiceStatus;

const invoiceStatuses: InvoiceFilter[] = ["All", "Draft", "Sent", "Paid", "Overdue"];

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const statusVariant = (status: InvoiceStatus) => {
  if (status === "Paid") return "secondary" as const;
  if (status === "Overdue") return "destructive" as const;
  if (status === "Draft") return "outline" as const;
  return "default" as const;
};

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceFilter>("All");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>("all");
  const [newClientId, setNewClientId] = useState<string>(clients[0]?.id ?? "");
  const [newEngagementId, setNewEngagementId] = useState<string>(engagements.find((eng) => eng.clientId === clients[0]?.id)?.id ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amountINR, setAmountINR] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");

  const filteredEngagements = useMemo(
    () =>
      selectedClientId === "all"
        ? engagements
        : engagements.filter((engagement) => engagement.clientId === selectedClientId),
    [selectedClientId]
  );

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const engagement = getEngagementById(invoice.engagementId ?? "");
      const client = getClientById(invoice.clientId);
      if (selectedClientId !== "all" && invoice.clientId !== selectedClientId) return false;
      if (selectedEngagementId !== "all" && invoice.engagementId !== selectedEngagementId) return false;
      if (statusFilter !== "All" && invoice.status !== statusFilter) return false;
      if (!normalizedSearch) return true;
      const values = [invoice.number, client?.name, engagement?.title];
      return values.some((value) => {
        const text = value ? String(value).toLowerCase() : "";
        return text.includes(normalizedSearch);
      });
    });
  }, [searchTerm, selectedClientId, selectedEngagementId, statusFilter]);

  const followUpInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "Sent" || invoice.status === "Overdue"),
    []
  );

  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amountINR, 0);
  const unpaidAmount = invoices
    .filter((invoice) => invoice.status === "Sent")
    .reduce((sum, invoice) => sum + invoice.amountINR, 0);
  const overdueAmount = invoices
    .filter((invoice) => invoice.status === "Overdue")
    .reduce((sum, invoice) => sum + invoice.amountINR, 0);
  const paidThisMonth = invoices
    .filter((invoice) => {
      if (invoice.status !== "Paid") return false;
      const issued = new Date(invoice.issuedAt);
      const now = new Date();
      return issued.getMonth() === now.getMonth() && issued.getFullYear() === now.getFullYear();
    })
    .reduce((sum, invoice) => sum + invoice.amountINR, 0);

  const invoiceEngagementOptions = useMemo(
    () => engagements.filter((engagement) => engagement.clientId === newClientId),
    [newClientId]
  );

  const handleCopyLink = async (link?: string) => {
    if (link) {
      await navigator.clipboard.writeText(link);
      toast.success("Payment link copied");
    } else {
      toast.error("No payment link attached");
    }
  };

  const handleMarkPaid = () => {
    toast.success("Payment status update will be connected in Supabase step.");
  };

  const handleCreateInvoice = () => {
    toast.success("Invoice creation will be connected in Supabase step.");
  };

  const handleNewClientChange = (clientId: string) => {
    setNewClientId(clientId);
    const firstEngagement = engagements.find((engagement) => engagement.clientId === clientId);
    setNewEngagementId(firstEngagement?.id ?? "");
  };

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
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
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
                              <SelectItem key={engagement.id} value={engagement.id}>
                                {engagement.title}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No engagements available
                            </SelectItem>
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
                    <Input type="number" value={amountINR} onChange={(event) => setAmountINR(event.target.value)} placeholder="0" />
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
                  <Button className="w-full" onClick={handleCreateInvoice}>
                    Create Invoice
                  </Button>
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

        <section className="grid gap-4 xl:grid-cols-[1fr_auto]">
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
            <div className="space-y-2 sm:grid sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Client</label>
                <Select value={selectedClientId} onValueChange={(value) => { setSelectedClientId(value); setSelectedEngagementId("all"); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Client</SelectLabel>
                      <SelectItem value="all">All</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Engagement</label>
                <Select value={selectedEngagementId} onValueChange={setSelectedEngagementId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All engagements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Engagement</SelectLabel>
                      <SelectItem value="all">All</SelectItem>
                      {filteredEngagements.map((engagement) => (
                        <SelectItem key={engagement.id} value={engagement.id}>
                          {engagement.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
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
                    const client = getClientById(invoice.clientId);
                    const engagement = invoice.engagementId ? getEngagementById(invoice.engagementId) : undefined;
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-slate-900">{invoice.number}</TableCell>
                        <TableCell>{client?.name ?? "Unknown"}</TableCell>
                        <TableCell>{engagement?.title ?? "—"}</TableCell>
                        <TableCell>{formatINR(invoice.amountINR)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.paymentLink ? (
                            <Badge variant="outline" className="inline-flex items-center gap-1">
                              <LinkIcon className="h-3.5 w-3.5" />
                              Link
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleCopyLink(invoice.paymentLink)}>
                            Copy Link
                          </Button>
                          <Button size="sm" onClick={handleMarkPaid}>
                            Mark Paid
                          </Button>
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
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No pending payment follow-ups.
              </div>
            ) : (
              followUpInvoices.map((invoice) => {
                const client = getClientById(invoice.clientId);
                const message = `Hi ${client?.name ?? "Client"}, payment for invoice ${invoice.number} amounting to ₹${invoice.amountINR.toLocaleString("en-IN")} is pending. Please complete the payment using your CA Compliance Vault portal/payment link.`;
                return (
                  <div key={invoice.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="text-sm text-slate-500">{client?.name ?? "Unknown client"}</div>
                        <div className="text-base font-medium text-slate-900">Invoice {invoice.number}</div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span>{formatINR(invoice.amountINR)}</span>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">Due {formatDate(invoice.dueDate)}</span>
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
