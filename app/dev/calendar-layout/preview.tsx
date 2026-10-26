"use client";
import { useState } from "react";
import { EventCalendar } from "../../../components/calendar/event-calendar";
import { toExternalCalendarItem } from "../../../components/calendar/planner-events";
import type { ExternalEvent } from "../../../lib/domain/external-events";
import type { CalendarView } from "../../../lib/domain/calendar-state";

// Invented visual fixtures isolated from source queries and scheduling analysis.
const context = {
  analysis: "context-only" as const,
  analysisReason: "Fictional layout test; excluded from scheduling analysis.",
  geography: "Fictional campus",
  audience: "Visual review only",
};
const source = {
  label: "Fictional layout test only",
  verification: "synthetic" as const,
};
function timed(
  id: string,
  date: string,
  title: string,
  start: string,
  end: string,
  scope: ExternalEvent["scope"],
) {
  return toExternalCalendarItem({
    ...context,
    id,
    title: `Fictional ${title}`,
    category: "concert",
    scope,
    source,
    startDate: date,
    endDate: date === "2026-10-19" ? "2026-10-20" : "2026-10-22",
    timeKnown: true,
    start: `${date}T${start}:00-04:00`,
    end: `${date}T${end}:00-04:00`,
  });
}
const items = [
  timed(
    "shift",
    "2026-10-19",
    "CHIPOTLE shift — layout example",
    "16:00",
    "23:30",
    "campus-local",
  ),
  timed(
    "course",
    "2026-10-19",
    "BME 446 — course layout example",
    "16:00",
    "17:15",
    "psu-wide",
  ),
  timed(
    "three-a",
    "2026-10-21",
    "long afternoon commitment",
    "13:00",
    "16:00",
    "campus-local",
  ),
  timed(
    "three-b",
    "2026-10-21",
    "research presentation and discussion",
    "13:30",
    "15:00",
    "psu-wide",
  ),
  timed(
    "three-c",
    "2026-10-21",
    "career conversation",
    "14:00",
    "15:30",
    "national",
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    timed(
      `dense-${i}`,
      "2026-10-21",
      `dense overlap ${i + 1} — independent event details`,
      `17:${i % 2 ? "15" : "00"}`,
      `19:${i % 2 ? "45" : "30"}`,
      ["campus-local", "psu-wide", "national"][i % 3] as ExternalEvent["scope"],
    ),
  ),
  timed(
    "short",
    "2026-10-21",
    "short ten-minute appointment",
    "16:30",
    "16:40",
    "psu-wide",
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    toExternalCalendarItem({
      ...context,
      id: `date-${i}`,
      title: `Fictional ${i === 0 ? "date-wide commitment" : "missing-hour activity"} ${i + 1}`,
      category: "concert",
      scope: "campus-local",
      source,
      startDate: "2026-10-21",
      endDate: "2026-10-22",
      timeKnown: false,
      dateWide: i === 0,
    }),
  ),
];
export function CalendarLayoutPreview() {
  const [view, setView] = useState<CalendarView>("timeGridWeek");
  const [date, setDate] = useState("2026-10-19");
  return (
    <main id="main" className="application-main">
      <h1>Calendar layout review</h1>
      <p>
        Fictional demonstration events only. No personal schedules or real
        course records.
      </p>
      <EventCalendar
        date={date}
        view={view}
        onViewChange={setView}
        onDateChange={setDate}
        filters={{}}
        mobile={false}
        previewItems={items}
        onEventSelect={() => {}}
        onReset={() => setDate("2026-10-19")}
      />
    </main>
  );
}
