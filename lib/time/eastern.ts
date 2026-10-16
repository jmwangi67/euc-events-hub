import { dateOnlySchema, instantSchema } from "../domain/models";

import { DISPLAY_TIME_ZONE } from "./constants";
export { DISPLAY_TIME_ZONE } from "./constants";

export function easternDate(instant: string): string {
  instantSchema.parse(instant);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instant));
}

export function formatTimedInstant(instant: string): string {
  instantSchema.parse(instant);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(instant));
}

/** Date-only labels never pass through a local or Eastern instant conversion. */
export function formatAllDayDate(date: string): string {
  dateOnlySchema.parse(date);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function addCalendarDays(date: string, days: number): string {
  dateOnlySchema.parse(date);
  if (!Number.isInteger(days)) throw new RangeError("Days must be an integer.");
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Resolve Eastern midnight via Intl's IANA rules, including 23/25-hour days. */
export function easternDayStart(date: string): string {
  dateOnlySchema.parse(date);
  const nominal = Date.parse(`${date}T00:00:00Z`);
  let candidate = nominal;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = formatter.formatToParts(new Date(candidate));
    const part = (name: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === name)?.value);
    const represented = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
      part("second"),
    );
    const correction = nominal - represented;
    if (correction === 0) return new Date(candidate).toISOString();
    candidate += correction;
  }
  throw new RangeError("Unable to resolve Eastern midnight.");
}

export function easternDayWindow(date: string): { start: string; end: string } {
  return {
    start: easternDayStart(date),
    end: easternDayStart(addCalendarDays(date, 1)),
  };
}

/** Sunday-start institution-local week; day arithmetic is calendar arithmetic. */
export function easternWeekWindow(instant: string): {
  start: string;
  end: string;
} {
  const date = easternDate(instant);
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  const sunday = addCalendarDays(date, -day);
  return {
    start: easternDayStart(sunday),
    end: easternDayStart(addCalendarDays(sunday, 7)),
  };
}

export function formatEventTime(event: {
  allDay: boolean;
  start: string;
  end: string;
}): string {
  if (event.allDay) {
    const last = addCalendarDays(event.end, -1);
    return event.start === last
      ? `${formatAllDayDate(event.start)} · All day`
      : `${formatAllDayDate(event.start)} – ${formatAllDayDate(last)} · All day`;
  }
  if (easternDate(event.start) === easternDate(event.end))
    return `${formatAllDayDate(easternDate(event.start))} · ${formatEventClockRange(event)}`;
  return `${formatTimedInstant(event.start)} – ${formatTimedInstant(event.end)}`;
}

/** Presentation only: use institution-local clocks, never the browser's zone. */
export function formatEventClockRange(event: {
  start: string;
  end: string;
}): string {
  const clock = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const start = clock.format(new Date(event.start));
  const end = clock.format(new Date(event.end));
  const samePeriod = start.slice(-2) === end.slice(-2);
  const range = `${samePeriod ? start.slice(0, -3) : start}–${end}`;
  // Fall-back can repeat or reverse wall-clock labels. State elapsed time to
  // distinguish those instants without exposing zone abbreviations or offsets.
  if (easternDate(event.start) === easternDate(event.end)) {
    const minutes = (instant: string) => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: DISPLAY_TIME_ZONE,
        hour: "numeric",
        minute: "numeric",
        hourCycle: "h23",
      }).formatToParts(new Date(instant));
      return (
        Number(parts.find((p) => p.type === "hour")!.value) * 60 +
        Number(parts.find((p) => p.type === "minute")!.value)
      );
    };
    if (minutes(event.end) <= minutes(event.start)) {
      const elapsed = (Date.parse(event.end) - Date.parse(event.start)) / 60000;
      return `${range} (${elapsed} min elapsed)`;
    }
  }
  return range;
}
