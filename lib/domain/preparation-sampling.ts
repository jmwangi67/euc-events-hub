import type { Exam } from "./models";
import { instantSchema } from "./models";
import type { PlanningAudience } from "./planning-audience";
import {
  combinedExamPreparation,
  preparationSaturday,
  summarizeAudienceCells,
  PREPARATION_PARAMETERS,
  type PreparationParameters,
} from "./exam-pressure";
import { addCalendarDays, easternDayStart } from "../time/eastern";
import { resolveEasternLocal } from "../time/eastern-local";
export type ModelBoundary = { instant: string; side: "at" | "left" };
/** Between cutoffs all contributions are nondecreasing. Evaluate transitions and exact left limits. */
export function preparationOverInterval(
  exams: readonly Exam[],
  interval: { start: string; end: string },
  audience: PlanningAudience,
  parameters: PreparationParameters = PREPARATION_PARAMETERS,
) {
  instantSchema.parse(interval.start);
  instantSchema.parse(interval.end);
  const start = Date.parse(interval.start),
    end = Date.parse(interval.end);
  if (end <= start) throw new RangeError("Interval end must follow start.");
  const transitions = new Set<number>([end]);
  for (const exam of exams) {
    transitions.add(
      Date.parse(easternDayStart(preparationSaturday(exam.date))),
    );
    if (exam.timeKnown) {
      transitions.add(Date.parse(exam.start));
      transitions.add(Date.parse(exam.end));
    } else {
      transitions.add(Date.parse(easternDayStart(exam.date)));
      transitions.add(
        Date.parse(easternDayStart(addCalendarDays(exam.date, 1))),
      );
    }
  }
  const boundaries: ModelBoundary[] = [{ instant: interval.start, side: "at" }];
  for (const instant of [...transitions]
    .filter((t) => t > start && t <= end)
    .sort((a, b) => a - b)) {
    boundaries.push({ instant: new Date(instant).toISOString(), side: "left" });
    if (instant < end)
      boundaries.push({ instant: new Date(instant).toISOString(), side: "at" });
  }
  const samples = boundaries.map((boundary) => ({
    ...boundary,
    analysis: combinedExamPreparation(
      exams,
      boundary.instant,
      audience,
      parameters,
      boundary.side,
    ),
  }));
  const initial = samples[0].analysis;
  const cells = initial.cells.map((cell, index) => {
    const possibilities = samples.map((sample) => ({
      ...sample,
      cell: sample.analysis.cells[index],
    }));
    const lowerMaximum = possibilities.reduce((best, sample) =>
      sample.cell.range[0] > best.cell.range[0] ? sample : best,
    );
    const maximum = possibilities.reduce((best, sample) =>
      sample.cell.range[1] > best.cell.range[1] ? sample : best,
    );
    return {
      ...cell,
      range: [
        Math.max(...possibilities.map((p) => p.cell.range[0])),
        maximum.cell.range[1],
      ] as [number, number],
      maximumAt: { instant: maximum.instant, side: maximum.side },
      lowerMaximumAt: {
        instant: lowerMaximum.instant,
        side: lowerMaximum.side,
      },
      contributions: maximum.cell.contributions,
    };
  });
  return {
    ...summarizeAudienceCells(cells, initial.audienceUncertainExams),
    atStart: initial,
    boundaries: samples.map(({ instant, side }) => ({ instant, side })),
    interval,
  };
}
export function dailyPreparation(
  exams: readonly Exam[],
  date: string,
  audience: PlanningAudience,
  parameters: PreparationParameters = PREPARATION_PARAMETERS,
) {
  const interval = {
    start: easternDayStart(date),
    end: easternDayStart(addCalendarDays(date, 1)),
  };
  const eveningInstant = resolveEasternLocal(date, "22:00");
  const maximum = preparationOverInterval(
    exams,
    interval,
    audience,
    parameters,
  );
  return {
    date,
    eveningInstant,
    evening: combinedExamPreparation(
      exams,
      eveningInstant,
      audience,
      parameters,
    ),
    maximum,
    upcomingExamIds: [
      ...new Set(
        maximum.cells.flatMap((cell) =>
          cell.contributions.filter((c) => c.range[1] > 0).map((c) => c.examId),
        ),
      ),
    ].filter((id) => {
      const exam = exams.find((e) => e.id === id)!;
      return exam.date > date;
    }),
  };
}
export function proposalPreparation(
  exams: readonly Exam[],
  interval: { start: string; end: string },
  audience: PlanningAudience,
  parameters: PreparationParameters = PREPARATION_PARAMETERS,
) {
  return preparationOverInterval(exams, interval, audience, parameters);
}
