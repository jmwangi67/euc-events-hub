import {
  eventHosts,
  hostNames,
  hostingIdentity,
  hasUniversityHost,
} from "../../lib/domain/hosting";
import type { EventInput } from "@fullcalendar/core";
import type { CalendarData } from "../../lib/data/contracts";
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
import type { PlanningAudience } from "../../lib/domain/planning-audience";
import { easternDayStart } from "../../lib/time/eastern";
import { displayBusynessDays } from "./display-busyness";

/** View-filtered display signal, with the owner's explicit broad-scope exception. */
export function loadCalendarDisplayDays(
  range: { start: string; end: string },
  planning: PlanningCalendarOptions,
  data: CalendarData,
) {
  const visible = loadCalendarItems(
    {
      startStr: easternDayStart(range.start),
      endStr: easternDayStart(range.end),
    },
    planning,
    data,
  );
  const mandatory = data.externalEvents
    .filter((event) => event.scope === "psu-wide" || event.scope === "national")
    .map(toExternalCalendarItem);
  return displayBusynessDays(range, visible, mandatory);
}

/** Analysis inputs are loaded independently of every calendar display toggle. */
export function loadCalendarScheduling(
  range: { start: string; end: string },
  audience: PlanningAudience,
  context: CalendarData,
) {
  return analyzeNonExamScheduling(context, audience, {
    start: easternDayStart(range.start),
    end: easternDayStart(range.end),
  });
}
export function loadCalendarItems(
  range: { startStr: string; endStr: string },
  planning: PlanningCalendarOptions | undefined,
  data: CalendarData,
): EventInput[] {
  const organizations = data.organizations;
  const events = planning && !planning.showEvents ? [] : data.events;
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
      ...data.exams
        .filter((exam) => examAudienceMatch(exam, planning.audience).relevant)
        .map(toExamCalendarItem),
    );
  if (planning)
    items.push(
      ...data.externalEvents
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
