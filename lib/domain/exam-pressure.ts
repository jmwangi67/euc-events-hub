import type { Exam } from "./models";
import { examAudienceMatch, type PlanningAudience } from "./planning-audience";
import { addCalendarDays, easternDate, easternDayStart } from "../time/eastern";
import { instantSchema } from "./models";
export const PREPARATION_PARAMETERS = { decay: 0.3, exponent: 1.35 };
export type PreparationParameters = typeof PREPARATION_PARAMETERS;
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
    "outside-window" | "preparing" | "direct-constraint" | "date-uncertain";
  explanation: string;
};
export function examPreparation(
  exam: Exam,
  instant: string,
  audience: PlanningAudience,
  parameters = PREPARATION_PARAMETERS,
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
  const match = examAudienceMatch(exam, audience);
  const date = easternDate(instant);
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
  });
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
  if (Date.parse(instant) >= Date.parse(exam.start))
    return result(
      0,
      [0, 0],
      Date.parse(instant) < Date.parse(exam.end)
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
    10 * (1 - values.reduce((product, value) => product * (1 - value / 10), 1))
  );
}
export function combinedExamPreparation(
  exams: readonly Exam[],
  instant: string,
  audience: PlanningAudience,
) {
  const contributions = [
    ...new Map(exams.map((exam) => [exam.id, exam])).values(),
  ].map((exam) => examPreparation(exam, instant, audience));
  return {
    contributions,
    range: [
      combinePreparation(contributions.map((c) => c.range[0])),
      combinePreparation(contributions.map((c) => c.range[1])),
    ] as [number, number],
  };
}
