"use client";
import { CategoryLegend } from "./category-legend";
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
} from "@fullcalendar/core";
import {
  DISPLAY_TIME_ZONE,
  easternDate,
  addCalendarDays,
} from "../../lib/time/eastern";
import type { Exam } from "../../lib/domain/models";
import { listRangeCrossesYears } from "./calendar-events";
import { getWeeklyPlanningContext } from "../../lib/data/weekly-planning";
import {
  calendarWeeks,
  summarizeWeek,
  type WeeklySummary,
  weekForInstant,
} from "../../lib/domain/weekly-planning";
import {
  PLANNER_VIEWS,
  type PlannerCalendarView,
} from "../../lib/domain/planner-calendar-state";
import {
  WeeklySummaryCell,
  WeeklyDetails,
  weekLabel,
} from "../planner/weekly-intelligence";
import { PressurePanel } from "../planner/pressure-panel";
import { CompactWeeklySummaries } from "../planner/compact-weekly-summaries";
import { CalendarToolbar } from "./calendar-toolbar";
import { CalendarItemContent } from "./calendar-item-content";
import { loadCalendarItems, loadCalendarScheduling } from "./calendar-source";
import {
  CalendarSchedulingGuidance,
  EventScopeLegend,
  SchedulingDensityLegend,
  densityCalendarItems,
} from "./calendar-density";
import { useWeekLayout } from "./use-week-layout";
import type { EventCalendarProps } from "./calendar-types";
import { queryStagedExams } from "../../lib/exams/staging";
import { stagedExamCalendarItems } from "./staged-exam-events";

const studentViews: [PlannerCalendarView, string][] = [
  ["dayGridMonth", "Month"],
  ["timeGridWeek", "Week"],
  ["timeGridDay", "Day"],
  ["listMonth", "List"],
];

