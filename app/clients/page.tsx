"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "../../components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

type ClientRow = {
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

type ContactRow = {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  created_at: string | null;
};

type EngagementRow = {
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

type ChecklistItemRow = {
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

type Risk = "High" | "Medium" | "Low";

const RISK_OPTIONS = ["All", "High", "Medium", "Low"] as const;
type RiskOption = typeof RISK_OPTIONS[number];

// Helper function defined BEFORE the component
function activeEngagementsForClient(engagements: EngagementRow[], clientId: string) {
  return engagements.filter((engagement) => engagement.client_id === clientId).map((engagement) => engagement.id);
}

function fmtINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function normalizeRisk(value: string | null): Risk {
  const risk = value?.toLowerCase();
  if (risk === "high") return "High";
  if (risk === "medium") return "Medium";
  return "Low";
}

export default function Page() {
  const [query, setQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState<"All" | Risk>("All");
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newGstin, setNewGstin] = useState("");
  const [newPan, setNewPan] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [engagements, setEngagements] = useState<EngagementRow[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const [clientsRes, contactsRes, engagementsRes, checklistRes, invoicesRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("contacts").select("*"),
        supabase.from("engagements").select("*"),
        supabase.from("checklist_items").select("*"),
        supabase.from("invoices").select("*"),
      ]);

      const fetchError = clientsRes.error || contactsRes.error || engagementsRes.error || checklistRes.error || invoicesRes.error;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setClients(clientsRes.data ?? []);
      setContacts(contactsRes.data ?? []);
      setEngagements(engagementsRes.data ?? []);
      setChecklistItems(checklistRes.data ?? []);
      setInvoices(invoicesRes.data ?? []);
      setLoading(false);
    };

    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return clients.filter((client) => {
      const risk = normalizeRisk(client.risk_level);
      const matchesRisk = filterRisk === "All" ? true : risk === filterRisk;
      if (!matchesRisk) return false;

      if (!normalizedQuery) return true;

      const contact = contacts.find((ct) => ct.client_id === client.id);
      const fields = [client.name, client.email ?? "", client.phone ?? "", contact?.name ?? ""].join(" ").toLowerCase();
      return fields.includes(normalizedQuery);
    });
  }, [clients, contacts, filterRisk, query]);

  const totalClients = clients.length;
  const highRiskClients = clients.filter((client) => normalizeRisk(client.risk_level) === "High").length;
  const pendingDocs = checklistItems.filter((item) => {
    const engagement = engagements.find((e) => e.id === item.engagement_id);
    return engagement && (item.status.toLowerCase() === "pending" || item.status.toLowerCase() === "requested");
  }).length;
  const unpaidAmount = invoices.reduce((sum, invoice) => {
    const status = invoice.status.toLowerCase();
    return status === "sent" || status === "overdue" ? sum + invoice.amount : sum;
  }, 0);

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <header className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/50">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
              <p className="text-sm text-slate-600">Loading client data from Supabase.</p>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="h-6 w-32 rounded bg-slate-200" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 rounded bg-slate-200" />
                </CardContent>
              </Card>
            ))}
          </section>
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
              <CardTitle>Unable to load clients</CardTitle>
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
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Clients</h1>
            <p className="text-sm text-slate-600">Manage client accounts, pending documents, active engagements, and payment follow-ups.</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Add Client</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Client</DialogTitle>
                  <DialogDescription>Provide client details. This will create a client in Supabase.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                  <Input placeholder="Client name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <Input placeholder="Client type" value={newType} onChange={(e) => setNewType(e.target.value)} />
                  <Input placeholder="Contact person" value={newContact} onChange={(e) => setNewContact(e.target.value)} />
                  <Input placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  <Input placeholder="Phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                  <Input placeholder="GSTIN" value={newGstin} onChange={(e) => setNewGstin(e.target.value)} />
                  <Input placeholder="PAN" value={newPan} onChange={(e) => setNewPan(e.target.value)} />
                  <Input placeholder="Address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
                </div>

                <DialogFooter>
                  <Button onClick={async () => {
                    if (!newName.trim()) {
                      toast.error("Client name is required");
                      return;
                    }

                    const FIRM_ID = "11111111-1111-1111-1111-111111111111";
                    try {
                      const { data: inserted, error: insertErr } = await supabase.from("clients").insert([{ firm_id: FIRM_ID, name: newName.trim(), type: newType || null, email: newEmail || null, phone: newPhone || null, pan: newPan || null, gstin: newGstin || null, address: newAddress || null }]).select().single();
                      if (insertErr) {
                        toast.error(insertErr.message || "Failed to create client");
                        return;
                      }

                      if (newContact.trim()) {
                        await supabase.from("contacts").insert([{ client_id: inserted.id, name: newContact.trim(), email: newEmail || null, phone: newPhone || null }]);
                      }

                      await supabase.from("audit_logs").insert([{ firm_id: FIRM_ID, client_id: inserted.id, action: "client_created", metadata: { name: inserted.name }, created_by: null }]);

                      const { data: refreshed } = await supabase.from("clients").select("*");
                      setClients(refreshed ?? []);
                      setOpen(false);
                      setNewName("");
                      setNewType("");
                      setNewContact("");
                      setNewEmail("");
                      setNewPhone("");
                      setNewGstin("");
                      setNewPan("");
                      setNewAddress("");
                      toast.success("Client created");
                    } catch (err) {
                      const message = err instanceof Error ? err.message : "Client creation error";
                      toast.error(message);
                    }
                  }}>Create Client</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totalClients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>High Risk Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{highRiskClients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{pendingDocs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unpaid Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{fmtINR(unpaidAmount)}</div>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded border bg-white px-2">
                <Search className="h-4 w-4 text-slate-500" />
                <Input placeholder="Search clients..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>

              <div className="flex items-center gap-2">
                {RISK_OPTIONS.map((r: RiskOption) => (
                  <Button
                    key={r}
                    variant={filterRisk === r ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRisk(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Active Engagements</TableHead>
                    <TableHead>Pending Docs</TableHead>
                    <TableHead>Unpaid Amount</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Action</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-sm text-slate-600">
                        No clients match your search or filters. Try clearing filters or add a new client.
                      </TableCell>
                    </TableRow>
                  )}

                  {filtered.map((client) => {
                    const mainContact = contacts.find((ct) => ct.client_id === client.id);
                    const activeEng = engagements.filter((engagement) => engagement.client_id === client.id && engagement.status.toLowerCase() !== "completed" && engagement.status.toLowerCase() !== "filed");
                    const clientEngagementIds = new Set(activeEngagementsForClient(engagements, client.id));
                    const pendingCount = checklistItems.filter((item) => clientEngagementIds.has(item.engagement_id) && ["pending", "requested"].includes(item.status.toLowerCase())).length;
                    const unpaid = invoices.filter((invoice) => invoice.client_id === client.id && ["sent", "overdue"].includes(invoice.status.toLowerCase())).reduce((sum, invoice) => sum + invoice.amount, 0);
                    const risk = normalizeRisk(client.risk_level);

                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-slate-500">{client.type ?? "-"}</div>
                        </TableCell>
                        <TableCell>{mainContact?.name ?? "-"}</TableCell>
                        <TableCell>{mainContact?.email ?? "-"}</TableCell>
                        <TableCell>{mainContact?.phone ?? "-"}</TableCell>
                        <TableCell>{activeEng.length}</TableCell>
                        <TableCell>{pendingCount}</TableCell>
                        <TableCell>{fmtINR(unpaid)}</TableCell>
                        <TableCell>
                          <Badge variant={risk === "High" ? "destructive" : risk === "Medium" ? "secondary" : "default"}>{risk}</Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/clients/${client.id}`}>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  );
}