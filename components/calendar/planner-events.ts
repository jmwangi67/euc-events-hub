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
      category: `Academic exam · ${exam.timeKnown ? "Known time" : "Time unknown"} · ${exam.source.verification}`,
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
