"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Clock,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import CalendarView, {
  CalendarEventItem,
  getEventTypeColor,
  getEventTypeBadge,
} from "@/components/calendar/calendar-view";

export type CalendarEventDB = {
  id: string;
  firm_id?: string | null;
  title: string;
  description?: string | null;
  event_type: "Meeting" | "Deadline" | "Task" | "Reminder" | string;
  start_time: string;
  end_time?: string | null;
  client_id?: string | null;
  engagement_id?: string | null;
  created_at?: string | null;
};

export type ClientOption = {
  id: string;
  name: string;
};

export type EngagementOption = {
  id: string;
  client_id: string;
  title: string;
  due_date: string | null;
};

export type InvoiceOption = {
  id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  due_date: string | null;
  status: string;
};

const FIRM_ID = "11111111-1111-1111-1111-111111111111";

const EVENT_TYPES = ["Meeting", "Deadline", "Task", "Reminder"] as const;

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [eventsDB, setEventsDB] = useState<CalendarEventDB[]>([]);
  const [engagements, setEngagements] = useState<EngagementOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add/Edit Event Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventType, setEventType] = useState<string>("Meeting");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("none");
  const [selectedEngagementId, setSelectedEngagementId] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsRes, engRes, invRes, clientsRes] = await Promise.all([
        supabase.from("calendar_events").select("*").order("start_time", { ascending: true }),
        supabase.from("engagements").select("id, client_id, title, due_date"),
        supabase.from("invoices").select("id, client_id, invoice_number, amount, due_date, status"),
        supabase.from("clients").select("id, name").order("name", { ascending: true }),
      ]);

      if (eventsRes.error) {
        // Table might be newly provisioned; keep array empty if select errors
        setEventsDB([]);
      } else {
        setEventsDB(eventsRes.data ?? []);
      }

      setEngagements(engRes.data ?? []);
      setInvoices(invRes.data ?? []);
      setClients(clientsRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar events");
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

  // Combine DB events, Engagement Deadlines, and Invoice Due Dates
  const allEvents: CalendarEventItem[] = useMemo(() => {
    const combined: CalendarEventItem[] = [];

    // Custom calendar events
    eventsDB.forEach((ev) => {
      combined.push({
        id: ev.id,
        title: ev.title,
        description: ev.description,
        event_type: ev.event_type,
        start_time: ev.start_time,
        end_time: ev.end_time,
        client_id: ev.client_id,
        client_name: ev.client_id ? clientMap.get(ev.client_id) : null,
        engagement_id: ev.engagement_id,
        source: "custom",
      });
    });

    // Engagement deadlines
    engagements.forEach((eng) => {
      if (eng.due_date) {
        const clientName = clientMap.get(eng.client_id) || "Client";
        combined.push({
          id: `eng-${eng.id}`,
          title: `[Due] ${eng.title}`,
          description: `Compliance filing deadline for ${clientName}`,
          event_type: "Deadline",
          start_time: eng.due_date,
          client_id: eng.client_id,
          client_name: clientName,
          engagement_id: eng.id,
          source: "engagement",
        });
      }
    });

    // Invoice due dates
    invoices.forEach((inv) => {
      if (inv.due_date && inv.status.toLowerCase() !== "paid") {
        const clientName = clientMap.get(inv.client_id) || "Client";
        combined.push({
          id: `inv-${inv.id}`,
          title: `Invoice ${inv.invoice_number} Due`,
          description: `₹${inv.amount.toLocaleString("en-IN")} due from ${clientName}`,
          event_type: "Invoice",
          start_time: inv.due_date,
          client_id: inv.client_id,
          client_name: clientName,
          source: "invoice",
        });
      }
    });

    return combined.sort((a, b) => {
      const tA = new Date(a.start_time).getTime();
      const tB = new Date(b.start_time).getTime();
      return tA - tB;
    });
  }, [eventsDB, engagements, invoices, clientMap]);

  // Next 7 Days Upcoming Deadlines Sidebar
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    in7Days.setHours(23, 59, 59, 999);

    return allEvents.filter((ev) => {
      const d = new Date(ev.start_time);
      return d >= now && d <= in7Days;
    });
  }, [allEvents]);

  const handleDateClick = (dateStr: string) => {
    setEventTitle("");
    setEventDesc("");
    setEventType("Meeting");
    setEventStartTime(`${dateStr}T10:00`);
    setEventEndTime(`${dateStr}T11:00`);
    setSelectedClientId("none");
    setSelectedEngagementId("none");
    setDialogOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventTitle.trim()) {
      toast.error("Event title is required");
      return;
    }

    if (!eventStartTime) {
      toast.error("Start time is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: created, error } = await supabase
        .from("calendar_events")
        .insert([
          {
            firm_id: FIRM_ID,
            title: eventTitle.trim(),
            description: eventDesc.trim() || null,
            event_type: eventType,
            start_time: new Date(eventStartTime).toISOString(),
            end_time: eventEndTime ? new Date(eventEndTime).toISOString() : null,
            client_id: selectedClientId === "none" ? null : selectedClientId,
            engagement_id: selectedEngagementId === "none" ? null : selectedEngagementId,
          },
        ])
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to create event");
        return;
      }

      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: selectedClientId === "none" ? null : selectedClientId,
          action: "calendar_event_created",
          metadata: { event_id: created?.id, title: eventTitle.trim() },
          created_by: null,
        },
      ]);

      await loadData();
      setDialogOpen(false);
      toast.success("Event scheduled successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error scheduling event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent || deletingEvent.source !== "custom") return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", deletingEvent.id);

      if (error) {
        toast.error(error.message || "Failed to delete event");
        return;
      }

      await loadData();
      setDeleteOpen(false);
      setDeletingEvent(null);
      toast.success("Event deleted from calendar");
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
              <h1 className="text-2xl font-bold text-slate-900">Compliance Calendar</h1>
              <p className="text-sm text-slate-500">Loading statutory schedules...</p>
            </div>
          </header>
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
              <CardTitle className="text-red-800">Unable to load calendar</CardTitle>
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
              Compliance &amp; Meeting Calendar
            </h1>
            <p className="text-sm text-slate-500">
              Synchronize client deadlines, return filing dates, and scheduled consultations.
            </p>
          </div>
          <Button
            onClick={() => {
              const todayStr = new Date().toISOString().split("T")[0];
              handleDateClick(todayStr);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Monthly Calendar (3 columns on large screens) */}
          <div className="lg:col-span-3">
            <CalendarView
              events={allEvents}
              currentDate={currentDate}
              onNavigate={setCurrentDate}
              onDateClick={handleDateClick}
              onEventClick={(ev) => {
                if (ev.source === "custom") {
                  setDeletingEvent(ev);
                  setDeleteOpen(true);
                } else {
                  toast.info(`${ev.title}: ${ev.description || "System deadline"}`);
                }
              }}
            />
          </div>

          {/* Next 7 Days Deadlines Sidebar (1 column) */}
          <div className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-base font-semibold">
                    Upcoming (Next 7 Days)
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Prioritized filing deadlines and meetings.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No urgent deadlines scheduled in the next 7 days.
                  </div>
                ) : (
                  upcomingDeadlines.map((item) => {
                    const dateObj = new Date(item.start_time);
                    const formattedDate = dateObj.toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    });

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${getEventTypeColor(
                          item.event_type
                        )}`}
                      >
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`text-[9px] uppercase px-1.5 py-0 font-bold ${getEventTypeBadge(
                              item.event_type
                            )}`}
                          >
                            {item.event_type}
                          </Badge>
                          <span className="font-semibold text-slate-700">
                            {formattedDate}
                          </span>
                        </div>

                        <div className="font-semibold text-slate-900 text-sm leading-tight">
                          {item.title}
                        </div>

                        {item.description && (
                          <div className="text-slate-600 line-clamp-2">
                            {item.description}
                          </div>
                        )}

                        {item.client_name && (
                          <div className="text-[11px] font-medium text-slate-500 pt-1">
                            Client: {item.client_name}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Schedule Event Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Calendar Event</DialogTitle>
              <DialogDescription>
                Add a meeting, task, or reminder to your firm workspace.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateEvent} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Event Title *</label>
                <Input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Tax Audit Final Discussion"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Event Type</label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Client (Optional)</label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / Internal Firm Task</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Start Time *</label>
                  <Input
                    type="datetime-local"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">End Time</label>
                  <Input
                    type="datetime-local"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Description</label>
                <Textarea
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Agenda, location, or notes..."
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...
                    </>
                  ) : (
                    "Schedule Event"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Calendar Event?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove{" "}
                <span className="font-semibold text-slate-900">
                  {deletingEvent?.title}
                </span>{" "}
                from your schedule?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...
                  </>
                ) : (
                  "Delete Event"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardShell>
  );
}
