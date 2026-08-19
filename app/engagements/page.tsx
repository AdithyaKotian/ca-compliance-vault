"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  Loader2,
  Briefcase,
  ArrowUpDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import EngagementFormDialog, {
  EngagementRow,
  ClientOption,
  ENGAGEMENT_TYPES,
  ENGAGEMENT_STATUSES,
} from "@/components/engagements/engagement-form";

const FIRM_ID = "11111111-1111-1111-1111-111111111111";

function formatDate(value?: string | null): string {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPriorityBadgeVariant(priority?: string | null) {
  const p = priority?.toLowerCase();
  if (p === "urgent" || p === "high") return "destructive";
  if (p === "medium") return "secondary";
  return "outline";
}

function getStatusBadgeClass(status?: string | null) {
  const s = status?.toLowerCase();
  if (s === "completed" || s === "filed")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "in progress" || s === "in review")
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "waiting for client")
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "overdue")
    return "bg-red-50 text-red-700 border-red-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function EngagementsPage() {
  const [engagements, setEngagements] = useState<EngagementRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"due_date" | "priority" | "title">("due_date");
  const [sortAsc, setSortAsc] = useState(true);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingEngagement, setEditingEngagement] = useState<EngagementRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEngagement, setDeletingEngagement] = useState<EngagementRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [engRes, clientsRes] = await Promise.all([
        supabase.from("engagements").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("id, name").order("name", { ascending: true }),
      ]);

      if (engRes.error) throw engRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setEngagements(engRes.data ?? []);
      setClients(clientsRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load engagements");
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

    return engagements
      .filter((eng) => {
        if (statusFilter !== "All" && eng.status !== statusFilter) return false;
        if (typeFilter !== "All" && eng.type !== typeFilter) return false;
        if (clientFilter !== "All" && eng.client_id !== clientFilter) return false;

        if (q) {
          const clientName = clientMap.get(eng.client_id) || "";
          const matchTitle = eng.title.toLowerCase().includes(q);
          const matchClient = clientName.toLowerCase().includes(q);
          const matchType = eng.type.toLowerCase().includes(q);
          if (!matchTitle && !matchClient && !matchType) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "due_date") {
          const dateA = a.due_date ? new Date(a.due_date).getTime() : 9999999999999;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : 9999999999999;
          return sortAsc ? dateA - dateB : dateB - dateA;
        }
        if (sortBy === "priority") {
          const weight: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          const pA = weight[a.priority || "Medium"] || 0;
          const pB = weight[b.priority || "Medium"] || 0;
          return sortAsc ? pA - pB : pB - pA;
        }
        return sortAsc
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      });
  }, [engagements, searchQuery, statusFilter, typeFilter, clientFilter, sortBy, sortAsc, clientMap]);

  // Statistics
  const totalCount = engagements.length;
  const inProgressCount = engagements.filter((e) =>
    ["in progress", "waiting for client", "in review"].includes(e.status.toLowerCase())
  ).length;
  const completedCount = engagements.filter((e) =>
    ["completed", "filed"].includes(e.status.toLowerCase())
  ).length;
  const overdueCount = engagements.filter(
    (e) => e.status.toLowerCase() === "overdue"
  ).length;

  const handleCreateClick = () => {
    setEditingEngagement(null);
    setFormOpen(true);
  };

  const handleEditClick = (engagement: EngagementRow) => {
    setEditingEngagement(engagement);
    setFormOpen(true);
  };

  const handleDeleteClick = (engagement: EngagementRow) => {
    setDeletingEngagement(engagement);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingEngagement) return;

    setIsDeleting(true);
    try {
      const engId = deletingEngagement.id;

      // Cascade delete child checklist items, documents, and notes
      await supabase.from("checklist_items").delete().eq("engagement_id", engId);
      await supabase.from("documents").delete().eq("engagement_id", engId);
      await supabase.from("notes").delete().eq("engagement_id", engId);

      const { error } = await supabase.from("engagements").delete().eq("id", engId);

      if (error) {
        toast.error(error.message || "Failed to delete engagement");
        return;
      }

      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: deletingEngagement.client_id,
          engagement_id: engId,
          action: "engagement_deleted",
          metadata: { title: deletingEngagement.title },
          created_by: null,
        },
      ]);

      await loadData();
      setDeleteOpen(false);
      setDeletingEngagement(null);
      toast.success("Engagement deleted successfully");
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
              <h1 className="text-2xl font-bold text-slate-900">Engagements</h1>
              <p className="text-sm text-slate-500">Loading compliance workflows...</p>
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
              <CardTitle className="text-red-800">Unable to load engagements</CardTitle>
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
              Engagements
            </h1>
            <p className="text-sm text-slate-500">
              Track compliance filings, audits, returns, and statutory deadlines.
            </p>
          </div>
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            New Engagement
          </Button>
        </header>

        {/* Stats Metrics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Engagements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Active / In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Overdue Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Completed / Filed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
            </CardContent>
          </Card>
        </section>

        {/* Search, Filters, & Sorting */}
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search title, client, or type..."
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
                  {ENGAGEMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {ENGAGEMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
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

          {/* Engagements Table */}
          <Card className="border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead
                        className="font-semibold text-slate-700 cursor-pointer hover:text-slate-900"
                        onClick={() => {
                          if (sortBy === "title") setSortAsc(!sortAsc);
                          else {
                            setSortBy("title");
                            setSortAsc(true);
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Title
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">Client</TableHead>
                      <TableHead className="font-semibold text-slate-700">Type</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead
                        className="font-semibold text-slate-700 cursor-pointer hover:text-slate-900"
                        onClick={() => {
                          if (sortBy === "due_date") setSortAsc(!sortAsc);
                          else {
                            setSortBy("due_date");
                            setSortAsc(true);
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Due Date
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="font-semibold text-slate-700 cursor-pointer hover:text-slate-900"
                        onClick={() => {
                          if (sortBy === "priority") setSortAsc(!sortAsc);
                          else {
                            setSortBy("priority");
                            setSortAsc(true);
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Priority
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-12 text-slate-500 text-sm"
                        >
                          No engagements found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((eng) => {
                        const clientName = clientMap.get(eng.client_id) || "Unknown Client";

                        return (
                          <TableRow key={eng.id} className="hover:bg-slate-50/80">
                            <TableCell>
                              <Link
                                href={`/engagements/${eng.id}`}
                                className="font-semibold text-slate-900 hover:underline flex items-center gap-2"
                              >
                                <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                                <span>{eng.title}</span>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-700 font-medium">
                                {clientName}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal text-xs">
                                {eng.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getStatusBadgeClass(eng.status)}`}
                              >
                                {eng.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-600 font-medium">
                                {formatDate(eng.due_date)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getPriorityBadgeVariant(eng.priority)}
                                className="text-xs"
                              >
                                {eng.priority || "Medium"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link href={`/engagements/${eng.id}`}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    title="View Engagement Workflow"
                                  >
                                    <Eye className="h-4 w-4 text-slate-600" />
                                    <span className="sr-only">View</span>
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-slate-100"
                                  onClick={() => handleEditClick(eng)}
                                  title="Edit Engagement"
                                >
                                  <Edit2 className="h-4 w-4 text-slate-600" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => handleDeleteClick(eng)}
                                  title="Delete Engagement"
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

        {/* Engagement Create/Edit Dialog */}
        <EngagementFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          engagementToEdit={editingEngagement}
          clients={clients}
          onSuccess={() => void loadData()}
        />

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Engagement?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-slate-900">
                  {deletingEngagement?.title}
                </span>
                ? All associated checklist items, uploaded documents, and internal notes
                for this engagement will be removed.
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
                  "Delete Engagement"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardShell>
  );
}
