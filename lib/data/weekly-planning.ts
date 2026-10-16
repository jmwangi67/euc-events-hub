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
export function getOrganizationClusters() {
  return structuredClone(organizationClusters);
}
export function getExternalEvents(window: DateWindow) {
  dateOnlySchema.parse(window.start);
  dateOnlySchema.parse(window.end);
  if (window.end <= window.start)
    throw new RangeError("Window end must follow start.");
  return structuredClone(
    externalEvents.filter((event) =>
      intervalsOverlap(eventInterval(event), {
        start: easternDayStart(window.start),
        end: easternDayStart(window.end),
      }),
    ),
  );
}
/** Include the following week for exam-preparation lookahead; no display filters accepted. */
export function getWeeklyPlanningContext(window: DateWindow) {
  const weeks = calendarWeeks(window.start, window.end);
  const completeWeeks = {
    start: weeks[0].start,
    end: weeks[weeks.length - 1].end,
  };
  return {
    events: getEvents(completeWeeks),
    exams: getExams({
      ...completeWeeks,
      end: addCalendarDays(completeWeeks.end, 7),
    }),
    externalEvents: getExternalEvents(completeWeeks),
    organizations: getOrganizations(),
  };
}
