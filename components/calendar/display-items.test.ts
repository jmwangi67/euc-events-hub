import { expect, it } from "vitest";
import { dayGridItems } from "./display-items";
import { getEventById } from "../../lib/data/fixtures";
import { toCalendarEvent } from "./calendar-events";
import { externalEvents } from "../../data/fixtures/planning-context";
import { externalTimingLabel } from "./planner-events";
it("links overnight timed slices to one canonical occurrence and clips only presentation", () => {
  const source = getEventById("example-night-build")!;
  const original = toCalendarEvent(source),
    snapshot = JSON.stringify(original);
  const items = dayGridItems([original]);
  expect(items).toHaveLength(2);
  expect(
    items.every(
      (e) =>
        e.allDay === false && e.extendedProps?.canonicalEventId === source.id,
    ),
  ).toBe(true);
  expect(items[0].start).toBe(source.start);
  expect(items[1].end).toBe(source.end);
  expect(items[1].extendedProps?.segmentTime).toBe("Ends 12:30 AM");
  expect(items[0].extendedProps?.segmentTime).toBe("11:30 PM–12:30 AM");
  expect(JSON.stringify(original)).toBe(snapshot);
});
it("does not invent another segment for an exact-midnight end and respects DST", () => {
  const base = toCalendarEvent(getEventById("example-night-build")!);
  expect(
    dayGridItems([{ ...base, end: "2026-10-27T00:00:00-04:00" }]),
  ).toHaveLength(1);
  const items = dayGridItems([
    {
      ...base,
      start: "2026-10-31T23:30:00-04:00",
      end: "2026-11-01T01:30:00-05:00",
    },
  ]);
  expect(items).toHaveLength(2);
  expect(items[1].start).toBe("2026-11-01T04:00:00.000Z");
});
it("compacts crowded days without changing source identity or clipping date-wide spans", () => {
  const base = toCalendarEvent(getEventById("example-night-build")!);
  const items = dayGridItems([
    base,
    { ...base, id: "two" },
    { ...base, id: "three" },
  ]);
  expect(items.every((i) => i.extendedProps?.compactGrid)).toBe(true);
  const span = {
    ...base,
    id: "date-wide",
    allDay: true,
    start: "2026-10-24",
    end: "2026-10-27",
  };
  expect(dayGridItems([span])[0]).toMatchObject({
    id: "date-wide",
    allDay: true,
    start: span.start,
    end: span.end,
  });
});
it("requires explicit date-wide display precision instead of assuming it from missing hours", () => {
  expect(
    externalTimingLabel(
      externalEvents.find((e) => e.id === "scenario-homecoming")!,
    ),
  ).toBe("Date-wide commitment");
  expect(
    externalTimingLabel(
      externalEvents.find((e) => e.id === "scenario-concert")!,
    ),
  ).toBe("Time TBD");
  expect(
    externalEvents.find((e) => e.id === "scenario-homecoming")!.timeKnown,
  ).toBe(false);
});
