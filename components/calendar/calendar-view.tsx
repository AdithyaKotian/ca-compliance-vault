"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
} from "date-fns";

export type CalendarEventItem = {
  id: string;
  title: string;
  description?: string | null;
  event_type: "Deadline" | "Meeting" | "Task" | "Reminder" | "Invoice" | string;
  start_time: string;
  end_time?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  engagement_id?: string | null;
  source: "custom" | "engagement" | "invoice";
};

interface CalendarViewProps {
  events: CalendarEventItem[];
  currentDate: Date;
  onNavigate: (newDate: Date) => void;
  onDateClick: (dateStr: string) => void;
  onEventClick?: (event: CalendarEventItem) => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getEventTypeBadge(type: string) {
  const t = type.toLowerCase();
  if (t === "deadline") return "bg-red-500 text-white";
  if (t === "meeting") return "bg-blue-500 text-white";
  if (t === "task") return "bg-emerald-500 text-white";
  if (t === "reminder") return "bg-amber-500 text-white";
  if (t === "invoice") return "bg-purple-500 text-white";
  return "bg-slate-500 text-white";
}

export function getEventTypeColor(type: string) {
  const t = type.toLowerCase();
  if (t === "deadline") return "border-l-4 border-red-500 bg-red-50 text-red-900";
  if (t === "meeting") return "border-l-4 border-blue-500 bg-blue-50 text-blue-900";
  if (t === "task") return "border-l-4 border-emerald-500 bg-emerald-50 text-emerald-900";
  if (t === "reminder") return "border-l-4 border-amber-500 bg-amber-50 text-amber-900";
  if (t === "invoice") return "border-l-4 border-purple-500 bg-purple-50 text-purple-900";
  return "border-l-4 border-slate-500 bg-slate-50 text-slate-900";
}

export default function CalendarView({
  events,
  currentDate,
  onNavigate,
  onDateClick,
  onEventClick,
}: CalendarViewProps) {
  const handlePrevMonth = () => {
    onNavigate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onNavigate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    onNavigate(new Date());
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInCurrentMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Leading days from previous month
  const startDayOfWeek = getDay(monthStart);
  const leadingDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - (i + 1));
    leadingDays.push({
      day: d.getDate(),
      dateStr: format(d, "yyyy-MM-dd"),
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Current month days
  const currentMonthCells = daysInCurrentMonth.map((d) => ({
    day: d.getDate(),
    dateStr: format(d, "yyyy-MM-dd"),
    isCurrentMonth: true,
    isToday: isToday(d),
  }));

  // Trailing days from next month to fill 6 weeks (42 cells)
  const totalCellsSoFar = leadingDays.length + currentMonthCells.length;
  const trailingCount = 42 - totalCellsSoFar;
  const trailingDays = [];
  for (let i = 1; i <= trailingCount; i++) {
    const d = new Date(monthEnd);
    d.setDate(d.getDate() + i);
    trailingDays.push({
      day: d.getDate(),
      dateStr: format(d, "yyyy-MM-dd"),
      isCurrentMonth: false,
      isToday: false,
    });
  }

  const calendarCells = [...leadingDays, ...currentMonthCells, ...trailingDays];

  // Group events by date (yyyy-MM-dd)
  const eventsByDate = new Map<string, CalendarEventItem[]>();
  events.forEach((ev) => {
    const datePart = ev.start_time ? ev.start_time.split("T")[0] : "";
    if (datePart) {
      const list = eventsByDate.get(datePart) || [];
      list.push(ev);
      eventsByDate.set(datePart, list);
    }
  });

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Calendar Header Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs h-8">
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend Badges */}
          <div className="hidden md:flex items-center gap-2 mr-2 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Deadline
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Meeting
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Task
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-purple-500" /> Invoice
            </span>
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 bg-white">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 rounded-r-none border-r border-slate-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-l-none"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center text-xs font-semibold text-slate-600">
        {DAY_NAMES.map((name, idx) => (
          <div
            key={name}
            className={`py-2.5 ${idx === 0 || idx === 6 ? "text-slate-400" : ""}`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* 42-Cell Monthly Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-50/20">
        {calendarCells.map((cell, index) => {
          const dayEvents = eventsByDate.get(cell.dateStr) || [];
          return (
            <div
              key={`${cell.dateStr}-${index}`}
              onClick={() => onDateClick(cell.dateStr)}
              className={`min-h-[105px] p-1.5 transition-colors cursor-pointer flex flex-col justify-between group ${
                cell.isCurrentMonth
                  ? "bg-white hover:bg-slate-50/80"
                  : "bg-slate-50/50 text-slate-400 hover:bg-slate-100/60"
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center text-xs font-medium rounded-full h-6 w-6 ${
                    cell.isToday
                      ? "bg-slate-900 text-white font-bold"
                      : cell.isCurrentMonth
                        ? "text-slate-800"
                        : "text-slate-400"
                  }`}
                >
                  {cell.day}
                </span>

                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium mr-1">
                    {dayEvents.length} {dayEvents.length === 1 ? "item" : "items"}
                  </span>
                )}
              </div>

              {/* Day Event Pills */}
              <div className="mt-1 space-y-1 overflow-hidden flex-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEventClick) onEventClick(ev);
                    }}
                    title={`${ev.title} (${ev.event_type})`}
                    className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium transition-all shadow-xs ${getEventTypeColor(
                      ev.event_type
                    )} hover:brightness-95`}
                  >
                    {ev.title}
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-slate-500 font-medium pl-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
