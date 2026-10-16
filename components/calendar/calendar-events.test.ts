import { describe, expect, it } from "vitest";
import { getEventById, getEvents } from "../../lib/data/fixtures";
import { eventSchema } from "../../lib/domain/models";
import {
  listEventTimes,
  listRangeCrossesYears,
  toCalendarEvent,
} from "./calendar-events";

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
    expect(mapped.extendedProps?.timeLabel).not.toMatch(/\b(?:EST|EDT)\b/);
  });
  it("preserves repeated fall instants and disambiguates elapsed time", () => {
    const event = eventSchema.parse({
      ...getEventById("example-industry"),
      start: "2026-11-01T01:30:00-04:00",
      end: "2026-11-01T01:30:00-05:00",
    });
    expect(toCalendarEvent(event)).toMatchObject({
      start: event.start,
      end: event.end,
    });
    expect(toCalendarEvent(event).extendedProps?.timeLabel).toContain(
      "1:30–1:30 AM (60 min elapsed)",
    );
  });
  it("maps only published query results and handles empty ranges", () => {
    expect(
      getEvents({ start: "2026-10-19", end: "2026-10-28" })
        .map(toCalendarEvent)
        .map((event) => event.id),
    ).not.toContain("example-open-topic");
    expect(
      getEvents({ start: "2027-02-01", end: "2027-02-02" }).map(
        toCalendarEvent,
      ),
    ).toEqual([]);
  });
});

it("formats compact Eastern ranges with date-rollover and all-day cues", () => {
  expect(listEventTimes(getEventById("example-industry")!)).toEqual([
    "4:00–5:00 PM",
  ]);
  expect(listEventTimes(getEventById("example-design-days")!)).toEqual([
    "All day",
  ]);
  expect(listEventTimes(getEventById("example-night-build")!)).toEqual([
    "11:30 PM–",
    "12:30 AM",
    "Next day",
  ]);
  const repeatedHour = {
    ...getEventById("example-industry")!,
    start: "2026-11-01T01:30:00-04:00",
    end: "2026-11-01T01:30:00-05:00",
  };
  expect(listEventTimes(repeatedHour)).toEqual([
    "1:30–1:30 AM",
    "(60 min elapsed)",
  ]);
});

it("keeps accurate, chronological ranges for multiple events sharing one Eastern day", () => {
  const base = getEventById("example-industry")!;
  const records = [
    {
      ...base,
      id: "late",
      start: "2026-10-26T23:30:00-04:00",
      end: "2026-10-27T00:30:00-04:00",
    },
    {
      ...base,
      id: "morning",
      start: "2026-10-26T10:00:00-04:00",
      end: "2026-10-26T11:00:00-04:00",
    },
    {
      ...base,
      id: "afternoon",
      start: "2026-10-26T14:00:00-04:00",
      end: "2026-10-26T15:30:00-04:00",
    },
  ];
  const mapped = getEvents(
    { start: "2026-10-26", end: "2026-10-27" },
    records,
  ).map(toCalendarEvent);
  expect(mapped.map((event) => event.id)).toEqual([
    "morning",
    "afternoon",
    "late",
  ]);
  expect(mapped.map((event) => event.extendedProps?.listTimes)).toEqual([
    ["10:00–11:00 AM"],
    ["2:00–3:30 PM"],
    ["11:30 PM–", "12:30 AM", "Next day"],
  ]);
});

it("adds years only when the displayed days span years, respecting exclusive ends", () => {
  expect(listRangeCrossesYears("2026-12-01", "2027-01-01")).toBe(false);
  expect(listRangeCrossesYears("2026-12-31", "2027-01-02")).toBe(true);
  expect(listRangeCrossesYears("2027-01-01", "2027-02-01")).toBe(false);
});
