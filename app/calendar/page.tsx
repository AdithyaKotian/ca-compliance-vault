"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "../../components/layout/dashboard-shell";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

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
  due_date: string | null;
  assignee: string | null;
  created_at: string | null;
};

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

type FilterCategory = "All" | "GST" | "ITR" | "TDS" | "Audit" | "ROC";
const categories: FilterCategory[] = ["All", "GST", "ITR", "TDS", "Audit", "ROC"];

const monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getCategory = (type?: string): FilterCategory => {
  if (!type) return "All";
  if (type.includes("GST")) return "GST";
  if (type.includes("Income Tax") || type.includes("ITR")) return "ITR";
  if (type.includes("TDS")) return "TDS";
  if (type.includes("Audit")) return "Audit";
  if (type.includes("ROC")) return "ROC";
  return "All";
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function CalendarPage() {
  const [category, setCategory] = useState<FilterCategory>("All");
  const [engagements, setEngagements] = useState<EngagementRow[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const [engagementsRes, checklistRes, clientsRes] = await Promise.all([
        supabase.from("engagements").select("*"),
        supabase.from("checklist_items").select("*"),
        supabase.from("clients").select("*"),
      ]);

      const fetchError = engagementsRes.error || checklistRes.error || clientsRes.error;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setEngagements((engagementsRes.data ?? []) as EngagementRow[]);
      setChecklistItems((checklistRes.data ?? []) as ChecklistItemRow[]);
      setClients((clientsRes.data ?? []) as ClientRow[]);
      setLoading(false);
    };

    void load();
  }, []);

  const visibleEngagements = useMemo(
    () => engagements.filter((engagement) => {
      const engagementCategory = getCategory(engagement.type);
      return category === "All" || engagementCategory === category;
    }),
    [engagements, category]
  );

  const today = useMemo(() => new Date(), []);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstOfMonth = new Date(currentYear, currentMonth, 1);
  const firstWeekDay = firstOfMonth.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthDeadlines = useMemo(
    () => visibleEngagements.filter((engagement) => {
      if (!engagement.due_date) return false;
      const due = new Date(engagement.due_date);
      return due.getMonth() === currentMonth && due.getFullYear() === currentYear;
    }),
    [visibleEngagements, currentMonth, currentYear]
  );

  const weekDeadlines = useMemo(
    () => visibleEngagements.filter((engagement) => {
      if (!engagement.due_date) return false;
      const due = new Date(engagement.due_date);
      const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 7;
    }),
    [visibleEngagements, today]
  );

  const overdueJobs = useMemo(
    () => visibleEngagements.filter((engagement) => engagement.due_date ? new Date(engagement.due_date) < today : false),
    [visibleEngagements, today]
  );

  const highRiskDeadlines = useMemo(
    () => visibleEngagements.filter((engagement) => engagement.risk === "High"),
    [visibleEngagements]
  );

  const calendarCells = useMemo(() => {
    const cells: Array<{ date: Date; items: EngagementRow[] } | null> = [];
    for (let index = 0; index < firstWeekDay; index += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(currentYear, currentMonth, day);
      const items = monthDeadlines.filter((engagement) => {
        if (!engagement.due_date) return false;
        const due = new Date(engagement.due_date);
        return due.getDate() === day;
      });
      cells.push({ date, items });
    }
    return cells;
  }, [currentMonth, currentYear, daysInMonth, firstWeekDay, monthDeadlines]);

  const upcomingDeadlines = useMemo(
    () => visibleEngagements
      .slice()
      .sort((a, b) => {
        const aDue = a.due_date ? new Date(a.due_date).getTime() : 0;
        const bDue = b.due_date ? new Date(b.due_date).getTime() : 0;
        return aDue - bDue;
      }),
    [visibleEngagements]
  );

  const slaRisks = useMemo(
    () => visibleEngagements.filter((engagement) => {
      if (!engagement.due_date) return false;
      const pending = checklistItems.filter((item) => item.engagement_id === engagement.id && (item.status === "Pending" || item.status === "Requested")).length;
      const due = new Date(engagement.due_date);
      const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return pending > 0 && (due < today || diff <= 5);
    }),
    [visibleEngagements, checklistItems, today]
  );

  const documentDeadlines = useMemo(
    () => checklistItems.filter((item) => {
      const status = item.status.toLowerCase();
      return (status === "pending" || status === "requested") && item.due_date;
    }),
    [checklistItems]
  );

  const getBadgeVariant = (engagement: EngagementRow) => {
    if (engagement.status === "Overdue") return "destructive" as const;
    if (engagement.risk === "High") return "destructive" as const;
    if (engagement.status === "In Review" || engagement.status === "Waiting for Client") return "outline" as const;
    return "secondary" as const;
  };

  const getCheckStatusVariant = (status: string) => {
    if (status === "Requested") return "destructive" as const;
    if (status === "Pending") return "outline" as const;
    return "secondary" as const;
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <header className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/50">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Compliance Calendar</h1>
              <p className="text-sm text-slate-600">Loading calendar data from Supabase.</p>
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
              <CardTitle>Unable to load calendar</CardTitle>
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
            <div className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Compliance Calendar</div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Compliance Calendar</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Track filing deadlines, document due dates, and client risk across all engagements.
              </p>
            </div>
          </div>
          <Button size="lg" onClick={() => toast.success("Deadline creation will be connected in Supabase step.")}>Add Deadline</Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Deadlines This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{monthDeadlines.length}</p>
              <CardDescription>{weekDeadlines.length} due within a week.</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Due This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{weekDeadlines.length}</p>
              <CardDescription>Engagement deadlines approaching in the next 7 days.</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Overdue Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{overdueJobs.length}</p>
              <CardDescription>Engagements past their due date.</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>High Risk Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{highRiskDeadlines.length}</p>
              <CardDescription>High-risk filings and approvals to monitor.</CardDescription>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((item) => (
              <Button key={item} variant={category === item ? "secondary" : "outline"} size="sm" onClick={() => setCategory(item)}>
                {item}
              </Button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{monthLabels[currentMonth]} {currentYear}</CardTitle>
                  <CardDescription>Monthly deadline preview with engagement due dates.</CardDescription>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4" />
                  {monthLabels[currentMonth]}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 p-0 px-4 pb-4 pt-2">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {dayLabels.map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => (
                  <div key={idx} className="min-h-[8rem] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700">
                    {!cell ? null : (
                      <div className="space-y-2">
                        <div className="font-semibold text-slate-900">{cell.date.getDate()}</div>
                        <div className="space-y-1">
                          {cell.items.slice(0, 3).map((engagement) => {
                            const engagementType = engagement.type ?? "General";
                            return (
                              <Link key={engagement.id} href={`/engagements/${engagement.id}`} className="block rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-100">
                                <span className="font-medium">{engagementType.split(" ")[0]}</span>
                              </Link>
                            );
                          })}
                          {cell.items.length > 3 ? (
                            <div className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500">+{cell.items.length - 3} more</div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No deadlines found for this filter.</div>
                ) : (
                  upcomingDeadlines.map((engagement) => {
                    const client = clients.find((clientRow) => clientRow.id === engagement.client_id);
                    return (
                      <div key={engagement.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium text-slate-900">{engagement.title}</div>
                            <div className="text-sm text-slate-600">{client?.name ?? "Unknown client"}</div>
                          </div>
                          <Badge variant={getBadgeVariant(engagement)}>{engagement.status}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <Badge variant="outline">{getCategory(engagement.type)}</Badge>
                          <span>Due {engagement.due_date ? formatDate(engagement.due_date) : "—"}</span>
                          <Badge variant={engagement.risk === "High" ? "destructive" : "secondary"}>{engagement.risk ?? "Low"} risk</Badge>
                        </div>
                        <div className="mt-3">
                          <Link href={`/engagements/${engagement.id}`} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-100">
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA Risk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {slaRisks.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No high-risk deadlines right now.</div>
                ) : (
                  slaRisks.map((engagement) => {
                    const client = clients.find((clientRow) => clientRow.id === engagement.client_id);
                    const pendingCount = checklistItems.filter((item) => item.engagement_id === engagement.id && (item.status === "Pending" || item.status === "Requested")).length;
                    return (
                      <div key={engagement.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium text-slate-900">{client?.name ?? "Unknown client"}</div>
                            <div className="text-sm text-slate-600">{engagement.title}</div>
                          </div>
                          <Badge variant={getBadgeVariant(engagement)}>{engagement.risk ?? "Low"}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span>Due {engagement.due_date ? formatDate(engagement.due_date) : "—"}</span>
                          <Badge variant="outline">{pendingCount} pending</Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Document Deadlines</CardTitle>
              <CardDescription>Pending checklist items with due dates and client responsibility.</CardDescription>
            </div>
            <Badge variant="outline">{documentDeadlines.length}</Badge>
          </div>
          <div className="mt-6 space-y-3">
            {documentDeadlines.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No deadlines found for this filter.</div>
            ) : (
              documentDeadlines.map((item) => {
                const engagement = engagements.find((engagementRow) => engagementRow.id === item.engagement_id);
                const client = engagement ? clients.find((clientRow) => clientRow.id === engagement.client_id) : undefined;
                return (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium text-slate-900">{item.title}</div>
                        <div className="text-sm text-slate-600">{engagement?.title ?? "Unknown engagement"} • {client?.name ?? "Unknown client"}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">Due {item.due_date ? formatDate(item.due_date) : "—"}</span>
                        <Badge variant={getCheckStatusVariant(item.status)}>{item.status}</Badge>
                      </div>
                    </div>
                    {item.assignee ? <div className="mt-3 text-sm text-slate-600">Assigned to {item.assignee}</div> : null}
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
