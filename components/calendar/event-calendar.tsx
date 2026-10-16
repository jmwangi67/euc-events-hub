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
import {
  DISPLAY_TIME_ZONE,
  easternDate,
  addCalendarDays,
} from "../../lib/time/eastern";
import type { CalendarView } from "../../lib/domain/calendar-state";
import type { Exam } from "../../lib/domain/models";
import { intervalsOverlap, type Proposal } from "../../lib/domain/planning";
import {
  toExamCalendarItem,
  toProposalCalendarItem,
  toExternalCalendarItem,
} from "./planner-events";
import { listRangeCrossesYears, toCalendarEvent } from "./calendar-events";

import {
  eventAudienceMatch,
  examAudienceMatch,
  type PlanningAudience,
} from "../../lib/domain/planning-audience";
import {
  getExternalEvents,
  getWeeklyPlanningContext,
} from "../../lib/data/weekly-planning";
import {
  calendarWeeks,
  summarizeWeek,
  type WeeklySummary,
  weekForInstant,
} from "../../lib/domain/weekly-planning";
import {
  WeeklySummaryCell,
  WeeklyDetails,
  WeekPressurePreview,
} from "../planner/weekly-intelligence";

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
    audience: PlanningAudience;
    proposal: Proposal | null;
    showEvents: boolean;
    showExams: boolean;
    showCampusLocal: boolean;
    showNational: boolean;
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
  const surface = useRef<HTMLDivElement>(null);
  const [window, setWindow] = useState({
    start: date,
    end: addCalendarDays(date, 1),
  });
  const [weekTriggerId, setWeekTriggerId] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<WeeklySummary | null>(null);
  const [weekLayout, setWeekLayout] = useState({
    header: 28,
    rows: [] as number[],
  });
  const planningAudience = planning?.audience;
  const isPlanning = !!planningAudience;
  const context = useMemo(
    () => (isPlanning ? getWeeklyPlanningContext(window) : null),
    [window, isPlanning],
  );
  const weeks = useMemo(
    () =>
      planningAudience && context
        ? calendarWeeks(window.start, window.end).map((week) =>
            summarizeWeek(week, planningAudience, context),
          )
        : [],
    [window, planningAudience, context],
  );
  const monthSummaries = !!planning && !mobile && view === "dayGridMonth";
  useEffect(() => {
    if (!monthSummaries || !surface.current) return;
    const root = surface.current;
    const measure = () => {
      const rows = Array.from(
        root.querySelectorAll(".fc-daygrid-body > table > tbody > tr"),
      );
      if (!rows.length) return;
      const header =
        rows[0].getBoundingClientRect().top - root.getBoundingClientRect().top;
      const heights = rows.map((row) => row.getBoundingClientRect().height);
      setWeekLayout((current) =>
        Math.abs(current.header - header) < 0.1 &&
        current.rows.join() === heights.join()
          ? current
          : { header, rows: heights },
      );
    };
    const observer = new ResizeObserver(measure);
    const calendarElement = root.querySelector(".fc");
    if (calendarElement) observer.observe(calendarElement);
    root
      .querySelectorAll(".fc-daygrid-body > table > tbody > tr")
      .forEach((row) => observer.observe(row));
    measure();
    return () => observer.disconnect();
  }, [monthSummaries, window, weeks]);
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
                filters: planning ? undefined : filters,
              });
        setError(false);
        const organizations = getOrganizations();
        const items: EventInput[] = events
          .filter(
            (event) =>
              !planning ||
              eventAudienceMatch(event, planning.audience, organizations)
                .relevant,
          )
          .map((event) => {
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
          }).filter(
            (exam) => examAudienceMatch(exam, planning.audience).relevant,
          );
          items.push(...exams.map(toExamCalendarItem));
        }
        if (planning) {
          const external = getExternalEvents({
            start: range.startStr.slice(0, 10),
            end: range.endStr.slice(0, 10),
          }).filter((event) =>
            event.scope === "national"
              ? planning.showNational
              : planning.showCampusLocal,
          );
          items.push(...external.map(toExternalCalendarItem));
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
  const selectItem = (event: EventApi, segmentDate?: string) => {
    setWeekTriggerId(event.id);
    if (event.extendedProps.kind === "external" && planning && context) {
      const external = event.extendedProps.externalEvent;
      const eventWeek = segmentDate
        ? calendarWeeks(segmentDate, addCalendarDays(segmentDate, 1))[0]
        : external.timeKnown
          ? weekForInstant(external.start)
          : calendarWeeks(external.startDate, external.endDate)[0];
      const week = weeks.find((w) => w.start === eventWeek.start) ?? weeks[0];
      if (week)
        setSelectedWeek(summarizeWeek(week, planning.audience, context));
    } else if (event.extendedProps.kind === "exam")
      planning?.onExamSelect(event.extendedProps.exam as Exam);
    else if (event.extendedProps.kind === "proposal")
      planning?.onProposalSelect();
    else onEventSelect(event.id);
  };
  const selection = useRef(selectItem);
  useEffect(() => {
    selection.current = selectItem;
  });
  const openWeek = (week: WeeklySummary) => {
    setWeekTriggerId(`week:${week.start}`);
    setSelectedWeek(week);
  };
  const itemLabel = (event: EventApi) =>
    `${event.title}. ${event.extendedProps.timeLabel}. ${event.extendedProps.category}. ${mobile && event.extendedProps.hosts ? `${event.extendedProps.hosts}. ` : ""}${event.extendedProps.kind === "proposal" ? "Open proposal form." : event.extendedProps.kind === "external" ? "Synthetic scenario. Open weekly summary details." : event.extendedProps.kind === "exam" ? "Open exam details." : "Fictional example. Open event details."}`;
  const datesSet = (range: DatesSetArg) => {
    setTitle(range.view.title);
    const next = {
      start: range.startStr.slice(0, 10),
      end: range.endStr.slice(0, 10),
    };
    setWindow((current) =>
      current.start === next.start && current.end === next.end ? current : next,
    );
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
      {planning && context && view === "timeGridWeek" && (
        <WeekPressurePreview
          start={weeks[0]?.start ?? window.start}
          audience={planning.audience}
          context={context}
        />
      )}
      <div
        ref={surface}
        className={`calendar-surface ${monthSummaries ? "planner-month-surface" : ""}`}
      >
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
          stickyHeaderDates={planning ? false : undefined}
          slotEventOverlap={planning ? false : undefined}
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
            selectItem(
              info.event,
              (info.jsEvent.target as HTMLElement).closest<HTMLElement>(
                "[data-date]",
              )?.dataset.date,
            );
          }}
          eventContent={(info) => {
            if (
              info.event.extendedProps.kind === "external" &&
              info.view.type === "dayGridMonth"
            )
              return (
                <span className="external-indicator">
                  <span aria-hidden="true">◆</span>{" "}
                  {info.event.title.replace(/^Synthetic /, "")}
                  <span className="sr-only">
                    {" "}
                    · Synthetic scenario · See weekly summary
                  </span>
                </span>
              );
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
                selection.current(
                  info.event,
                  trigger.closest<HTMLElement>("[data-date]")?.dataset.date,
                );
              }
            };
            trigger.setAttribute("aria-label", itemLabel(info.event));
          }}
        />
        {monthSummaries && (
          <aside
            className="weekly-summary-column"
            aria-label="Weekly scheduling summaries"
          >
            <div
              className="weekly-column-heading"
              style={{ height: weekLayout.header }}
            >
              Week summary
            </div>
            {weeks.map((week, index) => (
              <WeeklySummaryCell
                key={week.start}
                week={week}
                onSelect={openWeek}
                height={weekLayout.rows[index]}
              />
            ))}
          </aside>
        )}
      </div>
      {planning && !monthSummaries && (
        <section
          className="compact-weekly-summaries"
          aria-label="Weekly scheduling summaries"
        >
          <h3>Weekly scheduling summaries</h3>
          <p className="field-help">
            All analysis layers included, even when hidden. Overall scoring
            methodology awaiting review.
          </p>
          {weeks.map((week) => (
            <WeeklySummaryCell
              key={week.start}
              week={week}
              onSelect={openWeek}
            />
          ))}
        </section>
      )}
      {selectedWeek && planning && (
        <WeeklyDetails
          triggerId={weekTriggerId}
          week={selectedWeek}
          audience={planning.audience}
          onClose={() => setSelectedWeek(null)}
        />
      )}
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
