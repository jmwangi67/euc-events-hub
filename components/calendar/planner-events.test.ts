import { expect, it } from "vitest";
import { getExams } from "../../lib/data/fixtures";
import { toExamCalendarItem, toProposalCalendarItem } from "./planner-events";
it("maps unknown-time exams to date-only entries without invented clocks", () => {
  const exam = getExams({ start: "2026-10-21", end: "2026-10-22" })[0];
  expect(toExamCalendarItem(exam)).toMatchObject({
    id: `exam:${exam.id}`,
    allDay: true,
    start: "2026-10-21",
    end: "2026-10-22",
    extendedProps: {
      listTimes: ["Time unknown"],
      category: "Academic Exam · Time unknown · Demo data — not verified",
    },
  });
});
it("retains known exam instants and distinguishes local proposals", () => {
  const exam = getExams({ start: "2026-10-22", end: "2026-10-23" })[0];
  expect(toExamCalendarItem(exam)).toMatchObject({
    allDay: false,
    start: exam.timeKnown ? exam.start : undefined,
    end: exam.timeKnown ? exam.end : undefined,
  });
  const item = toProposalCalendarItem({
    title: "Example",
    start: "2026-10-21T16:30:00-04:00",
    end: "2026-10-21T17:30:00-04:00",
    majorIds: ["bme"],
  });
  expect(item).toMatchObject({
    id: "proposal:local",
    classNames: ["planner-proposal"],
    extendedProps: {
      kind: "proposal",
      category: expect.stringContaining("Not saved"),
    },
  });
  expect(item).not.toHaveProperty("status");
});
