import { describe, expect, it } from "vitest";
import { events, exams } from "../../data/fixtures";
import {
  getEventById,
  getEvents,
  getExams,
  getOrganizations,
} from "./fixtures";
const ids = (start: string, end: string) =>
  getEvents({ start, end }).map((e) => e.id);
describe("fixture-backed queries", () => {
  it("includes start and excludes end boundaries", () => {
    expect(ids("2026-10-19", "2026-10-20")).toEqual(["example-welcome"]);
    expect(ids("2026-10-20", "2026-10-21")).toEqual(["example-process-lab"]);
  });
  it("includes overlapping multi-day events, excludes their exclusive end", () => {
    expect(ids("2026-10-25", "2026-10-26")).toContain("example-design-days");
    expect(ids("2026-10-26", "2026-10-27")).not.toContain(
      "example-design-days",
    );
  });
  it("includes the next-day portion of midnight-crossing events", () =>
    expect(ids("2026-10-27", "2026-10-28")).toEqual(["example-night-build"]));
  it("uses exact interval boundaries rather than UTC dates", () => {
    const template = events[0];
    events.push({
      ...template,
      id: "boundary",
      allDay: false,
      start: "2026-10-20T00:00:00-04:00",
      end: "2026-10-20T01:00:00-04:00",
    });
    try {
      expect(ids("2026-10-19", "2026-10-20")).not.toContain("boundary");
      expect(ids("2026-10-20", "2026-10-21")).toContain("boundary");
    } finally {
      events.pop();
    }
  });
  it("does not include intervals ending exactly at the window start", () => {
    events.push({
      ...events[0],
      id: "ends-at-start",
      allDay: false,
      start: "2026-10-19T23:00:00-04:00",
      end: "2026-10-20T00:00:00-04:00",
    });
    try {
      expect(ids("2026-10-20", "2026-10-21")).not.toContain("ends-at-start");
    } finally {
      events.pop();
    }
  });
  it("queries Eastern dates through both DST transitions", () => {
    events.push(
      {
        ...events[0],
        id: "spring-day",
        allDay: true,
        start: "2026-03-08",
        end: "2026-03-09",
      },
      {
        ...events[0],
        id: "fall-late",
        allDay: false,
        start: "2026-11-01T23:30:00-05:00",
        end: "2026-11-02T00:00:00-05:00",
      },
    );
    try {
      expect(ids("2026-03-08", "2026-03-09")).toContain("spring-day");
      expect(ids("2026-03-09", "2026-03-10")).not.toContain("spring-day");
      expect(ids("2026-11-01", "2026-11-02")).toContain("fall-late");
      expect(ids("2026-11-02", "2026-11-03")).not.toContain("fall-late");
    } finally {
      events.splice(-2);
    }
  });
  it("combines category, host, and intended audience filters", () =>
    expect(
      getEvents({
        start: "2026-10-19",
        end: "2026-10-28",
        filters: {
          audience: { mode: "recommended", majorIds: ["bme"] },
          organizationIds: ["example-process"],
          categories: ["corporate-recruiting"],
        },
      }).map((e) => e.id),
    ).toEqual(["example-industry"]));
  it("retains unclassified events in the default All Events query", () =>
    expect(ids("2026-10-23", "2026-10-24")).toContain("example-open-topic"));
  it("excludes drafts and cancellations from public queries", () => {
    events.push(
      { ...events[0], id: "draft-example", status: "draft" },
      { ...events[0], id: "canceled-example", status: "canceled" },
    );
    try {
      expect(ids("2026-10-19", "2026-10-20")).toEqual(["example-welcome"]);
      expect(getEventById("draft-example")).toBeUndefined();
      expect(getEventById("canceled-example")).toBeUndefined();
    } finally {
      events.splice(-2);
    }
  });
  it("returns detached records and handles missing IDs", () => {
    const event = getEventById("example-welcome")!;
    event.title = "changed";
    expect(getEventById(event.id)?.title).not.toBe("changed");
    const orgs = getOrganizations();
    orgs[0].defaultMajorIds.push("bme");
    expect(getOrganizations()[0].defaultMajorIds).toEqual([]);
    expect(getEventById("unknown")).toBeUndefined();
  });
  it("filters date-only and timed exams without inventing times", () => {
    const result = getExams({ start: "2026-10-21", end: "2026-10-22" });
    expect(result).toHaveLength(1);
    expect(result[0].timeKnown).toBe(false);
    expect(result[0].start).toBeUndefined();
    expect(getExams({ start: "2026-10-22", end: "2026-10-23" })).toHaveLength(
      1,
    );
    expect(
      getExams({
        start: "2026-10-21",
        end: "2026-10-23",
        termId: "different-term",
      }),
    ).toEqual([]);
    expect(exams).toHaveLength(2);
  });
  it("rejects malformed, reversed and empty windows", () => {
    expect(() => getEvents({ start: "invalid", end: "2026-10-23" })).toThrow();
    expect(() =>
      getEvents({ start: "2026-10-23", end: "2026-10-23" }),
    ).toThrow();
    expect(() =>
      getExams({ start: "2026-10-23", end: "2026-10-21" }),
    ).toThrow();
  });
});
