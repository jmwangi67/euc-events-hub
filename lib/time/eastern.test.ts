import { describe, expect, it } from "vitest";
import {
  easternDate,
  easternDayStart,
  easternDayWindow,
  easternWeekWindow,
  formatAllDayDate,
  formatEventTime,
  formatEventClockRange,
  formatTimedInstant,
} from "./eastern";

describe("Eastern Time", () => {
  it("displays Eastern clocks without zone abbreviations", () => {
    expect(formatTimedInstant("2026-01-15T17:00:00Z")).toContain("12:00 PM");
    expect(formatTimedInstant("2026-07-15T16:00:00Z")).toContain("12:00 PM");
  });
  it("handles the spring DST jump", () => {
    expect(formatTimedInstant("2026-03-08T06:59:00Z")).toContain("1:59 AM");
    expect(formatTimedInstant("2026-03-08T07:00:00Z")).toContain("3:00 AM");
  });
  it("converts both repeated fall instants to their correct Eastern clocks", () => {
    expect(formatTimedInstant("2026-11-01T05:30:00Z")).toContain("1:30 AM");
    expect(formatTimedInstant("2026-11-01T06:30:00Z")).toContain("1:30 AM");
  });
  it.each([
    ["2026-03-08", 23],
    ["2026-11-01", 25],
    ["2026-10-20", 24],
  ])("uses correct day length for %s", (date, hours) => {
    const { start, end } = easternDayWindow(date as string);
    expect((Date.parse(end) - Date.parse(start)) / 3600000).toBe(hours);
  });
  it("uses Eastern calendar-week boundaries across DST", () => {
    expect(easternWeekWindow("2026-03-11T12:00:00Z")).toEqual({
      start: "2026-03-08T05:00:00.000Z",
      end: "2026-03-15T04:00:00.000Z",
    });
    expect(easternWeekWindow("2026-11-04T12:00:00Z")).toEqual({
      start: "2026-11-01T04:00:00.000Z",
      end: "2026-11-08T05:00:00.000Z",
    });
  });
  it("keeps all-day labels on their date", () =>
    expect(formatAllDayDate("2026-10-24")).toBe("Oct 24, 2026"));
  it("formats exclusive all-day ends correctly", () => {
    expect(
      formatEventTime({ allDay: true, start: "2026-10-24", end: "2026-10-25" }),
    ).toBe("Oct 24, 2026 · All day");
    expect(
      formatEventTime({ allDay: true, start: "2026-10-24", end: "2026-10-26" }),
    ).toBe("Oct 24, 2026 – Oct 25, 2026 · All day");
  });
  it("shows both dates when timed events cross midnight", () => {
    const label = formatEventTime({
      allDay: false,
      start: "2026-10-26T23:30:00-04:00",
      end: "2026-10-27T00:30:00-04:00",
    });
    expect(label).toContain("Oct 26");
    expect(label).toContain("Oct 27");
    expect(easternDate("2026-10-27T03:30:00Z")).toBe("2026-10-26");
  });
  it("rejects invalid boundary dates and ambiguous instants", () => {
    expect(() => easternDayStart("2026-02-30")).toThrow();
    expect(() => formatTimedInstant("2026-10-19T17:00:00")).toThrow();
  });
});

it.each([
  ["2026-10-19T17:00:00-04:00", "2026-10-19T18:00:00-04:00", "5:00–6:00 PM"],
  [
    "2026-10-19T11:30:00-04:00",
    "2026-10-19T12:30:00-04:00",
    "11:30 AM–12:30 PM",
  ],
  ["2026-10-19T00:00:00-04:00", "2026-10-19T01:00:00-04:00", "12:00–1:00 AM"],
  ["2026-03-08T01:30:00-05:00", "2026-03-08T03:30:00-04:00", "1:30–3:30 AM"],
  [
    "2026-11-01T01:30:00-04:00",
    "2026-11-01T01:30:00-05:00",
    "1:30–1:30 AM (60 min elapsed)",
  ],
])(
  "formats concise ranges across periods and DST: %s",
  (start, end, expected) => {
    expect(formatEventClockRange({ start, end })).toBe(expected);
    expect(formatEventTime({ allDay: false, start, end })).not.toMatch(
      /\b(?:EST|EDT)\b/,
    );
  },
);

it.each([
  ["07:00", "08:00", "7–8 AM"],
  ["16:00", "17:00", "4–5 PM"],
  ["19:30", "20:30", "7:30–8:30 PM"],
  ["09:00", "10:20", "9–10:20 AM"],
  ["11:00", "12:30", "11 AM–12:30 PM"],
  ["00:00", "01:00", "12–1 AM"],
  ["12:00", "13:00", "12–1 PM"],
])(
  "shortens only zero minutes in compact card clocks: %s",
  (start, end, label) => {
    const interval = Object.freeze({
      start: `2026-10-19T${start}:00-04:00`,
      end: `2026-10-19T${end}:00-04:00`,
    });
    expect(formatEventClockRange(interval, true)).toBe(label);
    expect(interval.start).toBe(`2026-10-19T${start}:00-04:00`);
  },
);
it("retains DST disambiguation and overnight periods in compact clocks", () => {
  expect(
    formatEventClockRange(
      { start: "2026-11-01T01:00:00-04:00", end: "2026-11-01T01:00:00-05:00" },
      true,
    ),
  ).toBe("1–1 AM (60 min elapsed)");
  expect(
    formatEventClockRange(
      { start: "2026-03-08T01:00:00-05:00", end: "2026-03-08T03:30:00-04:00" },
      true,
    ),
  ).toBe("1–3:30 AM");
  expect(
    formatEventClockRange(
      { start: "2026-10-26T23:00:00-04:00", end: "2026-10-27T01:30:00-04:00" },
      true,
    ),
  ).toBe("11 PM–1:30 AM");
});
