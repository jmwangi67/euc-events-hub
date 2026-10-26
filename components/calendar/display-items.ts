import type { EventInput } from "@fullcalendar/core";
import {
  addCalendarDays,
  easternDate,
  easternDayStart,
  formatEventClockRange,
  formatEventClock,
} from "../../lib/time/eastern";
/** Display-only day slices. Source records/analysis stay canonical and untouched. */
export function dayGridItems(items: EventInput[]): EventInput[] {
  const counts = new Map<string, number>();
  const dates = (item: EventInput) => {
    const start = String(item.start),
      end = String(item.end);
    const first = item.allDay ? start : easternDate(start);
    const last = item.allDay
      ? addCalendarDays(end, -1)
      : easternDate(new Date(Date.parse(end) - 1).toISOString());
    const result: string[] = [];
    for (let date = first; date <= last; date = addCalendarDays(date, 1))
      result.push(date);
    return result;
  };
  for (const item of items)
    for (const date of dates(item))
      counts.set(date, (counts.get(date) ?? 0) + 1);
  return items.flatMap((item) => {
    const days = dates(item),
      props = {
        ...item.extendedProps,
        compactGrid: days.some((d) => (counts.get(d) ?? 0) >= 3),
      };
    if (item.allDay || days.length < 2)
      return [{ ...item, extendedProps: props }];
    const originalStart = String(item.start),
      originalEnd = String(item.end);
    return days.map((date, index) => ({
      ...item,
      id: index === 0 ? item.id : `${item.id}:continuation:${date}`,
      start: index === 0 ? item.start : easternDayStart(date),
      end:
        index === days.length - 1
          ? item.end
          : easternDayStart(addCalendarDays(date, 1)),
      allDay: false,
      classNames: [
        ...(Array.isArray(item.classNames) ? item.classNames : []),
        "timed-day-segment",
      ],
      extendedProps: {
        ...props,
        compactGrid: true,
        canonicalEventId: item.id,
        segmentDate: date,
        segmentTime:
          index === 0
            ? formatEventClockRange(
                {
                  start: originalStart,
                  end: originalEnd,
                },
                true,
              )
            : index === days.length - 1
              ? `Ends ${formatEventClock(originalEnd, true)}`
              : "Continues from previous day",
        segmentNote:
          index === 0
            ? days.length === 2
              ? "Next day"
              : `Continues ${days.length - 1} days`
            : index === days.length - 1
              ? "From prev day"
              : "Continues into next day",
      },
    }));
  });
}
