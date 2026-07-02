"use client"

import React, { useMemo, useState } from "react";
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
import { clients, contacts, engagements, checklistItems, invoices } from "../../lib/mock-data";
import { Search } from "lucide-react";

function fmtINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

type Risk = "High" | "Medium" | "Low";

const RISK_OPTIONS = ["All", "High", "Medium", "Low"] as const;
type RiskOption = typeof RISK_OPTIONS[number];

function clientRisk(clientId: string): Risk {
  const clientEng = engagements.filter((e) => e.clientId === clientId);
  if (clientEng.some((e) => e.risk === "High")) return "High";
  if (clientEng.some((e) => e.risk === "Medium")) return "Medium";
  return "Low";
}

export default function Page() {
  const [query, setQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState<"All" | Risk>("All");
  const [open, setOpen] = useState(false);

  const totalClients = clients.length;
  const highRiskClients = clients.filter((c) => clientRisk(c.id) === "High").length;
  const pendingDocs = checklistItems.filter((c) => c.status === "Pending" || c.status === "Requested").length;
  const unpaidAmount = invoices.filter((i) => i.status === "Sent" || i.status === "Overdue").reduce((s, i) => s + i.amountINR, 0);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase());
      const risk = clientRisk(c.id);
      const matchesRisk = filterRisk === "All" ? true : risk === filterRisk;
      return matchesQuery && matchesRisk;
    });
  }, [query, filterRisk]);

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
                  <DialogDescription>Provide client details (mock). This form does not save.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                  <Input placeholder="Client name" />
                  <Input placeholder="Client type" />
                  <Input placeholder="Contact person" />
                  <Input placeholder="Email" />
                  <Input placeholder="Phone" />
                  <Input placeholder="GSTIN" />
                  <Input placeholder="PAN" />
                  <Input placeholder="Address" />
                </div>

                <DialogFooter>
                  <Button
                    onClick={() => {
                      // Mock submit
                      alert("Client creation will be connected in Supabase step.");
                    }}
                    disabled
                  >
                    Create Client
                  </Button>
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

                  {filtered.map((c) => {
                    const mainContact = contacts.find((ct) => ct.id === c.primaryContactId);
                    const activeEng = engagements.filter((e) => e.clientId === c.id && e.status !== "Completed" && e.status !== "Filed");
                    const pendingCount = checklistItems.filter((ch) => {
                      const eng = engagements.find((en) => en.id === ch.engagementId);
                      return eng?.clientId === c.id && (ch.status === "Pending" || ch.status === "Requested");
                    }).length;
                    const unpaid = invoices.filter((i) => i.clientId === c.id && (i.status === "Sent" || i.status === "Overdue")).reduce((s, it) => s + it.amountINR, 0);
                    const risk = clientRisk(c.id);

                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-sm text-slate-500">{c.type}</div>
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
                          <Link href={`/clients/${c.id}`}>
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

