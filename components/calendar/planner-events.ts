import type { EventInput } from "@fullcalendar/core";
import type { Exam } from "../../lib/domain/models";
import type { Proposal } from "../../lib/domain/planning";
import {
  addCalendarDays,
  formatAllDayDate,
  formatEventTime,
} from "../../lib/time/eastern";
import { listEventTimes } from "./calendar-events";

export function examTimeLabel(exam: Exam): string {
  return exam.timeKnown
    ? formatEventTime({ allDay: false, start: exam.start, end: exam.end })
    : `${formatAllDayDate(exam.date)} · Time unknown`;
}
export function toExamCalendarItem(exam: Exam): EventInput {
  return {
    id: `exam:${exam.id}`,
    title: `Academic exam: ${exam.courseId}`,
    allDay: !exam.timeKnown,
    start: exam.timeKnown ? exam.start : exam.date,
    end: exam.timeKnown ? exam.end : addCalendarDays(exam.date, 1),
    classNames: [
      "planner-exam",
      exam.timeKnown ? "exam-timed" : "exam-date-only",
    ],
    extendedProps: {
      kind: "exam",
      exam,
      category: `Academic exam${!exam.relevantMajorIds.length ? " · Audience unknown · No numerical preparation" : ""} · ${exam.timeKnown ? "Known time" : "Time unknown"} · ${exam.source.verification}`,
      timeLabel: examTimeLabel(exam),
      listTimes: exam.timeKnown
        ? listEventTimes({ allDay: false, start: exam.start, end: exam.end })
        : ["Time unknown"],
    },
  };
}
export function toProposalCalendarItem(proposal: Proposal): EventInput {
  return {
    id: "proposal:local",
    title: `Local proposal: ${proposal.title}`,
    allDay: false,
    start: proposal.start,
    end: proposal.end,
    classNames: ["planner-proposal"],
    extendedProps: {
      kind: "proposal",
      category: "Local scenario · Not saved or submitted",
      timeLabel: formatEventTime({ allDay: false, ...proposal }),
      listTimes: listEventTimes({ allDay: false, ...proposal }),
    },
  };
}

export function toExternalCalendarItem(
  event: import("../../lib/domain/external-events").ExternalEvent,
): EventInput {
  const timeLabel = event.timeKnown
    ? formatEventTime({ allDay: false, start: event.start, end: event.end })
    : `${formatAllDayDate(event.startDate)} – ${formatAllDayDate(addCalendarDays(event.endDate, -1))} · Time unknown`;
  return {
    id: `external:${event.id}`,
    title: event.title,
    allDay: !event.timeKnown,
    start: event.timeKnown ? event.start : event.startDate,
    end: event.timeKnown ? event.end : event.endDate,
    classNames: ["planner-external", `external-${event.scope}`],
    extendedProps: {
      kind: "external",
      externalEvent: event,
      category: `${event.scope === "national" ? "National" : event.scope === "psu-wide" ? "PSU-wide" : "Local context"} · ${event.analysis === "context-only" ? "Context only · " : ""}Synthetic scenario`,
      timeLabel,
      listTimes: event.timeKnown
        ? listEventTimes({ allDay: false, start: event.start, end: event.end })
        : ["Time unknown"],
    },
  };
}
