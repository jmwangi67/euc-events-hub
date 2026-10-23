import {
  eventHosts,
  hostNames,
  hostingIdentity,
  hasUniversityHost,
} from "../../lib/domain/hosting";
import type { EventInput } from "@fullcalendar/core";
import {
  getEvents,
  getExams,
  getOrganizations,
  type EventFilters,
} from "../../lib/data/fixtures";
import { getExternalEvents } from "../../lib/data/weekly-planning";
import {
  eventAudienceMatch,
  examAudienceMatch,
} from "../../lib/domain/planning-audience";
import { intervalsOverlap } from "../../lib/domain/planning";
import { toCalendarEvent } from "./calendar-events";
import {
  toExamCalendarItem,
  toExternalCalendarItem,
  toProposalCalendarItem,
} from "./planner-events";
import type { PlanningCalendarOptions } from "./calendar-types";
import { analyzeNonExamScheduling } from "../../lib/domain/non-exam-scheduling";
import { getWeeklyPlanningContext } from "../../lib/data/weekly-planning";
import type { PlanningAudience } from "../../lib/domain/planning-audience";
import { easternDayStart } from "../../lib/time/eastern";

/** Analysis inputs are loaded independently of every calendar display toggle. */
export function loadCalendarScheduling(
  range: { start: string; end: string },
  audience: PlanningAudience,
) {
  return analyzeNonExamScheduling(getWeeklyPlanningContext(range), audience, {
    start: easternDayStart(range.start),
    end: easternDayStart(range.end),
  });
}
export function loadCalendarItems(
  range: { startStr: string; endStr: string },
  filters: EventFilters,
  planning?: PlanningCalendarOptions,
): EventInput[] {
  const window = {
    start: range.startStr.slice(0, 10),
    end: range.endStr.slice(0, 10),
  };
  const organizations = getOrganizations();
  const events =
    planning && !planning.showEvents
      ? []
      : getEvents({ ...window, filters: planning ? undefined : filters });
  const items: EventInput[] = events
    .filter(
      (event) =>
        !planning ||
        (eventAudienceMatch(event, planning.audience, organizations).relevant &&
          (planning.showUniversityEvents ||
            !hasUniversityHost(event, organizations))),
    )
    .map((event) => {
      const mapped = toCalendarEvent(event);
      return {
        ...mapped,
        extendedProps: {
          ...mapped.extendedProps,
          hosts: hostNames(eventHosts(event, organizations)),
          compactHosts: hostNames(eventHosts(event, organizations), true),
          hostingIdentity: hostingIdentity(event, organizations),
        },
      };
    });
  if (planning?.showExams)
    items.push(
      ...getExams(window)
        .filter((exam) => examAudienceMatch(exam, planning.audience).relevant)
        .map(toExamCalendarItem),
    );
  if (planning)
    items.push(
      ...getExternalEvents(window)
        .filter((event) =>
          event.scope === "national"
            ? planning.showNational
            : event.scope === "psu-wide"
              ? planning.showPsuWide
              : planning.showCampusLocal,
        )
        .map(toExternalCalendarItem),
    );
  if (
    planning?.proposal &&
    intervalsOverlap(planning.proposal, {
      start: range.startStr,
      end: range.endStr,
    })
  )
    items.push(toProposalCalendarItem(planning.proposal));
  return items;
}
