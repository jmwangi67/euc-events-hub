import { dateOnlySchema } from "../domain/models";
import { DISPLAY_TIME_ZONE } from "./constants";

export type LocalOccurrence = "first" | "second";
const localParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
function wallTime(instant: number): number {
  const parts = localParts.formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)!.value);
  return Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );
}

/** Resolve local clocks against IANA rules. Gaps have no candidate; folds have two. */
export function easternLocalCandidates(date: string, time: string): string[] {
  if (
    !dateOnlySchema.safeParse(date).success ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    throw new RangeError("Enter a valid date and time.");
  const nominal = Date.parse(`${date}T${time}:00Z`);
  const offsets = new Set(
    [-36, -12, 0, 12, 36].map((hours) => {
      const sample = nominal + hours * 3600000;
      return wallTime(sample) - sample;
    }),
  );
  return [...offsets]
    .map((offset) => nominal - offset)
    .filter((candidate) => wallTime(candidate) === nominal)
    .sort((a, b) => a - b)
    .map((candidate) => new Date(candidate).toISOString());
}
export function resolveEasternLocal(
  date: string,
  time: string,
  occurrence?: LocalOccurrence,
): string {
  const candidates = easternLocalCandidates(date, time);
  if (!candidates.length)
    throw new RangeError(
      "This local time does not exist in Eastern Time during the spring clock change. Choose another time.",
    );
  if (candidates.length > 1 && !occurrence)
    throw new RangeError(
      "This Eastern time occurs twice. Choose the first or second occurrence.",
    );
  return candidates[occurrence === "second" && candidates.length > 1 ? 1 : 0];
}
