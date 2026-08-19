"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Edit2, Trash2, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export type ClientRow = {
  id: string;
  firm_id: string | null;
  name: string;
  type: "individual" | "business" | string | null;
  email: string | null;
  phone: string | null;
  pan: string | null;
  gstin: string | null;
  address: string | null;
  risk_level: "low" | "medium" | "high" | string | null;
  created_at: string | null;
};

export type ContactRow = {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  created_at: string | null;
};

export type EngagementRow = {
  id: string;
  firm_id: string | null;
  client_id: string;
  title: string;
  type: string;
  status: string;
  due_date: string | null;
  priority: string | null;
  created_at: string | null;
};

export type ChecklistItemRow = {
  id: string;
  engagement_id: string;
  title: string;
  description: string | null;
  status: string;
  required: boolean | null;
  due_date: string | null;
  assigned_staff: string | null;
  created_at: string | null;
};

export type InvoiceRow = {
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

type Risk = "High" | "Medium" | "Low";

const RISK_OPTIONS = ["All", "High", "Medium", "Low"] as const;
type RiskOption = (typeof RISK_OPTIONS)[number];

const FIRM_ID = "11111111-1111-1111-1111-111111111111";

function activeEngagementsForClient(engagements: EngagementRow[], clientId: string) {
  return engagements
    .filter((engagement) => engagement.client_id === clientId)
    .map((engagement) => engagement.id);
}

function fmtINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeRisk(value: string | null): Risk {
  const risk = value?.toLowerCase();
  if (risk === "high") return "High";
  if (risk === "medium") return "Medium";
  return "Low";
}

export default function ClientsPage() {
  const [query, setQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState<RiskOption>("All");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [engagements, setEngagements] = useState<EngagementRow[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Client State
  const [addOpen, setAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState("business");
  const [addContact, setAddContact] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addGstin, setAddGstin] = useState("");
  const [addPan, setAddPan] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addRisk, setAddRisk] = useState<"low" | "medium" | "high">("low");

  // Edit Client State
  const [editOpen, setEditOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("business");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editGstin, setEditGstin] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editRisk, setEditRisk] = useState<"low" | "medium" | "high">("low");
  const [editContactName, setEditContactName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");

  // Delete Client State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<ClientRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [clientsRes, contactsRes, engagementsRes, checklistRes, invoicesRes] =
        await Promise.all([
          supabase.from("clients").select("*").order("name", { ascending: true }),
          supabase.from("contacts").select("*"),
          supabase.from("engagements").select("*"),
          supabase.from("checklist_items").select("*"),
          supabase.from("invoices").select("*"),
        ]);

      const fetchError =
        clientsRes.error ||
        contactsRes.error ||
        engagementsRes.error ||
        checklistRes.error ||
        invoicesRes.error;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setClients(clientsRes.data ?? []);
      setContacts(contactsRes.data ?? []);
      setEngagements(engagementsRes.data ?? []);
      setChecklistItems(checklistRes.data ?? []);
      setInvoices(invoicesRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return clients.filter((client) => {
      const risk = normalizeRisk(client.risk_level);
      const matchesRisk = filterRisk === "All" ? true : risk === filterRisk;
      if (!matchesRisk) return false;

      if (!normalizedQuery) return true;

      const contact = contacts.find((ct) => ct.client_id === client.id);
      const fields = [
        client.name,
        client.email ?? "",
        client.phone ?? "",
        client.pan ?? "",
        client.gstin ?? "",
        contact?.name ?? "",
        contact?.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(normalizedQuery);
    });
  }, [clients, contacts, filterRisk, query]);

  const totalClients = clients.length;
  const highRiskClients = clients.filter(
    (client) => normalizeRisk(client.risk_level) === "High"
  ).length;
  const pendingDocs = checklistItems.filter((item) => {
    const engagement = engagements.find((e) => e.id === item.engagement_id);
    return (
      engagement &&
      (item.status.toLowerCase() === "pending" ||
        item.status.toLowerCase() === "requested")
    );
  }).length;
  const unpaidAmount = invoices.reduce((sum, invoice) => {
    const status = invoice.status.toLowerCase();
    return status === "sent" || status === "overdue" ? sum + invoice.amount : sum;
  }, 0);

  const handleCreate = async () => {
    if (!addName.trim()) {
      toast.error("Client name is required");
      return;
    }
    if (addEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from("clients")
        .insert([
          {
            firm_id: FIRM_ID,
            name: addName.trim(),
            type: addType || "business",
            email: addEmail.trim() || null,
            phone: addPhone.trim() || null,
            pan: addPan.trim() ? addPan.trim().toUpperCase() : null,
            gstin: addGstin.trim() ? addGstin.trim().toUpperCase() : null,
            address: addAddress.trim() || null,
            risk_level: addRisk,
          },
        ])
        .select()
        .single();

      if (insertErr) {
        toast.error(insertErr.message || "Failed to create client");
        return;
      }

      if (addContact.trim()) {
        await supabase.from("contacts").insert([
          {
            client_id: inserted.id,
            name: addContact.trim(),
            email: addEmail.trim() || null,
            phone: addPhone.trim() || null,
            designation: "Primary Contact",
          },
        ]);
      }

      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: inserted.id,
          action: "client_created",
          metadata: { name: inserted.name },
          created_by: null,
        },
      ]);

      await loadData();
      setAddOpen(false);
      setAddName("");
      setAddType("business");
      setAddContact("");
      setAddEmail("");
      setAddPhone("");
      setAddGstin("");
      setAddPan("");
      setAddAddress("");
      setAddRisk("low");
      toast.success("Client created successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Client creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (client: ClientRow) => {
    const contact = contacts.find((ct) => ct.client_id === client.id);
    setEditingClient(client);
    setEditName(client.name);
    setEditType(client.type || "business");
    setEditEmail(client.email || "");
    setEditPhone(client.phone || "");
    setEditPan(client.pan || "");
    setEditGstin(client.gstin || "");
    setEditAddress(client.address || "");
    setEditRisk((client.risk_level as "low" | "medium" | "high") || "low");
    setEditContactName(contact?.name || "");
    setEditContactEmail(contact?.email || "");
    setEditContactPhone(contact?.phone || "");
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingClient) return;
    if (!editName.trim()) {
      toast.error("Client name is required");
      return;
    }
    if (editEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateErr } = await supabase
        .from("clients")
        .update({
          name: editName.trim(),
          type: editType,
          email: editEmail.trim() || null,
          phone: editPhone.trim() || null,
          pan: editPan.trim() ? editPan.trim().toUpperCase() : null,
          gstin: editGstin.trim() ? editGstin.trim().toUpperCase() : null,
          address: editAddress.trim() || null,
          risk_level: editRisk,
        })
        .eq("id", editingClient.id);

      if (updateErr) {
        toast.error(updateErr.message || "Failed to update client");
        return;
      }

      // Update or create primary contact
      const existingContact = contacts.find(
        (ct) => ct.client_id === editingClient.id
      );

      if (editContactName.trim()) {
        if (existingContact) {
          await supabase
            .from("contacts")
            .update({
              name: editContactName.trim(),
              email: editContactEmail.trim() || null,
              phone: editContactPhone.trim() || null,
            })
            .eq("id", existingContact.id);
        } else {
          await supabase.from("contacts").insert([
            {
              client_id: editingClient.id,
              name: editContactName.trim(),
              email: editContactEmail.trim() || null,
              phone: editContactPhone.trim() || null,
              designation: "Primary Contact",
            },
          ]);
        }
      }

      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: editingClient.id,
          action: "client_updated",
          metadata: { name: editName.trim(), client_id: editingClient.id },
          created_by: null,
        },
      ]);

      await loadData();
      setEditOpen(false);
      setEditingClient(null);
      toast.success("Client updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (client: ClientRow) => {
    setDeletingClient(client);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingClient) return;

    setIsDeleting(true);
    try {
      const clientId = deletingClient.id;

      // Find engagements to cascade
      const clientEngagements = engagements.filter((e) => e.client_id === clientId);
      const engagementIds = clientEngagements.map((e) => e.id);

      // Cascade delete child records
      if (engagementIds.length > 0) {
        await supabase.from("checklist_items").delete().in("engagement_id", engagementIds);
        await supabase.from("documents").delete().in("engagement_id", engagementIds);
        await supabase.from("notes").delete().in("engagement_id", engagementIds);
      }

      await supabase.from("documents").delete().eq("client_id", clientId);
      await supabase.from("invoices").delete().eq("client_id", clientId);
      await supabase.from("contacts").delete().eq("client_id", clientId);
      await supabase.from("engagements").delete().eq("client_id", clientId);

      // Delete client record
      const { error: delErr } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (delErr) {
        toast.error(delErr.message || "Failed to delete client");
        return;
      }

      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: clientId,
          action: "client_deleted",
          metadata: { name: deletingClient.name, client_id: clientId },
          created_by: null,
        },
      ]);

      await loadData();
      setDeleteOpen(false);
      setDeletingClient(null);
      toast.success("Client deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete client");
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
              <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
              <p className="text-sm text-slate-500">Loading client database...</p>
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
              <CardTitle className="text-red-800">Unable to load clients</CardTitle>
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clients</h1>
            <p className="text-sm text-slate-500">
              Manage client accounts, compliance status, and contacts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Fill in the client profile and primary contact details.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Client Name *
                      </label>
                      <Input
                        placeholder="e.g. Acme Corp / Rahul Sharma"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Client Type
                      </label>
                      <Select value={addType} onValueChange={setAddType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">Business / Corporate</SelectItem>
                          <SelectItem value="individual">Individual / Salaried</SelectItem>
                          <SelectItem value="partnership">Partnership / LLP</SelectItem>
                          <SelectItem value="trust">Trust / NGO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Official Email
                      </label>
                      <Input
                        type="email"
                        placeholder="client@company.com"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Phone Number
                      </label>
                      <Input
                        placeholder="+91 98765 43210"
                        value={addPhone}
                        onChange={(e) => setAddPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">PAN</label>
                      <Input
                        placeholder="ABCDE1234F"
                        value={addPan}
                        onChange={(e) => setAddPan(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">GSTIN</label>
                      <Input
                        placeholder="29AAAAA0000A1Z5"
                        value={addGstin}
                        onChange={(e) => setAddGstin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Risk Level
                      </label>
                      <Select
                        value={addRisk}
                        onValueChange={(val: "low" | "medium" | "high") =>
                          setAddRisk(val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Address</label>
                    <Input
                      placeholder="Registered address"
                      value={addAddress}
                      onChange={(e) => setAddAddress(e.target.value)}
                    />
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="text-xs font-semibold text-slate-900 mb-2">
                      Primary Contact Person (Optional)
                    </h4>
                    <Input
                      placeholder="Contact Name (e.g. Ramesh Kumar)"
                      value={addContact}
                      onChange={(e) => setAddContact(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      "Create Client"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Stats Section */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalClients}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                High Risk Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{highRiskClients}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Pending Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pendingDocs}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Unpaid Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {fmtINR(unpaidAmount)}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Filters and Search */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, PAN, GSTIN..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-medium text-slate-500 mr-1">Risk:</span>
              {RISK_OPTIONS.map((r) => (
                <Button
                  key={r}
                  variant={filterRisk === r ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRisk(r)}
                  className="h-8 text-xs"
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          {/* Clients Table */}
          <Card className="border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">Client</TableHead>
                      <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                      <TableHead className="font-semibold text-slate-700">PAN / GSTIN</TableHead>
                      <TableHead className="font-semibold text-slate-700">Engagements</TableHead>
                      <TableHead className="font-semibold text-slate-700">Pending Docs</TableHead>
                      <TableHead className="font-semibold text-slate-700">Unpaid Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700">Risk</TableHead>
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
                          No clients match your filter criteria. Try clearing search or add a client.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((client) => {
                        const mainContact = contacts.find(
                          (ct) => ct.client_id === client.id
                        );
                        const activeEng = engagements.filter(
                          (engagement) =>
                            engagement.client_id === client.id &&
                            engagement.status.toLowerCase() !== "completed" &&
                            engagement.status.toLowerCase() !== "filed"
                        );
                        const clientEngagementIds = new Set(
                          activeEngagementsForClient(engagements, client.id)
                        );
                        const pendingCount = checklistItems.filter(
                          (item) =>
                            clientEngagementIds.has(item.engagement_id) &&
                            ["pending", "requested"].includes(
                              item.status.toLowerCase()
                            )
                        ).length;
                        const unpaid = invoices
                          .filter(
                            (invoice) =>
                              invoice.client_id === client.id &&
                              ["sent", "overdue"].includes(
                                invoice.status.toLowerCase()
                              )
                          )
                          .reduce((sum, invoice) => sum + invoice.amount, 0);
                        const risk = normalizeRisk(client.risk_level);

                        return (
                          <TableRow key={client.id} className="hover:bg-slate-50/80">
                            <TableCell>
                              <div className="font-medium text-slate-900">
                                {client.name}
                              </div>
                              <div className="text-xs text-slate-500 capitalize">
                                {client.type || "Business"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-slate-800">
                                {mainContact?.name || client.email || "-"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {client.phone || mainContact?.phone || ""}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-mono text-slate-700">
                                {client.pan || "-"}
                              </div>
                              <div className="text-xs font-mono text-slate-500">
                                {client.gstin || ""}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal text-xs">
                                {activeEng.length} active
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {pendingCount > 0 ? (
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                  {pendingCount} pending
                                </Badge>
                              ) : (
                                <span className="text-xs text-slate-400">0</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium text-slate-800">
                                {fmtINR(unpaid)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  risk === "High"
                                    ? "destructive"
                                    : risk === "Medium"
                                    ? "secondary"
                                    : "default"
                                }
                                className="text-xs"
                              >
                                {risk}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link href={`/clients/${client.id}`}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    title="View Client"
                                  >
                                    <Eye className="h-4 w-4 text-slate-600" />
                                    <span className="sr-only">View</span>
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-slate-100"
                                  onClick={() => handleEditClick(client)}
                                  title="Edit Client"
                                >
                                  <Edit2 className="h-4 w-4 text-slate-600" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => handleDeleteClick(client)}
                                  title="Delete Client"
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

        {/* Edit Client Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Update client profile and contact details.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Client Name *
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Client Type
                  </label>
                  <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business / Corporate</SelectItem>
                      <SelectItem value="individual">Individual / Salaried</SelectItem>
                      <SelectItem value="partnership">Partnership / LLP</SelectItem>
                      <SelectItem value="trust">Trust / NGO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Phone
                  </label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">PAN</label>
                  <Input
                    value={editPan}
                    onChange={(e) => setEditPan(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">GSTIN</label>
                  <Input
                    value={editGstin}
                    onChange={(e) => setEditGstin(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Risk Level
                  </label>
                  <Select
                    value={editRisk}
                    onValueChange={(val: "low" | "medium" | "high") =>
                      setEditRisk(val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Address</label>
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                />
              </div>

              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-semibold text-slate-900">
                  Primary Contact Person
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Name"
                    value={editContactName}
                    onChange={(e) => setEditContactName(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Phone"
                    value={editContactPhone}
                    onChange={(e) => setEditContactPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client Account?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-900">
                  {deletingClient?.name}
                </span>
                ? This action will permanently remove the client along with their
                associated contacts, engagements, checklist documents, and invoices.
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
                  "Delete Client"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardShell>
  );
}