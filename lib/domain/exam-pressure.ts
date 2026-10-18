import { examOccurrences } from "./exam-occurrences";
import type { Exam } from "./models";
import {
  audienceCells,
  examAudienceMatch,
  type PlanningAudience,
} from "./planning-audience";
import { addCalendarDays, easternDate, easternDayStart } from "../time/eastern";
import { instantSchema } from "./models";
export const PREPARATION_PARAMETERS = { decay: 0.3, exponent: 1.35 };
export type PreparationParameters = typeof PREPARATION_PARAMETERS & {
  relevanceWeights?: import("./planning-parameters").RelevanceWeights;
};
export function preparationSaturday(examDate: string) {
  const weekday = new Date(`${examDate}T00:00:00Z`).getUTCDay();
  return addCalendarDays(examDate, -((weekday + 1) % 7 || 7));
}
/** Eastern civil-day coordinate: each date has one unit, even across 23/25-hour days. */
export function easternCivilCoordinate(instant: string) {
  instantSchema.parse(instant);
  const date = easternDate(instant);
  const start = Date.parse(easternDayStart(date));
  const end = Date.parse(easternDayStart(addCalendarDays(date, 1)));
  return (
    Date.parse(`${date}T00:00:00Z`) / 86400000 +
    (Date.parse(instant) - start) / (end - start)
  );
}
export type PreparationContribution = {
  examId: string;
  value: number | null;
  range: [number, number];
  state:
    | "outside-window"
    | "preparing"
    | "direct-constraint"
    | "date-uncertain"
    | "audience-uncertain";
  explanation: string;
  source: Exam["source"];
};
export function examPreparation(
  exam: Exam,
  instant: string,
  audience: PlanningAudience,
  parameters: PreparationParameters = PREPARATION_PARAMETERS,
  side: "at" | "left" = "at",
): PreparationContribution {
  if (
    !(parameters.decay > 0) ||
    !(parameters.exponent > 1) ||
    !Number.isFinite(parameters.decay) ||
    !Number.isFinite(parameters.exponent)
  )
    throw new RangeError(
      "Use positive finite decay and an exponent greater than one.",
    );
  const match = examAudienceMatch(exam, audience, parameters.relevanceWeights);
  const actualDate = easternDate(instant);
  const date =
    side === "left" &&
    Date.parse(instant) === Date.parse(easternDayStart(actualDate))
      ? addCalendarDays(actualDate, -1)
      : actualDate;
  const result = (
    value: number | null,
    range: [number, number],
    state: PreparationContribution["state"],
  ) => ({
    examId: exam.id,
    value,
    range,
    state,
    explanation: match.explanation,
    source: exam.source,
  });
  if (match.audienceUncertain)
    return result(null, [0, 0], "audience-uncertain");
  if (
    !match.relevant ||
    date < preparationSaturday(exam.date) ||
    date > (exam.timeKnown ? easternDate(exam.end) : exam.date)
  )
    return result(0, [0, 0], "outside-window");
  const curve = (remaining: number) =>
    10 *
    match.weight *
    Math.exp(-parameters.decay * Math.max(0, remaining) ** parameters.exponent);
  const now = easternCivilCoordinate(instant);
  if (!exam.timeKnown) {
    // Bounds use the entire possible date, not a fabricated exam hour.
    const first = easternCivilCoordinate(easternDayStart(exam.date));
    const last = easternCivilCoordinate(
      easternDayStart(addCalendarDays(exam.date, 1)),
    );
    return date === exam.date
      ? result(null, [0, 10 * match.weight], "date-uncertain")
      : result(null, [curve(last - now), curve(first - now)], "date-uncertain");
  }
  const afterStart =
    Date.parse(instant) > Date.parse(exam.start) ||
    (side === "at" && Date.parse(instant) === Date.parse(exam.start));
  if (afterStart)
    return result(
      0,
      [0, 0],
      Date.parse(instant) < Date.parse(exam.end) ||
        (side === "left" && Date.parse(instant) === Date.parse(exam.end))
        ? "direct-constraint"
        : "outside-window",
    );
  const value = curve(easternCivilCoordinate(exam.start) - now);
  return result(value, [value, value], "preparing");
}
/** Saturating union, not a statistical independence or unavailability claim. */
export function combinePreparation(values: readonly number[]) {
  if (values.some((v) => !Number.isFinite(v) || v < 0 || v > 10))
    throw new RangeError("Contributions must be between zero and ten.");
  return (
    10 *
    (1 -
      [...values]
        .sort((a, b) => a - b)
        .reduce((product, value) => product * (1 - value / 10), 1))
  );
}
/** Never pool exams across disjoint major × level audiences. Range is a subgroup envelope. */
export function combinedExamPreparation(
  exams: readonly Exam[],
  instant: string,
  audience: PlanningAudience,
  parameters: PreparationParameters = PREPARATION_PARAMETERS,
  side: "at" | "left" = "at",
) {
  const canonical = examOccurrences(exams);
  const identityUncertainIds = new Set(
    canonical.identityConflicts.map((group) => group.id),
  );
  const records = canonical.exams;
  const cells = audienceCells(audience).map((cell) => {
    const contributions = records.flatMap((record) => {
      // Preserve each documented major/level relationship before common-occurrence deduplication.
      const applicableMappings = exams.filter(
        (exam) =>
          exam.id === record.id &&
          examAudienceMatch(exam, cell.audience, parameters.relevanceWeights)
            .numericalEligible,
      );
      if (!applicableMappings.length) return [];
      const mapping = applicableMappings.reduce((best, exam) =>
        examAudienceMatch(exam, cell.audience, parameters.relevanceWeights)
          .weight >
        examAudienceMatch(best, cell.audience, parameters.relevanceWeights)
          .weight
          ? exam
          : best,
      );
      return [
        examPreparation(mapping, instant, cell.audience, parameters, side),
      ];
    });
    return {
      ...cell,
      contributions,
      range: [
        combinePreparation(contributions.map((c) => c.range[0])),
        combinePreparation(contributions.map((c) => c.range[1])),
      ] as [number, number],
    };
  });
  return summarizeAudienceCells(cells, [
    ...new Map(
      exams
        .filter(
          (exam) =>
            !exam.relevantMajorIds.length && !identityUncertainIds.has(exam.id),
        )
        .map((exam) => [exam.id, exam]),
    ).values(),
    ...canonical.identityUncertainExams,
  ]);
}
export function summarizeAudienceCells<
  T extends { id: string; range: [number, number] },
>(cells: T[], audienceUncertainExams: readonly Exam[]) {
  const upper = Math.max(0, ...cells.map((cell) => cell.range[1]));
  return {
    cells,
    mostAffectedCells: cells.filter(
      (cell) => upper > 0 && Math.abs(cell.range[1] - upper) < 1e-9,
    ),
    range: [Math.max(0, ...cells.map((cell) => cell.range[0])), upper] as [
      number,
      number,
    ],
    audienceUncertainExams,
  };
}
