import { describe, expect, it } from "vitest";
import { events, exams, majors, organizations } from "../../data/fixtures";
import {
  dateOnlySchema,
  eventSchema,
  examSchema,
  majorSchema,
  organizationSchema,
} from "./models";

const timed = events.find((e) => !e.allDay)!;
const allDay = events.find((e) => e.allDay)!;
describe("domain validation", () => {
  it("validates all synthetic fixtures", () => {
    expect(eventSchema.array().parse(events)).toEqual(events);
    expect(examSchema.array().parse(exams)).toEqual(exams);
    expect(majorSchema.array().parse(majors)).toEqual(majors);
    expect(organizationSchema.array().parse(organizations)).toEqual(
      organizations,
    );
  });
  it("keeps fixture IDs unique and relationships valid", () => {
    for (const records of [events, exams, majors, organizations]) {
      expect(new Set(records.map((record) => record.id)).size).toBe(
        records.length,
      );
    }
    const majorIds = new Set(majors.map((major) => major.id));
    const orgIds = new Set(organizations.map((org) => org.id));
    for (const event of events) {
      expect(event.hostOrganizationIds.every((id) => orgIds.has(id))).toBe(
        true,
      );
      expect(event.targetMajorIds.every((id) => majorIds.has(id))).toBe(true);
      expect(event.source.verification).toBe("synthetic");
    }
    for (const org of organizations)
      expect(org.defaultMajorIds.every((id) => majorIds.has(id))).toBe(true);
    for (const exam of exams) {
      expect(exam.relevantMajorIds.every((id) => majorIds.has(id))).toBe(true);
      expect(exam.source.verification).toBe("synthetic");
    }
  });
  it.each(["2026-02-30", "2026-13-01", "2026-1-1"])(
    "rejects invalid dates: %s",
    (date) => expect(dateOnlySchema.safeParse(date).success).toBe(false),
  );
  it("requires unambiguous instants for timed events", () => {
    expect(
      eventSchema.safeParse({ ...timed, start: "2026-10-19T17:00:00" }).success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({ ...timed, start: "2026-10-19" }).success,
    ).toBe(false);
  });
  it("rejects instants for all-day events", () =>
    expect(
      eventSchema.safeParse({ ...allDay, start: timed.start }).success,
    ).toBe(false));
  it("requires strictly positive duration", () => {
    for (const event of [timed, allDay]) {
      expect(
        eventSchema.safeParse({ ...event, end: event.start }).success,
      ).toBe(false);
      expect(
        eventSchema.safeParse({ ...event, start: event.end, end: event.start })
          .success,
      ).toBe(false);
    }
  });
  it("compares instants rather than offset strings", () => {
    expect(
      eventSchema.safeParse({
        ...timed,
        start: "2026-11-01T01:30:00-04:00",
        end: "2026-11-01T01:15:00-05:00",
      }).success,
    ).toBe(true);
  });
  it("enforces targeting states", () => {
    expect(
      eventSchema.safeParse({
        ...timed,
        collegeWide: false,
        targeting: "explicit",
        targetMajorIds: [],
      }).success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({
        ...timed,
        targeting: "inherited",
        targetMajorIds: ["bme"],
      }).success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({
        ...timed,
        targeting: "unclassified",
        targetMajorIds: ["bme"],
      }).success,
    ).toBe(false);
  });
  it("allows missing optional details", () =>
    expect(
      eventSchema.safeParse(events.find((e) => e.id === "example-open-topic"))
        .success,
    ).toBe(true));
  it("rejects unsafe URL protocols", () =>
    expect(
      eventSchema.safeParse({
        ...timed,
        registrationUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false));
  it("does not invent times for unknown-time exams", () => {
    const exam = exams.find((e) => !e.timeKnown)!;
    expect(examSchema.safeParse({ ...exam, start: timed.start }).success).toBe(
      false,
    );
  });
  it("returns validation issues for malformed known-time exam timestamps", () => {
    const exam = exams.find((e) => e.timeKnown)!;
    expect(
      examSchema.safeParse({ ...exam, start: "not-an-instant" }).success,
    ).toBe(false);
    expect(
      examSchema.safeParse({ ...exam, end: "2026-10-22T20:30:00" }).success,
    ).toBe(false);
  });
  it("validates known exam duration and Eastern date", () => {
    const exam = exams.find((e) => e.timeKnown)!;
    expect(examSchema.safeParse({ ...exam, end: exam.start }).success).toBe(
      false,
    );
    expect(examSchema.safeParse({ ...exam, date: "2026-10-23" }).success).toBe(
      false,
    );
    expect(
      examSchema.safeParse({
        ...exam,
        start: "2026-10-23T00:00:00Z",
        end: "2026-10-23T01:00:00Z",
      }).success,
    ).toBe(true);
  });
});
