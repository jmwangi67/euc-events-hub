import { describe, expect, it } from "vitest";
import { events } from "../../data/fixtures";
import { externalEvents } from "../../data/fixtures/planning-context";
import { getEvents } from "../data/fixtures";
import { EVENT_CATEGORIES } from "./event-categories";
import { eventCategorySchema, eventSchema } from "./models";

describe("event-discovery categories and demo records", () => {
  it.each([
    [
      "general-body-meeting",
      "General Body Meetings",
      "example-gbm",
      ["example-gbm", "example-design-meeting"],
    ],
    [
      "social-recreational",
      "Social & Recreational",
      "example-social",
      ["example-welcome", "example-social"],
    ],
  ] as const)(
    "supports and filters the %s category",
    (category, label, id, expectedIds) => {
      expect(eventCategorySchema.parse(category)).toBe(category);
      expect(EVENT_CATEGORIES[category]).toBe(label);
      const record = events.find((event) => event.id === id)!;
      expect(eventSchema.parse(record)).toEqual(record);
      expect(
        getEvents({
          start: "2026-10-19",
          end: "2026-10-26",
          filters: { categories: [category] },
        }).map((event) => event.id),
      ).toEqual(expectedIds);
    },
  );

  it("preserves ambiguous legacy organization events with an explicit review flag", () => {
    const raw = { ...events[0], category: "student-organization" };
    const migrated = eventSchema.parse(raw);
    expect(migrated.id).toBe(raw.id);
    expect(migrated.category).toBeNull();
    expect(migrated.legacyCategory).toBe("student-organization");
    expect(migrated.categoryMappingNote).toMatch(/requires review/);
    expect(Object.keys(EVENT_CATEGORIES)).toHaveLength(6);
  });

  it("clearly identifies fictional public records and safe example links", () => {
    for (const event of events) {
      expect(event.title).toMatch(/^Example Event:/);
      expect(event.source.verification).toBe("synthetic");
      for (const link of [
        event.registrationUrl,
        event.virtualMeetingUrl,
        event.source.url,
      ])
        if (link) expect(new URL(link).hostname).toBe("example.com");
    }
    expect(
      events.find((event) => event.id === "example-social")
        ?.targetAcademicLevels,
    ).toHaveLength(5);
  });

  it("includes explicit fictional policy samples without altering THON dates", () => {
    const concert = externalEvents.find(
      (event) => event.id === "scenario-targeted-concert",
    )!;
    expect(concert).toMatchObject({
      scope: "campus-local",
      timeKnown: true,
      analysis: "audience-targeted",
      impactPolicy: "major-local-music",
      start: "2026-10-21T19:00:00-04:00",
      end: "2026-10-21T22:00:00-04:00",
    });
    const festival = externalEvents.find(
      (event) => event.id === "scenario-targeted-festival",
    )!;
    expect(festival).toMatchObject({
      category: "festival",
      timeKnown: true,
      start: "2026-10-24T14:00:00-04:00",
      end: "2026-10-25T01:00:00-04:00",
    });
    const thon = externalEvents.find((event) => event.id === "scenario-thon")!;
    expect([thon.startDate, thon.endDate]).toEqual([
      "2026-10-30",
      "2026-11-02",
    ]);
    for (const event of externalEvents) {
      expect(event.title).toMatch(/^Example /);
      expect(event.source.verification).toBe("synthetic");
    }
  });
});
