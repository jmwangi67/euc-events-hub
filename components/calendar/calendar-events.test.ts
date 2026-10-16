import { describe, expect, it } from "vitest";
import { getEventById, getEvents } from "../../lib/data/fixtures";
import { eventSchema } from "../../lib/domain/models";
import { toCalendarEvent } from "./calendar-events";

describe("FullCalendar data mapping", () => {
  it("preserves occurrence IDs and timed instants", () => {
    const event = getEventById("example-industry")!;
    expect(toCalendarEvent(event)).toMatchObject({
      id: event.id,
      title: event.title,
      start: "2026-10-21T16:00:00-04:00",
      end: "2026-10-21T17:00:00-04:00",
      allDay: false,
      extendedProps: { category: "Corporate recruiting" },
    });
  });
  it("preserves exclusive all-day ends without converting to instants", () => {
    const mapped = toCalendarEvent(getEventById("example-design-days")!);
    expect(mapped).toMatchObject({
      allDay: true,
      start: "2026-10-24",
      end: "2026-10-26",
    });
    expect(mapped.extendedProps?.timeLabel).toBe(
      "Oct 24, 2026 – Oct 25, 2026 · All day",
    );
  });
  it("labels midnight-crossing events with both Eastern dates", () => {
    const mapped = toCalendarEvent(getEventById("example-night-build")!);
    expect(mapped.extendedProps?.timeLabel).toContain("Oct 26, 2026");
    expect(mapped.extendedProps?.timeLabel).toContain("Oct 27, 2026");
    expect(mapped.extendedProps?.timeLabel).toContain("EDT");
  });
  it("retains EST/EDT distinctions during the repeated fall hour", () => {
    const event = eventSchema.parse({
      ...getEventById("example-industry"),
      start: "2026-11-01T01:30:00-04:00",
      end: "2026-11-01T01:30:00-05:00",
    });
    expect(toCalendarEvent(event).extendedProps?.timeLabel).toMatch(/EDT.*EST/);
  });
  it("maps only published query results and handles empty ranges", () => {
    expect(
      getEvents({ start: "2026-10-19", end: "2026-10-28" })
        .map(toCalendarEvent)
        .map((event) => event.id),
    ).not.toContain("example-open-topic");
    expect(
      getEvents({ start: "2027-01-01", end: "2027-01-02" }).map(
        toCalendarEvent,
      ),
    ).toEqual([]);
  });
});
