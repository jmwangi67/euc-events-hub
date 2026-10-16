"use client";
import { useCallback, useRef, useState, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import luxonPlugin from "@fullcalendar/luxon3";
import type { EventSourceFunc, DatesSetArg } from "@fullcalendar/core";
import type { EventFilters } from "../../lib/data/fixtures";
import { getEvents } from "../../lib/data/fixtures";
import { DISPLAY_TIME_ZONE, easternDate } from "../../lib/time/eastern";
import type { CalendarView } from "../../lib/domain/calendar-state";
import { toCalendarEvent } from "./calendar-events";

type Props = {
  date: string;
  view: CalendarView;
  filters: EventFilters;
  onDateChange: (date: string) => void;
  onViewChange: (view: CalendarView) => void;
  onEventSelect: (id: string) => void;
  onReset: () => void;
  mobile: boolean;
};
const views: [CalendarView, string][] = [
  ["dayGridMonth", "Month"],
  ["timeGridWeek", "Week"],
  ["timeGridDay", "Day"],
  ["listMonth", "List"],
];

/** The only UI adapter that knows FullCalendar APIs, plugins, and data mapping. */
export function EventCalendar({
  date,
  view,
  filters,
  onDateChange,
  onViewChange,
  onEventSelect,
  onReset,
  mobile,
}: Props) {
  const calendar = useRef<FullCalendar>(null);
  const [title, setTitle] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const plugins = useMemo(
    () => [dayGridPlugin, timeGridPlugin, listPlugin, luxonPlugin],
    [],
  );
  const source: EventSourceFunc = useCallback(
    (range, success, failure) => {
      try {
        const events = getEvents({
          start: range.startStr.slice(0, 10),
          end: range.endStr.slice(0, 10),
          filters,
        });
        setCount(events.length);
        setError(false);
        success(events.map(toCalendarEvent));
      } catch (cause) {
        setError(true);
        failure(
          cause instanceof Error ? cause : new Error("Could not load events."),
        );
      }
    },
    [filters],
  );
  useEffect(() => {
    const api = calendar.current?.getApi();
    if (api && easternDate(api.getDate().toISOString()) !== date)
      api.gotoDate(date);
  }, [date, view]);
  const navigate = (direction: "prev" | "next" | "today") => {
    const api = calendar.current?.getApi();
    if (!api) return;
    api[direction]();
    onDateChange(easternDate(api.getDate().toISOString()));
  };
  const datesSet = (range: DatesSetArg) => setTitle(range.view.title);
  return (
    <section className="calendar-region" aria-label="Student events calendar">
      <div className="calendar-toolbar">
        <div className="calendar-navigation">
          <button
            className="control arrow-control"
            aria-label="Previous date range"
            onClick={() => navigate("prev")}
          >
            ←
          </button>
          <button
            className="control arrow-control"
            aria-label="Next date range"
            onClick={() => navigate("next")}
          >
            →
          </button>
          <button className="control" onClick={() => navigate("today")}>
            Today
          </button>
        </div>
        <div className="view-controls" role="group" aria-label="Calendar view">
          {views
            .filter(
              ([id]) => !mobile || id === "listMonth" || id === "timeGridDay",
            )
            .map(([id, label]) => (
              <button
                className="control"
                key={id}
                aria-pressed={view === id}
                onClick={() => onViewChange(id)}
              >
                {label}
              </button>
            ))}
        </div>
      </div>
      <div className="range-heading">
        <h2 aria-live="polite">{title || "Loading calendar…"}</h2>
        <span className="timezone-label">Eastern Time · EST / EDT</span>
      </div>
      <div className="calendar-summary">
        <p role="status">
          {error
            ? "Unable to load events."
            : count === null
              ? "Loading events…"
              : `${count} ${count === 1 ? "event" : "events"} in this range`}
        </p>
        <label className="date-jump">
          Go to date{" "}
          <input
            className="control"
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) {
                calendar.current?.getApi().gotoDate(e.target.value);
                onDateChange(e.target.value);
              }
            }}
          />
        </label>
      </div>
      {error && (
        <p role="alert">
          Events could not be loaded. Change the date range to retry.
        </p>
      )}
      <div className="calendar-surface">
        <FullCalendar
          key={view}
          ref={calendar}
          plugins={plugins}
          initialView={view}
          initialDate={date}
          timeZone={DISPLAY_TIME_ZONE}
          firstDay={0}
          headerToolbar={false}
          height={view.startsWith("timeGrid") ? 700 : "auto"}
          scrollTime="12:00:00"
          fixedWeekCount={false}
          dayMaxEvents={3}
          events={source}
          datesSet={datesSet}
          nowIndicator
          displayEventEnd
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          eventOrder="start,title"
          eventInteractive
          navLinks={false}
          allDayText="All day"
          noEventsContent={() => (
            <div className="empty-state">
              <h3>No published events in this range</h3>
              <p>
                Try another date, adjust your search, or clear your filters.
              </p>
              <button className="control" onClick={onReset}>
                Clear filters
              </button>
            </div>
          )}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            onEventSelect(info.event.id);
          }}
          eventContent={(info) => {
            const content = (
              <span className="calendar-event-content">
                <span className="event-time">
                  {info.event.allDay ? "All day" : info.timeText}
                </span>
                <span className="event-title">
                  {info.event.title.replace(/^Synthetic example: /, "")}
                </span>
                <span className="event-category">
                  {info.event.extendedProps.category} · Example
                </span>
              </span>
            );
            return info.view.type.startsWith("list") ? (
              <button
                type="button"
                className="list-event-trigger"
                aria-label={`${info.event.title}. ${info.event.extendedProps.timeLabel}. ${info.event.extendedProps.category}. Fictional example. Open event details.`}
                onClick={(click) => {
                  click.stopPropagation();
                  onEventSelect(info.event.id);
                }}
              >
                {content}
              </button>
            ) : (
              content
            );
          }}
          eventDidMount={(info) => {
            // List titles use native buttons; retain the table's row semantics.
            if (info.view.type.startsWith("list")) return;
            const trigger = info.el;
            trigger.tabIndex = 0;
            trigger.setAttribute("role", "button");
            trigger.onkeydown = (key) => {
              if (key.key === "Enter" || key.key === " ") {
                key.preventDefault();
                onEventSelect(info.event.id);
              }
            };
            trigger.setAttribute(
              "aria-label",
              `${info.event.title}. ${info.event.extendedProps.timeLabel}. ${info.event.extendedProps.category}. Fictional example. Open event details.`,
            );
          }}
        />
      </div>
      {count === 0 && view !== "listMonth" && (
        <div className="empty-state">
          <p>No published events match this range and filters.</p>
          <button className="control" onClick={onReset}>
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
