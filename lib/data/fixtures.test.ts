import { describe, expect, it } from "vitest";
import { events, exams } from "../../data/fixtures";
import type { Event } from "../domain/models";
import {
  getEventById,
  getEvents,
  getExams,
  getOrganizations,
} from "./fixtures";
const ids = (start: string, end: string, eventFixtures?: readonly Event[]) =>
  getEvents({ start, end }, eventFixtures).map((e) => e.id);
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
    const localEvents: Event[] = [
      {
        ...template,
        id: "boundary",
        allDay: false,
        start: "2026-10-20T00:00:00-04:00",
        end: "2026-10-20T01:00:00-04:00",
      },
    ];
    expect(ids("2026-10-19", "2026-10-20", localEvents)).not.toContain(
      "boundary",
    );
    expect(ids("2026-10-20", "2026-10-21", localEvents)).toContain("boundary");
  });
  it("does not include intervals ending exactly at the window start", () => {
    const localEvents: Event[] = [
      {
        ...events[0],
        id: "ends-at-start",
        allDay: false,
        start: "2026-10-19T23:00:00-04:00",
        end: "2026-10-20T00:00:00-04:00",
      },
    ];
    expect(ids("2026-10-19", "2026-10-20", localEvents)).toContain(
      "ends-at-start",
    );
    expect(ids("2026-10-20", "2026-10-21", localEvents)).not.toContain(
      "ends-at-start",
    );
  });
  it("queries Eastern dates through both DST transitions", () => {
    const localEvents: Event[] = [
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
    ];
    expect(ids("2026-03-08", "2026-03-09", localEvents)).toContain(
      "spring-day",
    );
    expect(ids("2026-03-09", "2026-03-10", localEvents)).not.toContain(
      "spring-day",
    );
    expect(ids("2026-11-01", "2026-11-02", localEvents)).toContain("fall-late");
    expect(ids("2026-11-02", "2026-11-03", localEvents)).not.toContain(
      "fall-late",
    );
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
  it("retains published unclassified events in All Events", () => {
    const unclassified = events.find(
      (event) => event.id === "example-open-topic",
    )!;
    const localEvents: Event[] = [{ ...unclassified, status: "published" }];
    expect(ids("2026-10-23", "2026-10-24", localEvents)).toEqual([
      unclassified.id,
    ]);
    expect(getEventById(unclassified.id, localEvents)?.status).toBe(
      "published",
    );
  });
  it("returns only published fixtures by default, including for direct lookup", () => {
    const results = getEvents({ start: "2026-10-19", end: "2026-10-28" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((event) => event.status === "published")).toBe(true);
    expect(getEventById("example-open-topic")).toBeUndefined();
    expect(ids("2026-10-23", "2026-10-24")).not.toContain("example-open-topic");
    // Tentative records remain in the source for a future authorized planner.
    expect(
      events.find((event) => event.id === "example-open-topic")?.status,
    ).toBe("tentative");
  });
  it.each(["draft", "tentative", "canceled"] as const)(
    "excludes %s events from list and direct public queries",
    (status) => {
      const unpublished: Event = {
        ...events[0],
        id: "unpublished-example",
        status,
      };
      const localEvents = [events[0], unpublished];
      expect(ids("2026-10-19", "2026-10-20", localEvents)).toEqual([
        "example-welcome",
      ]);
      expect(getEventById(unpublished.id, localEvents)).toBeUndefined();
      expect(
        getEvents(
          {
            start: "2026-10-19",
            end: "2026-10-20",
            filters: { audience: { mode: "all" } },
          },
          localEvents,
        ).map((event) => event.id),
      ).toEqual(["example-welcome"]);
      expect(
        getEvents(
          {
            start: "2026-10-19",
            end: "2026-10-20",
            filters: { audience: { mode: "recommended", majorIds: ["bme"] } },
          },
          localEvents,
        ).map((event) => event.id),
      ).toEqual(["example-welcome"]);
    },
  );
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
    expect(exams).toHaveLength(5);
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
