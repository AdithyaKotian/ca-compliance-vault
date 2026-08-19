"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    onNavigate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onNavigate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    onNavigate(new Date());
  };

  // Calendar matrix calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Create grid cells
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateStr = new Date(year, month - 1, day).toISOString().split("T")[0];
    calendarCells.push({
      day,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarCells.push({
      day,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month leading days
  const remainingCells = 42 - calendarCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const dateStr = new Date(year, month + 1, day).toISOString().split("T")[0];
    calendarCells.push({
      day,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Group events by date (YYYY-MM-DD)
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
            {MONTH_NAMES[month]} {year}
          </h2>
          <Button variant="outline" size="sm" onClick={handleToday} className="h-8 text-xs bg-white">
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 mr-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-slate-600">Deadline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600">Meeting</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Task</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">Reminder</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-600">Invoice</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center text-xs font-semibold text-slate-700 py-2">
        {DAY_NAMES.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Month Grid */}
      <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr divide-x divide-y divide-slate-200 min-h-[580px]">
        {calendarCells.map((cell, idx) => {
          const dayEvents = eventsByDate.get(cell.dateStr) || [];

          return (
            <div
              key={idx}
              onClick={() => onDateClick(cell.dateStr)}
              className={`p-1.5 sm:p-2 min-h-[90px] flex flex-col justify-between transition-colors cursor-pointer hover:bg-slate-50/80 ${
                cell.isCurrentMonth ? "bg-white" : "bg-slate-50/40 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
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
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event Pills */}
              <div className="space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEventClick) onEventClick(ev);
                    }}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium truncate leading-tight shadow-2xs ${getEventTypeColor(
                      ev.event_type
                    )}`}
                    title={`${ev.title} (${ev.event_type})`}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-slate-500 font-medium px-1">
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
