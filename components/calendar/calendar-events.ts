import type { EventInput } from "@fullcalendar/core";
import type { Event } from "../../lib/domain/models";
import { EVENT_CATEGORIES } from "../../lib/domain/event-categories";
import { formatEventTime } from "../../lib/time/eastern";

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
    },
  };
}
