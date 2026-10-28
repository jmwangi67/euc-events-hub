import { describe, expect, it } from "vitest";
import type { EventInput } from "@fullcalendar/core";
import { displayBusynessDays } from "./display-busyness";
import {
  loadCalendarDisplayDays,
  loadCalendarItems,
  loadCalendarScheduling,
} from "./calendar-source";
import type { PlanningCalendarOptions } from "./calendar-types";
const range = { start: "2026-10-19", end: "2026-10-22" };
const timed = (
  id: string,
  start = "2026-10-19T17:00:00-04:00",
  end = "2026-10-19T18:00:00-04:00",
): EventInput => ({
  id,
  title: id,
  start,
  end,
  allDay: false,
  extendedProps: { timeLabel: "5–6 PM" },
});
const options: PlanningCalendarOptions = {
  audience: {
    majorIds: ["bme", "che", "me"],
    academicLevels: ["first", "second", "third", "fourth", "fifth-plus"],
  },
  proposal: null,
  showEvents: true,
  showUniversityEvents: true,
  showExams: true,
  showPsuWide: true,
  showNational: true,
  showCampusLocal: true,
  onExamSelect: () => {},
  onProposalSelect: () => {},
};

describe("calendar display activity, independent from analysis", () => {
  it("fills one dot per unique commitment and saturates at five without losing actual counts", () => {
    for (let count = 0; count <= 7; count++) {
      const result = displayBusynessDays(
        range,
        Array.from({ length: count }, (_, i) => timed(`${i}`)),
        [],
      );
      expect(result.get(range.start)).toMatchObject({
        filled: Math.min(5, count),
      });
      expect(result.get(range.start)!.items).toHaveLength(count);
      expect(result.get("2026-10-20")!.filled).toBe(0);
    }
  });
  it("deduplicates mandatory records against visible ones and preserves visibility provenance", () => {
    const a = timed("one");
    expect(
      displayBusynessDays(range, [a, a], [a]).get(range.start)!.items,
    ).toEqual([
      {
        id: "one",
        title: "one",
        timeLabel: "5–6 PM",
        scope: undefined,
        visible: true,
      },
    ]);
    expect(
      displayBusynessDays(range, [], [a]).get(range.start)!.items[0].visible,
    ).toBe(false);
  });
  it("skips proposals and density backgrounds without treating unknown hours as absent", () => {
    const result = displayBusynessDays(
      range,
      [
        { ...timed("draft"), extendedProps: { kind: "proposal" } },
        { ...timed("density"), display: "background" },
        {
          id: "unknown-exam",
          start: range.start,
          end: "2026-10-20",
          allDay: true,
          extendedProps: { kind: "exam", listTimes: ["Time unknown"] },
        },
      ],
      [],
    );
    expect(result.get(range.start)!.items.map((i) => i.id)).toEqual([
      "unknown-exam",
    ]);
  });
  it("counts one canonical occurrence per occupied date, with exclusive all-day and timed ends", () => {
    const overnight = timed(
      "overnight",
      "2026-10-19T23:30:00-04:00",
      "2026-10-20T00:30:00-04:00",
    );
    const midnight = timed(
      "midnight",
      "2026-10-19T21:00:00-04:00",
      "2026-10-20T00:00:00-04:00",
    );
    const allDay = {
      id: "span",
      start: "2026-10-19",
      end: "2026-10-21",
      allDay: true,
    };
    const snapshot = JSON.stringify([overnight, midnight, allDay]);
    const result = displayBusynessDays(
      range,
      [overnight, midnight, allDay],
      [],
    );
    expect(result.get("2026-10-19")!.items).toHaveLength(3);
    expect(result.get("2026-10-20")!.items.map((i) => i.id)).toEqual([
      "overnight",
      "span",
    ]);
    expect(result.get("2026-10-21")!.items).toHaveLength(0);
    expect(JSON.stringify([overnight, midnight, allDay])).toBe(snapshot);
  });
  it.each([
    [
      "2026-03-07",
      "2026-03-09",
      "2026-03-07T23:30:00-05:00",
      "2026-03-08T03:30:00-04:00",
    ],
    [
      "2026-10-31",
      "2026-11-02",
      "2026-10-31T23:30:00-04:00",
      "2026-11-01T01:30:00-05:00",
    ],
    [
      "2026-12-31",
      "2027-01-02",
      "2026-12-31T23:30:00-05:00",
      "2027-01-01T00:30:00-05:00",
    ],
  ])(
    "uses Eastern dates across DST and year boundaries: %s",
    (start, end, a, b) => {
      const result = displayBusynessDays(
        { start, end },
        [timed("boundary", a, b)],
        [],
      );
      expect([...result.values()].map((day) => day.items.length)).toEqual([
        1, 1,
      ]);
    },
  );
  it("honors visible event and exam toggles while leaving deeper analysis untouched", () => {
    const day = { start: "2026-10-19", end: "2026-10-20" };
    const before = loadCalendarScheduling(day, options.audience);
    const full = loadCalendarDisplayDays(day, {}, options).get(day.start)!;
    const examsOnly = loadCalendarDisplayDays(
      day,
      {},
      { ...options, showEvents: false },
    ).get(day.start)!;
    const hidden = loadCalendarDisplayDays(
      day,
      {},
      { ...options, showEvents: false, showExams: false },
    ).get(day.start)!;
    expect(full.items.length).toBeGreaterThan(examsOnly.items.length);
    expect(examsOnly.items.length).toBeGreaterThan(0);
    expect(hidden.items).toHaveLength(0);
    expect(loadCalendarScheduling(day, options.audience)).toEqual(before);
  });
  it("always includes both PSU-wide and national records when every display layer is hidden", () => {
    const day = { start: "2026-10-25", end: "2026-10-26" };
    const hidden = {
      ...options,
      showEvents: false,
      showExams: false,
      showUniversityEvents: false,
      showCampusLocal: false,
      showPsuWide: false,
      showNational: false,
    };
    expect(
      loadCalendarItems(
        {
          startStr: "2026-10-25T00:00:00-04:00",
          endStr: "2026-10-26T00:00:00-04:00",
        },
        {},
        hidden,
      ),
    ).toHaveLength(0);
    const counted = loadCalendarDisplayDays(day, {}, hidden).get(day.start)!;
    expect(counted.items.map((item) => item.scope).sort()).toEqual([
      "national",
      "psu-wide",
    ]);
    expect(counted.filled).toBe(2);
    expect(counted.items.every((item) => !item.visible)).toBe(true);
  });
  it("university hosting is not the broad-scope exception, and respects active audience/display context", () => {
    const day = { start: "2026-11-16", end: "2026-11-17" };
    const shown = loadCalendarDisplayDays(day, {}, options).get(day.start)!;
    const hidden = loadCalendarDisplayDays(
      day,
      {},
      { ...options, showUniversityEvents: false },
    ).get(day.start)!;
    expect(shown.items.some((item) => item.id === "discovery-bme")).toBe(true);
    expect(hidden.items.some((item) => item.id === "discovery-bme")).toBe(
      false,
    );
    expect(hidden.items.length).toBeLessThan(shown.items.length);
  });
});
