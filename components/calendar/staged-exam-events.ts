import type { EventInput } from "@fullcalendar/core";
import {
  addCalendarDays,
  formatEventTime,
  formatAllDayDate,
} from "../../lib/time/eastern";
import {
  examHasConflict,
  possibleDates,
  reportedDates,
  type StagedExam,
  type StagedExamDataset,
} from "../../lib/exams/staging";
import { listEventTimes } from "./calendar-events";

export function stagedExamCalendarItems(
  exams: readonly StagedExam[],
  dataset: StagedExamDataset,
): EventInput[] {
  const items = new Map<string, EventInput>();
  for (const exam of exams) {
    const conflicting = examHasConflict(exam);
    const designation = [
      ...new Set(
        exam.claims.flatMap((claim) =>
          claim.designation ? [claim.designation] : [],
        ),
      ),
    ].join(" / ");
    const title = `Academic Exam ${[...new Set(exam.claims.map((claim) => claim.courseId))].join(" / ")}${designation ? ` · ${designation}` : ""}`;
    for (const [index, claim] of exam.claims.entries()) {
      const timed = claim.timing.kind === "timed" ? claim.timing : null;
      const reported = reportedDates(claim.timing).sort();
      const contiguous = reported.every(
        (date, i) => !i || date === addCalendarDays(reported[i - 1], 1),
      );
      const dateLabel =
        reported.length > 1 && contiguous
          ? `${formatAllDayDate(reported[0])} – ${formatAllDayDate(reported.at(-1)!)}`
          : reported.map(formatAllDayDate).join("; ");
      const segments = timed
        ? [{ start: timed.start, end: timed.end, possible: false }]
        : [
            ...reportedDates(claim.timing).map((date) => ({
              start: date,
              end: addCalendarDays(date, 1),
              possible: false,
            })),
            ...possibleDates(claim.timing).map((date) => ({
              start: date,
              end: addCalendarDays(date, 1),
              possible: true,
            })),
          ];
      for (const segment of segments) {
        const key = `${exam.id}|${segment.start}|${segment.end}|${segment.possible}`;
        if (items.has(key)) continue;
        const dateDescription = segment.possible
          ? "Possible additional date — not scheduled"
          : timed
            ? timed.basis === "source-default"
              ? "Source-wide default hours"
              : "Source-reported explicit hours"
            : claim.timing.kind === "date-only"
              ? "Examination date — hours unknown"
              : "Testing window — individual exam time unknown";
        const status = conflicting
          ? "Conflicting source information"
          : claim.sourceStatus.replaceAll("-", " ");
        const timeLabel = timed
          ? formatEventTime({
              allDay: false,
              start: timed.start,
              end: timed.end,
            })
          : segment.start;
        const category = `${dateDescription} · ${status} · ${claim.publicationStatus.replaceAll("-", " ")}`;
        const id = `staged:${exam.id}:${index}:${segment.start}`;
        items.set(key, {
          id,
          title,
          start: segment.start,
          end: segment.end,
          allDay: !timed,
          classNames: [
            "planner-exam",
            "staged-exam-preview",
            segment.possible
              ? "exam-possible-date"
              : timed
                ? "exam-timed"
                : "exam-date-only",
          ],
          extendedProps: {
            kind: "exam-review",
            canonicalExamId: exam.id,
            category,
            reviewDates: timed
              ? undefined
              : `Reported dates: ${dateLabel}${possibleDates(claim.timing).length ? ` · ${possibleDates(claim.timing).length} additional possible date(s)` : ""}`,
            timeLabel,
            listTimes: timed
              ? listEventTimes({
                  allDay: false,
                  start: timed.start,
                  end: timed.end,
                })
              : [segment.possible ? "Possible date" : "Time unknown"],
            reviewLabel: `${title}. ${timeLabel}. ${category}. ${claim.designation ?? "Exam designation not supplied"}. ${dataset.termId}. One canonical exam; date options are not separate examinations. Open exam review details.`,
          },
        });
      }
    }
  }
  return [...items.values()];
}