/** The only UI adapter that knows FullCalendar APIs, plugins, and data mapping. */
export function EventCalendar(props: EventCalendarProps) {
  const {
    date,
    view,
    filters,
    onDateChange,
    onEventSelect,
    onReset,
    mobile,
    planning,
    examReview,
  } = props;
  const changeView = (id: PlannerCalendarView) => {
    if (props.planning) props.onViewChange(id);
    else if (id !== "dayGridTwoWeeks") props.onViewChange(id);
  };
  const surface = useRef<HTMLDivElement>(null);
  const [window, setWindow] = useState({
    start: date,
    end: addCalendarDays(date, 1),
  });
  const [weekTriggerId, setWeekTriggerId] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<WeeklySummary | null>(null);
  const [summarySelection, setSummarySelection] = useState<{
    date: string;
    start: string;
  } | null>(null);
  const planningAudience = planning?.audience;
  const isPlanning = !!planningAudience;
  const context = useMemo(
    () => (isPlanning ? getWeeklyPlanningContext(window) : null),
    [window, isPlanning],
  );
  const scheduling = useMemo(
    () =>
      planningAudience
        ? loadCalendarScheduling(window, planningAudience)
        : null,
    [window, planningAudience],
  );
  const densityDays = useMemo(
    () => new Map(scheduling?.days.map((day) => [day.date, day]) ?? []),
    [scheduling],
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
  const monthSummaries = !!planning && !mobile && view.startsWith("dayGrid");
  const activeSummaryWeek =
    weeks.find(
      (week) =>
        summarySelection?.date === date &&
        week.start === summarySelection.start,
    ) ??
    weeks.find((week) => week.start <= date && week.end > date) ??
    weeks.find((week) => week.counts.uniqueTotal > 0) ??
    weeks[0];
  const weekLayout = useWeekLayout(
    surface,
    monthSummaries,
    `${view}:${window.start}:${window.end}:${weeks.map((week) => week.counts.uniqueTotal).join()}`,
  );
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
        const reviewExams = examReview
          ? queryStagedExams(
              examReview.dataset,
              range.startStr.slice(0, 10),
              range.endStr.slice(0, 10),
            )
          : null;
        const items =
          reviewExams && examReview
            ? stagedExamCalendarItems(reviewExams, examReview.dataset)
            : loadCalendarItems(range, filters, planning);
        setError(false);
        setCount(reviewExams ? reviewExams.length : items.length);
        success(
          planning?.showDensity && view.startsWith("timeGrid")
            ? [
                ...items,
                ...densityCalendarItems(
                  loadCalendarScheduling(
                    {
                      start: range.startStr.slice(0, 10),
                      end: range.endStr.slice(0, 10),
                    },
                    planning.audience,
                  ).timeSegments,
                ),
              ]
            : items,
        );
      } catch (cause) {
        setError(true);
        failure(
          cause instanceof Error ? cause : new Error("Could not load events."),
        );
      }
    },
    [filters, planning, view, examReview],
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
    if (event.extendedProps.kind === "exam-review" && examReview) {
      examReview.onSelect(event.extendedProps.canonicalExamId, event.id);
    } else if (event.extendedProps.kind === "external" && planning && context) {
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
    setSummarySelection({ date, start: week.start });
    setWeekTriggerId(`week:${week.start}`);
    setSelectedWeek(week);
  };
  const weekAction = useRef((start: string) => {
    void start;
  });
  useEffect(() => {
    weekAction.current = (start: string) => {
      const week = weeks.find((week) => week.start === start);
      if (week) openWeek(week);
    };
  });
  const focusCalendarWeek = (week: WeeklySummary) => {
    surface.current
      ?.querySelector<HTMLElement>(`[data-date="${week.start}"] .week-row-link`)
      ?.focus();
  };
  const itemLabel = (event: EventApi) =>
    event.extendedProps.kind === "exam-review"
      ? (event.extendedProps.reviewLabel as string)
      : `${event.title}. ${event.extendedProps.hosts ? `Hosted by ${event.extendedProps.hosts}. ` : ""}${event.extendedProps.hostingIdentity === "psu-hosted" ? "PSU Hosted. " : event.extendedProps.hostingIdentity === "co-hosted" ? "Co-hosted by Penn State and a student organization. " : ""}${event.extendedProps.timeLabel}. ${event.extendedProps.category}. ${event.extendedProps.kind === "proposal" ? "Open proposal form." : event.extendedProps.kind === "external" ? "Example scenario, not a real or verified event. Open weekly summary details." : event.extendedProps.kind === "exam" ? "Open exam details." : "Fictional Example Event. Open event details."}`;
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
      className={`calendar-region ${examReview ? "academic-review-calendar" : planning ? "planner-calendar" : "student-category-calendar"} ${mobile && view.startsWith("list") ? "mobile-calendar" : ""}`}
      aria-label={
        examReview
          ? "Private academic exam review calendar"
          : planning
            ? "Planning calendar with academic exams"
            : "Student events calendar"
      }
    >
      <div className="range-heading">
        <h2 aria-live="polite">{title || "Loading calendar…"}</h2>
        <span className="timezone-label">All Times Eastern (ET)</span>
      </div>
      <CalendarToolbar
        date={date}
        view={view}
        views={(planning ? PLANNER_VIEWS : studentViews).filter(
          ([id]) => !mobile || id === "listMonth" || id === "timeGridDay",
        )}
        onNavigate={navigate}
        onViewChange={changeView}
        onDateChange={(next) => {
          calendar.current?.getApi().gotoDate(next);
          onDateChange(next);
          setSummarySelection({
            date: next,
            start: calendarWeeks(next, addCalendarDays(next, 1))[0].start,
          });
        }}
      />
      <div className="calendar-summary">
        <p role="status">
          {error
            ? "Unable to load events."
            : count === null
              ? "Loading events…"
              : `${count} ${examReview ? "canonical exam occurrences" : planning ? "calendar items" : count === 1 ? "event" : "events"} in this range`}
        </p>
      </div>
      {error && (
        <p role="alert">
          Events could not be loaded. Change the date range to retry.
        </p>
      )}
      {planning && <EventScopeLegend />}
      {planning?.showDensity && (
        <SchedulingDensityLegend
          segments={
            view.startsWith("timeGrid") ? scheduling?.timeSegments : undefined
          }
        />
      )}
      {planning && scheduling && (
        <CalendarSchedulingGuidance
          days={scheduling.days}
          showDensity={!!planning.showDensity}
          list={view.startsWith("list")}
        />
      )}
      {planning && context && view.startsWith("timeGrid") && (
        <PressurePanel
          start={
            view === "timeGridDay"
              ? window.start
              : (weeks[0]?.start ?? window.start)
          }
          days={view === "timeGridDay" ? 1 : 7}
          audience={planning.audience}
          context={context}
        />
      )}
      {planning && !monthSummaries && activeSummaryWeek && (
        <CompactWeeklySummaries
          weeks={weeks}
          activeWeek={activeSummaryWeek}
          onWeekChange={(start) => setSummarySelection({ date, start })}
          onOpen={openWeek}
        />
      )}
      {!planning && !examReview && <CategoryLegend />}
      <div
        ref={surface}
        className={`calendar-surface ${monthSummaries ? "planner-month-surface" : ""} ${planning?.showDensity ? "density-enabled" : ""}`}
      >
        <FullCalendar
          key={view}
          ref={calendar}
          plugins={plugins}
          views={{
            dayGridTwoWeeks: {
              type: "dayGrid",
              duration: { weeks: 2 },
              dateAlignment: "week",
              dateIncrement: { weeks: 2 },
            },
          }}
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
          listDayFormat={{
            weekday: "long",
            month: "long",
            day: "numeric",
            year: showGroupYear ? "numeric" : undefined,
          }}
          listDaySideFormat={false}
          eventOrder="start,title"
          eventOrderStrict={mobile && view.startsWith("list")}
          eventInteractive
          navLinks={false}
          dayCellContent={(info) => {
            if (!planning?.showDensity || !view.startsWith("dayGrid"))
              return info.dayNumberText;
            const date = easternDate(info.date.toISOString());
            const count = densityDays.get(date)?.maximumConcurrent ?? 0;
            return (
              <>
                {info.dayNumberText}
                <span
                  className="density-cell-count"
                  aria-label={`Peak known-time subgroup density on ${date}: ${count >= 3 ? "3 or more" : count} simultaneous commitments`}
                >
                  {count >= 3 ? "3+" : count} timed
                </span>
              </>
            );
          }}
          dayCellClassNames={(info) => {
            const date = easternDate(info.date.toISOString());
            const week = weeks.find(
              (week) => week.start <= date && week.end > date,
            );
            const classes = monthSummaries
              ? [
                  week?.counts.uniqueTotal
                    ? "planner-week-populated"
                    : "planner-week-empty",
                ]
              : [];
            if (planning?.showDensity && view.startsWith("dayGrid"))
              classes.push(`density-${densityDays.get(date)?.band ?? "none"}`);
            if (densityDays.get(date)?.primaryCaution)
              classes.push("has-scheduling-guidance");
            return classes;
          }}
          dayCellDidMount={(info) => {
            if (!monthSummaries) return;
            const date = easternDate(info.date.toISOString());
            const week = calendarWeeks(date, addCalendarDays(date, 1))[0];
            if (week.start !== date) return;
            const top = info.el.querySelector(".fc-daygrid-day-top");
            if (!top) return;
            const button = document.createElement("button");
            button.type = "button";
            button.className = "week-row-link";
            button.textContent = "Week details";
            button.dataset.calendarEventId = `week:${week.start}`;
            button.setAttribute(
              "aria-label",
              `Week details: ${weekLabel(week)}. Open weekly summary.`,
            );
            button.setAttribute("aria-haspopup", "dialog");
            button.onclick = (event) => {
              event.stopPropagation();
              weekAction.current(week.start);
            };
            top.append(button);
          }}
          dayCellWillUnmount={(info) => {
            info.el.querySelector(".week-row-link")?.remove();
          }}
          allDayText={examReview ? "Date options" : "All day"}
          noEventsContent={() => (
            <div className="empty-state">
              <h3>
                {examReview
                  ? "No staged exam occurrences in this range"
                  : planning
                    ? "No visible planning items in this range"
                    : "No published events in this range"}
              </h3>
              <p>
                {examReview
                  ? "Choose a reported or possible testing date. This review does not publish records."
                  : planning
                    ? "Try another date or restore the calendar display. Analysis remains tied to the proposal."
                    : "Try another date, adjust your search, or clear your filters."}
              </p>
              <button className="control" onClick={onReset}>
                {examReview
                  ? "Return to first exam date"
                  : planning
                    ? "Restore calendar display"
                    : "Clear filters"}
              </button>
            </div>
          )}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            if (info.event.extendedProps.kind === "density") return;
            selectItem(
              info.event,
              (info.jsEvent.target as HTMLElement).closest<HTMLElement>(
                "[data-date]",
              )?.dataset.date,
            );
          }}
          eventContent={(info) => (
            <CalendarItemContent
              info={info}
              mobile={mobile}
              itemLabel={itemLabel}
              selectItem={selectItem}
              planner={!!planning}
            />
          )}
          eventDidMount={(info) => {
            if (info.event.extendedProps.kind === "density") {
              info.el.setAttribute("aria-hidden", "true");
              info.el.removeAttribute("tabindex");
              return;
            }
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
                onFocusWeek={focusCalendarWeek}
              />
            ))}
          </aside>
        )}
      </div>
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
