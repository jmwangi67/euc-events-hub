import type { EventInput } from "@fullcalendar/core";
import type { Event } from "../../lib/domain/models";
import { EVENT_CATEGORIES } from "../../lib/domain/event-categories";
import {
  DISPLAY_TIME_ZONE,
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

/** Full occurrence range; dates stay explicit when an event crosses midnight. */
export function listEventTimes(
  event: Pick<Event, "allDay" | "start" | "end">,
): string[] {
  if (event.allDay) return ["All day"];
  const crossesDate = easternDate(event.start) !== easternDate(event.end);
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    ...(crossesDate ? ({ month: "short", day: "numeric" } as const) : {}),
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return [
    format.format(new Date(event.start)),
    format.format(new Date(event.end)),
  ];
}
