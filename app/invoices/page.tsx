"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Loader2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import InvoiceFormDialog, {
  InvoiceRow,
  ClientOption,
  EngagementOption,
  INVOICE_STATUSES,
} from "@/components/invoices/invoice-form";

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

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "paid") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
        Paid
      </Badge>
    );
  }
  if (s === "overdue") {
    return (
      <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
        Overdue
      </Badge>
    );
  }
  if (s === "sent") {
    return (
      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
        Sent
      </Badge>
    );
  }
  if (s === "cancelled") {
    return (
      <Badge variant="outline" className="text-slate-400 text-xs line-through">
        Cancelled
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      Draft
    </Badge>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [engagements, setEngagements] = useState<EngagementOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [invRes, clientsRes, engRes] = await Promise.all([
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("id, name").order("name", { ascending: true }),
        supabase.from("engagements").select("id, client_id, title"),
      ]);

      if (invRes.error) throw invRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (engRes.error) throw engRes.error;

      setInvoices(invRes.data ?? []);
      setClients(clientsRes.data ?? []);
      setEngagements(engRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return invoices.filter((inv) => {
      if (statusFilter !== "All" && inv.status !== statusFilter) return false;
      if (clientFilter !== "All" && inv.client_id !== clientFilter) return false;

      if (q) {
        const clientName = clientMap.get(inv.client_id) || "";
        const matchNumber = inv.invoice_number.toLowerCase().includes(q);
        const matchClient = clientName.toLowerCase().includes(q);
        if (!matchNumber && !matchClient) return false;
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter, clientFilter, clientMap]);

  // Financial Summaries
  const totalBilled = invoices.reduce((sum, i) => {
    const total = i.total_amount ?? (i.amount + (i.tax || 0));
    return sum + total;
  }, 0);

  const totalPaid = invoices
    .filter((i) => i.status.toLowerCase() === "paid")
    .reduce((sum, i) => {
      const total = i.total_amount ?? (i.amount + (i.tax || 0));
      return sum + total;
    }, 0);

  const totalOutstanding = invoices
    .filter((i) => ["sent", "overdue"].includes(i.status.toLowerCase()))
    .reduce((sum, i) => {
      const total = i.total_amount ?? (i.amount + (i.tax || 0));
      return sum + total;
    }, 0);

  const overdueCount = invoices.filter(
    (i) => i.status.toLowerCase() === "overdue"
  ).length;

  const handleMarkAsPaid = async (invoice: InvoiceRow) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          status: "Paid",
          payment_date: new Date().toISOString(),
        })
        .eq("id", invoice.id);

      if (error) {
        toast.error(error.message || "Failed to mark invoice as paid");
        return;
      }

      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: invoice.client_id,
          engagement_id: invoice.engagement_id || null,
          action: "invoice_marked_paid",
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
          },
          created_by: null,
        },
      ]);

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id
            ? { ...inv, status: "Paid", payment_date: new Date().toISOString() }
            : inv
        )
      );
      toast.success(`Invoice ${invoice.invoice_number} marked as Paid`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating invoice");
    }
  };

  const handleCopyPaymentLink = (link?: string | null) => {
    if (!link) {
      toast.error("No payment link available");
      return;
    }
    navigator.clipboard.writeText(link);
    toast.success("Payment link copied to clipboard");
  };

  const handleDelete = async () => {
    if (!deletingInvoice) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", deletingInvoice.id);

      if (error) {
        toast.error(error.message || "Failed to delete invoice");
        return;
      }

      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: deletingInvoice.client_id,
          engagement_id: deletingInvoice.engagement_id || null,
          action: "invoice_deleted",
          metadata: {
            invoice_id: deletingInvoice.id,
            invoice_number: deletingInvoice.invoice_number,
          },
          created_by: null,
        },
      ]);

      await loadData();
      setDeleteOpen(false);
      setDeletingInvoice(null);
      toast.success("Invoice deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Invoices &amp; Billing</h1>
              <p className="text-sm text-slate-500">Loading financial records...</p>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 w-28 rounded bg-slate-200" />
                </CardHeader>
                <CardContent>
                  <div className="h-7 w-20 rounded bg-slate-200" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-2xl py-16 text-center">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Unable to load invoices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-red-600">{error}</p>
              <Button onClick={() => void loadData()} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Invoices &amp; Billing
            </h1>
            <p className="text-sm text-slate-500">
              Manage client billing, retainers, GST tax calculations, and payment statuses.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingInvoice(null);
              setFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </header>

        {/* Summary Metric Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Billed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {fmtINR(totalBilled)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Collected / Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {fmtINR(totalPaid)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {fmtINR(totalOutstanding)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Overdue Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overdueCount}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Search & Filters */}
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search invoice number or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {INVOICE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Clients</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoices Table */}
          <Card className="border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">Invoice Number</TableHead>
                      <TableHead className="font-semibold text-slate-700">Client</TableHead>
                      <TableHead className="font-semibold text-slate-700">Base Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700">GST (Tax)</TableHead>
                      <TableHead className="font-semibold text-slate-700">Total</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Due Date</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-12 text-slate-500 text-sm"
                        >
                          No invoices found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((inv) => {
                        const clientName = clientMap.get(inv.client_id) || "Unknown Client";
                        const tax = inv.tax ?? Math.round(inv.amount * 0.18);
                        const total = inv.total_amount ?? (inv.amount + tax);
                        const isPaid = inv.status.toLowerCase() === "paid";

                        return (
                          <TableRow key={inv.id} className="hover:bg-slate-50/80">
                            <TableCell>
                              <div className="font-mono font-semibold text-slate-900">
                                {inv.invoice_number}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium text-slate-800">
                                {clientName}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-600">
                                {fmtINR(inv.amount)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-500">
                                {fmtINR(tax)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-bold text-slate-900">
                                {fmtINR(total)}
                              </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(inv.status)}</TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-600">
                                {formatDate(inv.due_date)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isPaid && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-50"
                                    onClick={() => handleMarkAsPaid(inv)}
                                    title="Mark as Paid"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Mark Paid
                                  </Button>
                                )}
                                {inv.payment_link && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleCopyPaymentLink(inv.payment_link)}
                                    title="Copy Payment Link"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                                    <span className="sr-only">Copy Link</span>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-slate-100"
                                  onClick={() => {
                                    setEditingInvoice(inv);
                                    setFormOpen(true);
                                  }}
                                  title="Edit Invoice"
                                >
                                  <Edit2 className="h-4 w-4 text-slate-600" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => {
                                    setDeletingInvoice(inv);
                                    setDeleteOpen(true);
                                  }}
                                  title="Delete Invoice"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Invoice Form Dialog */}
        <InvoiceFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          invoiceToEdit={editingInvoice}
          clients={clients}
          engagements={engagements}
          invoiceCount={invoices.length}
          onSuccess={() => void loadData()}
        />

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete invoice{" "}
                <span className="font-semibold text-slate-900">
                  {deletingInvoice?.invoice_number}
                </span>
                ? This will remove the record from billing accounts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete Invoice"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardShell>
  );
}
