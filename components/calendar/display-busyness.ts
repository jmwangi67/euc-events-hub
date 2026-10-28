import type { ExternalEvent } from "../../lib/domain/external-events";
import type { EventInput } from "@fullcalendar/core";
import { addCalendarDays, easternDate } from "../../lib/time/eastern";

export type DisplayCommitment = {
  id: string;
  title: string;
  timeLabel: string;
  scope?: ExternalEvent["scope"];
  visible: boolean;
};
export type DisplayDay = {
  date: string;
  items: DisplayCommitment[];
  filled: number;
};

/** Calendar display activity only. Never an input to scheduling analysis. */
export function displayBusynessDays(
  range: { start: string; end: string },
  visible: readonly EventInput[],
  alwaysIncluded: readonly EventInput[],
): Map<string, DisplayDay> {
  const dates = new Map<string, Map<string, DisplayCommitment>>();
  for (
    let date = range.start;
    date < range.end;
    date = addCalendarDays(date, 1)
  )
    dates.set(date, new Map());
  const add = (item: EventInput, isVisible: boolean) => {
    const p = item.extendedProps;
    if (
      p?.kind === "density" ||
      p?.kind === "proposal" ||
      item.display === "background"
    )
      return;
    const first = item.allDay
      ? String(item.start)
      : easternDate(String(item.start));
    // Exclusive ends: a midnight end occupies no part of the following date.
    const last = item.allDay
      ? addCalendarDays(String(item.end), -1)
      : easternDate(new Date(Date.parse(String(item.end)) - 1).toISOString());
    const id = String(p?.canonicalEventId ?? item.id);
    for (
      let date = first < range.start ? range.start : first;
      date <= last && date < range.end;
      date = addCalendarDays(date, 1)
    ) {
      const day = dates.get(date)!;
      const previous = day.get(id);
      day.set(id, {
        id,
        title: item.title ?? "",
        timeLabel: p?.timeLabel ?? "",
        scope: p?.externalEvent?.scope,
        visible: isVisible || !!previous?.visible,
      });
    }
  };
  visible.forEach((item) => add(item, true));
  alwaysIncluded.forEach((item) => add(item, false));
  return new Map(
    [...dates].map(([date, items]) => [
      date,
      { date, items: [...items.values()], filled: Math.min(5, items.size) },
    ]),
  );
}
