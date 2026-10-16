import type { EventInput } from "@fullcalendar/core";
import type { Event } from "../../lib/domain/models";
import { EVENT_CATEGORIES } from "../../lib/domain/event-categories";
import {
  formatEventClockRange,
  addCalendarDays,
  easternDate,
  formatEventTime,
} from "../../lib/time/eastern";

/** Keep occurrence IDs, exclusive date ends, and original timed instants intact. */
export function toCalendarEvent(event: Event): EventInput {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    classNames: [`category-${event.category}`],
    extendedProps: {
      category: EVENT_CATEGORIES[event.category],
      timeLabel: formatEventTime(event),
      listTimes: listEventTimes(event),
    },
  };
}

/** Compact cards retain full occurrence clocks, with a short date-rollover cue. */
export function listEventTimes(
  event: Pick<Event, "allDay" | "start" | "end">,
): string[] {
  if (event.allDay) return ["All day"];
  const [range, elapsed] = formatEventClockRange(event).split(" (");
  const days =
    (Date.parse(easternDate(event.end)) -
      Date.parse(easternDate(event.start))) /
    86400000;
  // Same-period ranges fit as a unit; otherwise break only between full clocks.
  const labels = /AM.*PM|PM.*AM/.test(range) ? range.split(/(?<=–)/) : [range];
  if (elapsed) labels.push(`(${elapsed}`);
  if (days > 0) labels.push(days === 1 ? "Next day" : `+${days} days`);
  return labels;
}

/** FullCalendar ranges have exclusive ends; only displayed years need labels. */
export function listRangeCrossesYears(start: string, end: string): boolean {
  return start.slice(0, 4) !== addCalendarDays(end, -1).slice(0, 4);
}
