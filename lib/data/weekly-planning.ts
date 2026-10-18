import { dateOnlySchema } from "../domain/models";
import {
  externalEvents,
  organizationClusters,
} from "../../data/fixtures/planning-context";
import {
  getEvents,
  getExams,
  getOrganizations,
  type DateWindow,
} from "./fixtures";
import { addCalendarDays } from "../time/eastern";
import { calendarWeeks, eventInterval } from "../domain/weekly-planning";
import { intervalsOverlap } from "../domain/planning";
import { easternDayStart } from "../time/eastern";
import { policySourceWindow } from "../domain/non-exam-scheduling";
import type { ExternalEvent } from "../domain/external-events";
import type { Event } from "../domain/models";
import { events as defaultEvents } from "../../data/fixtures";
export function getOrganizationClusters() {
  return structuredClone(organizationClusters);
}
export function getExternalEvents(
  window: DateWindow & { includeIdentityAlternatives?: boolean },
  eventFixtures: readonly ExternalEvent[] = externalEvents,
) {
  dateOnlySchema.parse(window.start);
  dateOnlySchema.parse(window.end);
  if (window.end <= window.start)
    throw new RangeError("Window end must follow start.");
  const matching = eventFixtures.filter((event) =>
    intervalsOverlap(eventInterval(event), {
      start: easternDayStart(window.start),
      end: easternDayStart(window.end),
    }),
  );
  const matchingIds = new Set(matching.map((event) => event.id));
  return structuredClone(
    window.includeIdentityAlternatives
      ? eventFixtures.filter((event) => matchingIds.has(event.id))
      : matching,
  );
}
/** Gate by relevant source windows, then retain complete identities across both non-exam layers. */
export function getNonExamAnalysisRecords(
  window: DateWindow,
  eventFixtures: readonly Event[] = defaultEvents,
  externalFixtures: readonly ExternalEvent[] = externalEvents,
) {
  const matchedIds = new Set([
    ...getEvents(window, eventFixtures).map((event) => event.id),
    ...getExternalEvents(policySourceWindow(window), externalFixtures).map(
      (event) => event.id,
    ),
  ]);
  return structuredClone({
    events: eventFixtures.filter(
      (event) => event.status === "published" && matchedIds.has(event.id),
    ),
    externalEvents: externalFixtures.filter((event) =>
      matchedIds.has(event.id),
    ),
  });
}
/** Include the following week for exam-preparation lookahead; no display filters accepted. */
export function getWeeklyPlanningContext(window: DateWindow) {
  const weeks = calendarWeeks(window.start, window.end);
  const completeWeeks = {
    start: weeks[0].start,
    end: weeks[weeks.length - 1].end,
  };
  return {
    ...getNonExamAnalysisRecords(completeWeeks),
    exams: getExams({
      ...completeWeeks,
      end: addCalendarDays(completeWeeks.end, 7),
      includeIdentityAlternatives: true,
    }),
    organizations: getOrganizations(),
  };
}
