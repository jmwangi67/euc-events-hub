/** Test-only fixture injection for existing display/analysis parity assertions. */
import {
  loadCalendarItems as mapItems,
  loadCalendarDisplayDays as mapDays,
  loadCalendarScheduling as analyze,
} from "../../../components/calendar/calendar-source";
import type { PlanningCalendarOptions } from "../../../components/calendar/calendar-types";
import type { DateWindow, EventFilters } from "../contracts";
import { getEvents, getExams, getOrganizations } from "../fixtures";
import {
  getExternalEvents,
  getWeeklyPlanningContext,
} from "../weekly-planning";
function records(
  window: DateWindow,
  filters: EventFilters,
  planning?: PlanningCalendarOptions,
) {
  return {
    events: getEvents({ ...window, filters: planning ? undefined : filters }),
    exams: getExams(window),
    externalEvents: getExternalEvents(window),
    organizations: getOrganizations(),
  };
}
export function loadCalendarItems(
  range: { startStr: string; endStr: string },
  filters: EventFilters,
  planning?: PlanningCalendarOptions,
) {
  return mapItems(
    range,
    planning,
    records(
      { start: range.startStr.slice(0, 10), end: range.endStr.slice(0, 10) },
      filters,
      planning,
    ),
  );
}
export function loadCalendarDisplayDays(
  window: DateWindow,
  filters: EventFilters,
  planning: PlanningCalendarOptions,
) {
  return mapDays(window, planning, records(window, filters, planning));
}
export function loadCalendarScheduling(
  window: DateWindow,
  audience: PlanningCalendarOptions["audience"],
) {
  return analyze(window, audience, getWeeklyPlanningContext(window));
}
