"use client";
import { dayGridItems } from "./display-items";
import { ExternalEventDetails } from "./external-event-details";
import type { ExternalEvent } from "../../lib/domain/external-events";
import { plannerEventOrder } from "./planner-presentation";
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
  DayHeaderContentArg,
} from "@fullcalendar/core";
import {
  DISPLAY_TIME_ZONE,
  easternDate,
  addCalendarDays,
  formatAllDayDate,
} from "../../lib/time/eastern";
import type { Exam } from "../../lib/domain/models";
import type { DisplayDay } from "./display-busyness";
import { DayActivityDots, DayActivityContext } from "./day-activity";
import { listRangeCrossesYears } from "./calendar-events";
import { getWeeklyPlanningContext } from "../../lib/data/weekly-planning";
import {
  calendarWeeks,
  summarizeWeek,
  type WeeklySummary,
} from "../../lib/domain/weekly-planning";
import {
  PLANNER_VIEWS,
  type PlannerCalendarView,
} from "../../lib/domain/planner-calendar-state";
import {
  WeeklySummaryCell,
  WeeklyDetails,
} from "../planner/weekly-intelligence";
import { PressurePanel } from "../planner/pressure-panel";
import { CompactWeeklySummaries } from "../planner/compact-weekly-summaries";
import { CalendarToolbar } from "./calendar-toolbar";
import { CalendarItemContent } from "./calendar-item-content";
import {
  loadCalendarItems,
  loadCalendarScheduling,
  loadCalendarDisplayDays,
} from "./calendar-source";
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
    previewItems,
  } = props;
  const changeView = (id: PlannerCalendarView) => {
    if (props.planning) props.onViewChange(id);
    else if (id !== "dayGridTwoWeeks") props.onViewChange(id);
  };
  const surface = useRef<HTMLDivElement>(null);
  const [timeStackLimit, setTimeStackLimit] = useState(3);
  useEffect(() => {
    const element = surface.current;
    if (!element || !view.startsWith("timeGrid")) return;
    const update = () => {
      const column = element.querySelector(".fc-timegrid-col-events");
      const width = column?.getBoundingClientRect().width ?? 0;
      if (width) setTimeStackLimit(width < 168 ? 2 : 3);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, [view]);
  const [window, setWindow] = useState({
    start: date,
    end: addCalendarDays(date, 1),
  });
  const [externalSelection, setExternalSelection] = useState<{
    event: ExternalEvent;
    triggerId: string;
  } | null>(null);
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
  const displayDays = useMemo(
    () =>
      planning
        ? loadCalendarDisplayDays(window, filters, planning)
        : new Map<string, DisplayDay>(),
    [window, filters, planning],
  );
  const displayDay = (day: string) =>
    displayDays.get(day) ?? { date: day, items: [], filled: 0 };
  const plannerDayHeader = (info: DayHeaderContentArg) => {
    if (info.view.type.startsWith("dayGrid")) return info.text;
    const date = easternDate(info.date.toISOString());
    return (
      <span className="planner-date-header">
        <span
          className={
            info.view.type.startsWith("list")
              ? "fc-list-day-text"
              : "planner-date-label"
          }
          id={"textId" in info ? String(info.textId) : undefined}
        >
          {info.text}
        </span>
        <DayActivityDots day={displayDay(date)} />
      </span>
    );
  };
  const densityDays = useMemo(
    () => new Map(scheduling?.days.map((day) => [day.date, day]) ?? []),
    [scheduling],
  );
  useEffect(() => {
    surface.current
      ?.querySelectorAll<HTMLElement>(".fc-daygrid-day[data-date]")
      .forEach((cell) => {
        if (planning?.showDensity && view.startsWith("dayGrid")) {
          const count =
            densityDays.get(cell.dataset.date!)?.maximumConcurrent ?? 0;
          cell.setAttribute(
            "aria-description",
            `${cell.dataset.date}: peak known-time non-exam subgroup density, ${count >= 3 ? "3 or more" : count} simultaneous commitments. This is not a pressure or safety rating; unknown hours and date-wide commitments are separate.`,
          );
        } else cell.removeAttribute("aria-description");
      });
  }, [densityDays, planning?.showDensity, view]);
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
        const canonicalItems =
          reviewExams && examReview
            ? stagedExamCalendarItems(reviewExams, examReview.dataset)
            : previewItems
              ? previewItems.filter((item) => {
                  const start = item.allDay
                    ? String(item.start)
                    : easternDate(String(item.start));
                  const last = item.allDay
                    ? addCalendarDays(String(item.end), -1)
                    : easternDate(
                        new Date(
                          Date.parse(String(item.end)) - 1,
                        ).toISOString(),
                      );
                  return (
                    start < range.endStr.slice(0, 10) &&
                    last >= range.startStr.slice(0, 10)
                  );
                })
              : loadCalendarItems(range, filters, planning);
        const items =
          view.startsWith("dayGrid") && !examReview
            ? dayGridItems(canonicalItems)
            : canonicalItems;
        setError(false);
        setCount(reviewExams ? reviewExams.length : canonicalItems.length);
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
    [filters, planning, view, examReview, previewItems],
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
    const id = event.extendedProps.canonicalEventId ?? event.id;
    if (event.extendedProps.kind === "exam-review" && examReview)
      examReview.onSelect(event.extendedProps.canonicalExamId, event.id);
    else if (event.extendedProps.kind === "external")
      setExternalSelection({
        event: event.extendedProps.externalEvent,
        triggerId: event.id,
      });
    else if (event.extendedProps.kind === "exam")
      planning?.onExamSelect(event.extendedProps.exam as Exam);
    else if (event.extendedProps.kind === "proposal")
      planning?.onProposalSelect();
    else onEventSelect(id);
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
  const focusCalendarWeek = (week: WeeklySummary) => {
    changeView("timeGridWeek");
    onDateChange(week.start);
    setSummarySelection({ date: week.start, start: week.start });
    requestAnimationFrame(() =>
      surface.current
        ?.closest("section")
        ?.querySelector<HTMLElement>(".range-heading h2")
        ?.focus(),
    );
  };
  const itemLabel = (event: EventApi) =>
    event.extendedProps.kind === "exam-review"
      ? (event.extendedProps.reviewLabel as string)
      : `${event.title}. ${event.extendedProps.hosts ? `Hosted by ${event.extendedProps.hosts}. ` : ""}${event.extendedProps.hostingIdentity === "psu-hosted" ? "PSU Hosted. " : event.extendedProps.hostingIdentity === "co-hosted" ? "Co-hosted by Penn State and a student organization. " : ""}${event.extendedProps.timeLabel}. ${event.extendedProps.category}. ${event.extendedProps.kind === "proposal" ? "Open proposal form." : event.extendedProps.kind === "external" ? "Example scenario, not a real or verified event. Open external event details." : event.extendedProps.kind === "exam" ? "Open exam details." : "Fictional Example Event. Open event details."}`;
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
        <h2 aria-live="polite" tabIndex={-1}>
          {title || "Loading calendar…"}
        </h2>
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
      {!planning && !examReview && <CategoryLegend />}
      <div
        ref={surface}
        className={`calendar-surface ${planning && view === "timeGridDay" ? "planner-day-surface" : ""} ${monthSummaries ? "planner-month-surface" : ""} ${planning?.showDensity ? "density-enabled" : ""}`}
      >
        {planning && view === "timeGridDay" && (
          <>
            <button
              type="button"
              className="control day-edge-nav previous-day"
              aria-label="Previous day"
              onClick={() => navigate("prev")}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className="control day-edge-nav next-day"
              aria-label="Next day"
              onClick={() => navigate("next")}
            >
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}
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
          slotEventOverlap
          eventMaxStack={timeStackLimit}
          eventMinHeight={1}
          eventShortHeight={54}
          dayMaxEvents={view.startsWith("timeGrid") ? undefined : 4}
          // The timeGrid header is a compact region; every additional record
          // remains available in FullCalendar's keyboard-operable popover.
          dayMaxEventRows={view.startsWith("timeGrid") ? 2 : undefined}
          // FullCalendar's num is the hidden segment count, never the day's
          // total or activity-dot count (which may include hidden layers).
          moreLinkContent={planning ? (info) => `+${info.num} more` : undefined}
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
          eventOrder={
            planning && view.startsWith("dayGrid")
              ? plannerEventOrder
              : view.startsWith("timeGrid")
                ? "start,-duration,title"
                : "start,title"
          }
          eventOrderStrict={
            (!!planning && view.startsWith("dayGrid")) ||
            view.startsWith("timeGrid") ||
            (mobile && view.startsWith("list"))
          }
          eventInteractive
          navLinks={false}
          dayHeaderContent={planning ? plannerDayHeader : undefined}
          dayCellContent={(info) =>
            planning && view.startsWith("dayGrid") ? (
              <span className="planner-cell-date">
                <span>{info.dayNumberText}</span>
                <DayActivityDots
                  day={displayDay(easternDate(info.date.toISOString()))}
                />
              </span>
            ) : (
              info.dayNumberText
            )
          }
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
              {planning && view.startsWith("list") && (
                <div
                  className="empty-activity-dates"
                  aria-label="Broad-scope calendar activity"
                >
                  {[...displayDays.values()]
                    .filter((day) => day.items.length > 0)
                    .map((day) => (
                      <span className="empty-activity-date" key={day.date}>
                        <span>{formatAllDayDate(day.date)}</span>
                        <DayActivityDots day={day} />
                      </span>
                    ))}
                </div>
              )}
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
            info.jsEvent.stopPropagation();
            selectItem(info.event);
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
            trigger.dataset.canonicalEventId =
              info.event.extendedProps.canonicalEventId ?? info.event.id;
            trigger.tabIndex = 0;
            trigger.setAttribute("role", "button");
            trigger.onkeydown = (key) => {
              if (key.key === "Enter" || key.key === " ") {
                key.preventDefault();
                key.stopPropagation();
                selection.current(info.event);
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
      {planning && (
        <div className="planner-calendar-context">
          <p className="field-help activity-explanation">
            Calendar activity: one dot per displayed commitment, up to five.
            PSU-wide and national events always count, even when hidden.
            Proposals are excluded. This is not a scheduling score.
          </p>
          {view === "timeGridDay" && (
            <DayActivityContext day={displayDay(window.start)} />
          )}
          {!monthSummaries && view !== "timeGridDay" && activeSummaryWeek && (
            <CompactWeeklySummaries
              weeks={weeks}
              activeWeek={activeSummaryWeek}
              onWeekChange={(start) => setSummarySelection({ date, start })}
              onOpen={openWeek}
              onFocusWeek={focusCalendarWeek}
            />
          )}
          {scheduling && (
            <CalendarSchedulingGuidance
              days={scheduling.days}
              showDensity={!!planning.showDensity}
              list={view.startsWith("list")}
            />
          )}
          {context && view.startsWith("timeGrid") && (
            <details className="planner-analysis-details">
              <summary>
                Inspect scheduling analysis and exam preparation
              </summary>
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
            </details>
          )}
        </div>
      )}
      {externalSelection && (
        <ExternalEventDetails
          event={externalSelection.event}
          triggerId={externalSelection.triggerId}
          onClose={() => setExternalSelection(null)}
        />
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
