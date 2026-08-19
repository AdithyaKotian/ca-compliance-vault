"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export type InvoiceRow = {
  id: string;
  firm_id: string | null;
  client_id: string;
  engagement_id: string | null;
  invoice_number: string;
  amount: number;
  tax?: number | null;
  total_amount?: number | null;
  status: string;
  due_date: string | null;
  payment_date?: string | null;
  payment_link: string | null;
  created_at: string | null;
};

export type ClientOption = {
  id: string;
  name: string;
};

export type EngagementOption = {
  id: string;
  client_id: string;
  title: string;
};

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToEdit?: InvoiceRow | null;
  clients: ClientOption[];
  engagements: EngagementOption[];
  invoiceCount: number;
  onSuccess: () => void;
}

const FIRM_ID = "11111111-1111-1111-1111-111111111111";

export const INVOICE_STATUSES = [
  "Draft",
  "Sent",
  "Paid",
  "Overdue",
  "Cancelled",
] as const;

export default function InvoiceFormDialog({
  open,
  onOpenChange,
  invoiceToEdit,
  clients,
  engagements,
  invoiceCount,
  onSuccess,
}: InvoiceFormDialogProps) {
  const [clientId, setClientId] = useState("");
  const [engagementId, setEngagementId] = useState("none");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [taxRate, setTaxRate] = useState<number>(18); // 18% GST standard
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<string>("Sent");
  const [paymentLink, setPaymentLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableEngagements = engagements.filter(
    (e) => e.client_id === clientId
  );

  useEffect(() => {
    if (invoiceToEdit) {
      setClientId(invoiceToEdit.client_id || "");
      setEngagementId(invoiceToEdit.engagement_id || "none");
      setInvoiceNumber(invoiceToEdit.invoice_number || "");
      setAmount(invoiceToEdit.amount || "");
      const calculatedTax = invoiceToEdit.tax ?? (invoiceToEdit.amount ? invoiceToEdit.amount * 0.18 : 0);
      const rate = invoiceToEdit.amount ? Math.round((calculatedTax / invoiceToEdit.amount) * 100) : 18;
      setTaxRate(rate);
      setStatus(invoiceToEdit.status || "Sent");
      setDueDate(
        invoiceToEdit.due_date
          ? new Date(invoiceToEdit.due_date).toISOString().split("T")[0]
          : ""
      );
      setPaymentLink(invoiceToEdit.payment_link || "");
    } else {
      setClientId(clients[0]?.id || "");
      setEngagementId("none");
      const currentYear = new Date().getFullYear();
      const seq = String(invoiceCount + 1).padStart(4, "0");
      setInvoiceNumber(`INV-${currentYear}-${seq}`);

      // Async query last invoice number to guarantee uniqueness
      void (async () => {
        try {
          const { data: lastInvoice } = await supabase
            .from("invoices")
            .select("invoice_number")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastInvoice?.invoice_number) {
            const parts = lastInvoice.invoice_number.split("-");
            const lastSeq = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastSeq)) {
              const nextSeq = String(lastSeq + 1).padStart(4, "0");
              setInvoiceNumber(`INV-${currentYear}-${nextSeq}`);
            }
          }
        } catch {
          // Keep default fallback
        }
      })();

      setAmount("");
      setTaxRate(18);
      setStatus("Sent");
      // Default due date: 15 days from today
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 15);
      setDueDate(defaultDue.toISOString().split("T")[0]);
      setPaymentLink("");
    }
  }, [invoiceToEdit, clients, invoiceCount, open]);

  const numAmount = typeof amount === "number" ? amount : 0;
  const calculatedTax = Math.round((numAmount * taxRate) / 100);
  const calculatedTotal = numAmount + calculatedTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Please select a client");
      return;
    }

    if (!invoiceNumber.trim()) {
      toast.error("Invoice number is required");
      return;
    }

    if (typeof amount !== "number" || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      if (invoiceToEdit) {
        // Update
        const { error } = await supabase
          .from("invoices")
          .update({
            client_id: clientId,
            engagement_id: engagementId === "none" ? null : engagementId,
            invoice_number: invoiceNumber.trim(),
            amount: numAmount,
            tax: calculatedTax,
            total_amount: calculatedTotal,
            status,
            due_date: dueDate || null,
            payment_link: paymentLink.trim() || null,
            payment_date: status === "Paid" ? new Date().toISOString() : null,
          })
          .eq("id", invoiceToEdit.id);

        if (error) {
          toast.error(error.message || "Failed to update invoice");
          return;
        }

        await supabase.from("audit_logs").insert([
          {
            firm_id: FIRM_ID,
            client_id: clientId,
            engagement_id: engagementId === "none" ? null : engagementId,
            action: "invoice_updated",
            metadata: { invoice_number: invoiceNumber.trim() },
            created_by: null,
          },
        ]);

        toast.success("Invoice updated successfully");
      } else {
        // Create
        const { data: created, error } = await supabase
          .from("invoices")
          .insert([
            {
              firm_id: FIRM_ID,
              client_id: clientId,
              engagement_id: engagementId === "none" ? null : engagementId,
              invoice_number: invoiceNumber.trim(),
              amount: numAmount,
              tax: calculatedTax,
              total_amount: calculatedTotal,
              status,
              due_date: dueDate || null,
              payment_link: paymentLink.trim() || null,
            },
          ])
          .select()
          .single();

        if (error) {
          toast.error(error.message || "Failed to create invoice");
          return;
        }

        await supabase.from("audit_logs").insert([
          {
            firm_id: FIRM_ID,
            client_id: clientId,
            engagement_id: engagementId === "none" ? null : engagementId,
            action: "invoice_created",
            metadata: { invoice_id: created.id, invoice_number: invoiceNumber.trim() },
            created_by: null,
          },
        ]);

        toast.success("Invoice created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {invoiceToEdit ? "Edit Invoice" : "Create New Invoice"}
          </DialogTitle>
          <DialogDescription>
            Generate professional GST compliance invoices and payment requests.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Client *</label>
              <Select
                value={clientId}
                onValueChange={(val) => {
                  setClientId(val);
                  setEngagementId("none");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Invoice Number *
              </label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2024-0001"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Engagement (Optional)
            </label>
            <Select
              value={engagementId}
              onValueChange={setEngagementId}
              disabled={!clientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Link to engagement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General CA Retainer / Advisory</SelectItem>
                {availableEngagements.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-medium text-slate-700">
                Base Amount (₹) *
              </label>
              <Input
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="e.g. 15000"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                GST Rate (%)
              </label>
              <Select
                value={String(taxRate)}
                onValueChange={(val) => setTaxRate(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (Exempt)</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18% (Standard)</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto-calculated Total summary */}
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Base Subtotal:</span>
              <span className="font-medium">
                ₹{numAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST ({taxRate}%):</span>
              <span className="font-medium">
                ₹{calculatedTax.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
              <span>Total Payable:</span>
              <span className="text-emerald-700">
                ₹{calculatedTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Payment Link (Optional)
            </label>
            <Input
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              placeholder="https://rzp.io/l/..."
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : invoiceToEdit ? (
                "Save Changes"
              ) : (
                "Create Invoice"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
