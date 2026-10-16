import { dateOnlySchema } from "./models";
import type { Event, Exam, Organization } from "./models";
import type { ExternalEvent } from "./external-events";
import {
  eventAudienceMatch,
  examAudienceMatch,
  type PlanningAudience,
} from "./planning-audience";
import { addCalendarDays, easternDate, easternDayStart } from "../time/eastern";
import { intervalsOverlap } from "./planning";
import { combinedExamPreparation } from "./exam-pressure";
export type PlanningContext = {
  events: readonly Event[];
  exams: readonly Exam[];
  externalEvents: readonly ExternalEvent[];
  organizations: readonly Organization[];
};
export type WeeklySummary = ReturnType<typeof summarizeWeek>;
export function calendarWeeks(start: string, end: string) {
  dateOnlySchema.parse(start);
  dateOnlySchema.parse(end);
  if (end <= start) throw new RangeError("End must follow start.");
  const sunday = addCalendarDays(
    start,
    -new Date(`${start}T00:00:00Z`).getUTCDay(),
  );
  const weeks: { start: string; end: string }[] = [];
  for (let date = sunday; date < end; date = addCalendarDays(date, 7))
    weeks.push({ start: date, end: addCalendarDays(date, 7) });
  return weeks;
}
export function eventInterval(event: Event | ExternalEvent) {
  return "allDay" in event
    ? event.allDay
      ? { start: easternDayStart(event.start), end: easternDayStart(event.end) }
      : event
    : event.timeKnown
      ? event
      : {
          start: easternDayStart(event.startDate),
          end: easternDayStart(event.endDate),
        };
}
const unique = <T extends { id: string }>(records: readonly T[]) => [
  ...new Map(records.map((record) => [record.id, record])).values(),
];
export function summarizeWeek(
  week: { start: string; end: string },
  audience: PlanningAudience,
  context: PlanningContext,
) {
  const window = {
    start: easternDayStart(week.start),
    end: easternDayStart(week.end),
  };
  const events = unique(context.events).filter(
    (event) =>
      event.status === "published" &&
      eventAudienceMatch(event, audience, context.organizations).relevant &&
      intervalsOverlap(window, eventInterval(event)),
  );
  const exams = unique(context.exams).filter(
    (exam) =>
      examAudienceMatch(exam, audience).relevant &&
      intervalsOverlap(
        window,
        exam.timeKnown
          ? exam
          : {
              start: easternDayStart(exam.date),
              end: easternDayStart(addCalendarDays(exam.date, 1)),
            },
      ),
  );
  const externalEvents = unique(context.externalEvents).filter((event) =>
    intervalsOverlap(window, eventInterval(event)),
  );
  const matches = events.map((event) =>
    eventAudienceMatch(event, audience, context.organizations),
  );
  return {
    ...week,
    events,
    exams,
    externalEvents,
    counts: {
      collegeWide: events.filter((e) => e.collegeWide).length,
      otherEvents: events.filter((e) => !e.collegeWide).length,
      exams: exams.length,
      campusLocal: externalEvents.filter((e) => e.scope === "campus-local")
        .length,
      national: externalEvents.filter((e) => e.scope === "national").length,
      majorMatches: matches.filter((m) => m.major).length,
      academicLevelMatches: matches.filter((m) => m.levelExplicit && m.level)
        .length,
      clusterMatches: matches.filter((m) => m.cluster).length,
      uniqueTotal: new Set(
        [...events, ...exams, ...externalEvents].map((record) => record.id),
      ).size,
    },
  };
}
/** Factor boundaries are implemented; overall numerical aggregation is deliberately absent. */
export const SCHEDULING_FACTORS = [
  {
    id: "exam-preparation",
    label: "Exam preparation",
    method:
      "Experimental bounded 0–10 model and uncertainty bounds; not a percentage.",
  },
  {
    id: "direct-constraints",
    label: "Direct known-time conflicts",
    method:
      "Inclusive-start/exclusive-end interval overlap; keep identities and time intersections.",
  },
  {
    id: "engineering-events",
    label: "Competing engineering / organization events",
    method:
      "Explicit/inherited major relevance or explicit cluster targeting, with academic-level intersection.",
  },
  {
    id: "campus-local",
    label: "Campus / local commitments",
    method:
      "Separate curated scenario layer with timing and source uncertainty.",
  },
  {
    id: "national",
    label: "National commitments",
    method:
      "Separate scenario layer; presence does not imply universal participation.",
  },
] as const;
export function dayPressureBreakdown(
  date: string,
  audience: PlanningAudience,
  context: PlanningContext,
) {
  const day = summarizeWeek(
    { start: date, end: addCalendarDays(date, 1) },
    audience,
    context,
  );
  const window = {
    start: easternDayStart(date),
    end: easternDayStart(addCalendarDays(date, 1)),
  };
  return {
    date,
    preparationAtDayStart: combinedExamPreparation(
      context.exams,
      window.start,
      audience,
    ),
    knownTimedConstraints: unique([
      ...day.events.filter((e) => !e.allDay),
      ...day.exams.filter((e) => e.timeKnown),
      ...day.externalEvents.filter((e) => e.timeKnown),
    ]).map((e) => ({ id: e.id, start: e.start!, end: e.end! })),
    dateOnlyConstraints:
      day.exams.filter((e) => !e.timeKnown).length +
      day.externalEvents.filter((e) => !e.timeKnown).length,
    counts: day.counts,
    overall: { status: "awaiting-methodology-review" as const, score: null },
  };
}
export function weekForInstant(instant: string) {
  const date = easternDate(instant);
  return calendarWeeks(date, addCalendarDays(date, 1))[0];
}
