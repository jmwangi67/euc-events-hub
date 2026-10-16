"use client";
import { useCallback, useRef, useState, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import luxonPlugin from "@fullcalendar/luxon3";
import type {
  EventSourceFunc,
  DatesSetArg,
  EventApi,
  EventInput,
} from "@fullcalendar/core";
import type { EventFilters } from "../../lib/data/fixtures";
import { getEvents, getExams, getOrganizations } from "../../lib/data/fixtures";
import { DISPLAY_TIME_ZONE, easternDate } from "../../lib/time/eastern";
import type { CalendarView } from "../../lib/domain/calendar-state";
import type { Exam } from "../../lib/domain/models";
import {
  isExamRelevant,
  intervalsOverlap,
  type Proposal,
} from "../../lib/domain/planning";
import { toExamCalendarItem, toProposalCalendarItem } from "./planner-events";
import { listRangeCrossesYears, toCalendarEvent } from "./calendar-events";

type Props = {
  date: string;
  view: CalendarView;
  filters: EventFilters;
  onDateChange: (date: string) => void;
  onViewChange: (view: CalendarView) => void;
  onEventSelect: (id: string) => void;
  onReset: () => void;
  mobile: boolean;
  planning?: {
    majorIds: string[];
    proposal: Proposal | null;
    showEvents: boolean;
    showExams: boolean;
    onExamSelect: (exam: Exam) => void;
    onProposalSelect: () => void;
  };
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
  planning,
}: Props) {
  const calendar = useRef<FullCalendar>(null);
  const [title, setTitle] = useState("");
  const [showGroupYear, setShowGroupYear] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const plugins = useMemo(
    () => [dayGridPlugin, timeGridPlugin, listPlugin, luxonPlugin],
    [],
  );
  const source: EventSourceFunc = useCallback(
    (range, success, failure) => {
      try {
        const events =
          planning && !planning.showEvents
            ? []
            : getEvents({
                start: range.startStr.slice(0, 10),
                end: range.endStr.slice(0, 10),
                filters,
              });
        setError(false);
        const organizations = getOrganizations();
        const items: EventInput[] = events.map((event) => {
          const mapped = toCalendarEvent(event);
          return {
            ...mapped,
            extendedProps: {
              ...mapped.extendedProps,
              hosts: organizations
                .filter((org) => event.hostOrganizationIds.includes(org.id))
                .map((org) => org.name)
                .join(", "),
            },
          };
        });
        if (planning?.showExams) {
          const exams = getExams({
            start: range.startStr.slice(0, 10),
            end: range.endStr.slice(0, 10),
          }).filter((exam) => isExamRelevant(exam, planning.majorIds));
          items.push(...exams.map(toExamCalendarItem));
        }
        if (
          planning?.proposal &&
          intervalsOverlap(planning.proposal, {
            start: range.startStr,
            end: range.endStr,
          })
        )
          items.push(toProposalCalendarItem(planning.proposal));
        setCount(items.length);
        success(items);
      } catch (cause) {
        setError(true);
        failure(
          cause instanceof Error ? cause : new Error("Could not load events."),
        );
      }
    },
    [filters, planning],
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
  const selectItem = (event: EventApi) => {
    if (event.extendedProps.kind === "exam")
      planning?.onExamSelect(event.extendedProps.exam as Exam);
    else if (event.extendedProps.kind === "proposal")
      planning?.onProposalSelect();
    else onEventSelect(event.id);
  };
  const itemLabel = (event: EventApi) =>
    `${event.title}. ${event.extendedProps.timeLabel}. ${event.extendedProps.category}. ${mobile && event.extendedProps.hosts ? `${event.extendedProps.hosts}. ` : ""}${event.extendedProps.kind === "proposal" ? "Open proposal form." : event.extendedProps.kind === "exam" ? "Open exam details." : "Fictional example. Open event details."}`;
  const datesSet = (range: DatesSetArg) => {
    setTitle(range.view.title);
    setShowGroupYear(
      listRangeCrossesYears(
        range.startStr.slice(0, 10),
        range.endStr.slice(0, 10),
      ),
    );
  };
  return (
    <section
      className={`calendar-region ${mobile && view.startsWith("list") ? "mobile-calendar" : ""}`}
      aria-label={
        planning
          ? "Planning calendar with academic exams"
          : "Student events calendar"
      }
    >
      <div className="range-heading">
        <h2 aria-live="polite">{title || "Loading calendar…"}</h2>
        <span className="timezone-label">All Times Eastern (ET)</span>
      </div>
      <div className="calendar-toolbar">
        <div
          className="calendar-navigation"
          role="group"
          aria-label="Date navigation"
        >
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
      <div className="calendar-summary">
        <p role="status">
          {error
            ? "Unable to load events."
            : count === null
              ? "Loading events…"
              : `${count} ${planning ? "calendar items" : count === 1 ? "event" : "events"} in this range`}
        </p>
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
          }}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
          }}
          listDayFormat={
            mobile
              ? {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: showGroupYear ? "numeric" : undefined,
                }
              : undefined
          }
          listDaySideFormat={mobile ? false : undefined}
          eventOrder="start,title"
          eventOrderStrict={mobile && view.startsWith("list")}
          eventInteractive
          navLinks={false}
          allDayText="All day"
          noEventsContent={() => (
            <div className="empty-state">
              <h3>
                {planning
                  ? "No visible planning items in this range"
                  : "No published events in this range"}
              </h3>
              <p>
                {planning
                  ? "Try another date or restore the calendar display. Analysis remains tied to the proposal."
                  : "Try another date, adjust your search, or clear your filters."}
              </p>
              <button className="control" onClick={onReset}>
                {planning ? "Restore calendar display" : "Clear filters"}
              </button>
            </div>
          )}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            selectItem(info.event);
          }}
          eventContent={(info) => {
            const cardTimes = (
              info.event.extendedProps.listTimes as string[]
            ).map((label) =>
              label === "Next day" && !info.isStart ? "From prev day" : label,
            );
            const content = (
              <span className="calendar-event-content">
                <span className="event-time">
                  {cardTimes.map((part, index) => (
                    <span className="time-part" key={index}>
                      {part}
                    </span>
                  ))}
                </span>
                <span className="event-title">
                  {info.event.title.replace(/^Synthetic example: /, "")}
                </span>
                <span className="event-category">
                  {info.event.extendedProps.category}
                  {!info.event.extendedProps.kind && " · Example"}
                </span>
              </span>
            );
            return info.view.type.startsWith("list") ? (
              <button
                type="button"
                className={`list-event-trigger ${mobile ? "mobile-list-event" : ""}`}
                data-calendar-event-id={info.event.id}
                aria-label={itemLabel(info.event)}
                onClick={(click) => {
                  click.stopPropagation();
                  selectItem(info.event);
                }}
              >
                {mobile ? (
                  <span className="mobile-list-content">
                    <span className="event-title">
                      {info.event.title.replace(/^Synthetic example: /, "")}
                    </span>
                    <span className="list-event-times" aria-hidden="true">
                      {cardTimes.map((part, index) => {
                        const isNote =
                          /Next day|From prev day|^\+\d+ days$/.test(part);
                        return (
                          <span
                            className={`time-part ${isNote ? "time-note" : ""}`}
                            key={index}
                          >
                            {isNote ? `(${part})` : part}
                          </span>
                        );
                      })}
                    </span>
                    <span className="event-category">
                      {info.event.extendedProps.category}
                      {info.event.extendedProps.hosts &&
                        ` · ${info.event.extendedProps.hosts}`}
                    </span>
                  </span>
                ) : (
                  <>
                    <span className="list-event-times" aria-hidden="true">
                      {cardTimes.map((time, index) => (
                        <span key={time + index}>
                          <span className="time-part">{time}</span>
                        </span>
                      ))}
                    </span>
                    {content}
                  </>
                )}
              </button>
            ) : (
              content
            );
          }}
          eventDidMount={(info) => {
            // List titles use native buttons; retain the table's row semantics.
            if (info.view.type.startsWith("list")) return;
            const trigger = info.el;
            trigger.dataset.calendarEventId = info.event.id;
            trigger.tabIndex = 0;
            trigger.setAttribute("role", "button");
            trigger.onkeydown = (key) => {
              if (key.key === "Enter" || key.key === " ") {
                key.preventDefault();
                selectItem(info.event);
              }
            };
            trigger.setAttribute("aria-label", itemLabel(info.event));
          }}
        />
      </div>
      {count === 0 && view !== "listMonth" && (
        <div className="empty-state">
          <p>
            {planning
              ? "No visible planning items match this range and display selection."
              : "No published events match this range and filters."}
          </p>
          <button className="control" onClick={onReset}>
            {planning ? "Restore calendar display" : "Clear filters"}
          </button>
        </div>
      )}
    </section>
  );
}
