import { describe, expect, it } from "vitest";
import { events, exams, organizations } from "../../data/fixtures";
import {
  externalEvents,
  organizationClusters,
} from "../../data/fixtures/planning-context";
import { eventSchema, examSchema } from "./models";
import { externalEventSchema } from "./external-events";
import {
  ALL_LEVELS,
  eventAudienceMatch,
  examAudienceMatch,
} from "./planning-audience";
import {
  calendarWeeks,
  summarizeWeek,
  dayPressureBreakdown,
} from "./weekly-planning";
import { getWeeklyPlanningContext } from "../data/weekly-planning";
import { analyzeProposal } from "./planning";
const audience = {
  majorIds: ["che"],
  academicLevels: ALL_LEVELS,
  clusterIds: [] as string[],
};
const context = { events, exams, externalEvents, organizations };
const week = { start: "2026-10-18", end: "2026-10-25" };
const industry = events.find((e) => e.id === "example-industry")!;
describe("independent audience dimensions", () => {
  it("intersects event academic levels with major relevance", () => {
    expect(
      eventAudienceMatch(
        industry,
        { ...audience, academicLevels: ["first"] },
        organizations,
      ).relevant,
    ).toBe(false);
    expect(
      eventAudienceMatch(
        industry,
        { ...audience, academicLevels: ["third"] },
        organizations,
      ).relevant,
    ).toBe(true);
    expect(
      eventAudienceMatch(
        industry,
        { ...audience, majorIds: ["me"] },
        organizations,
      ).relevant,
    ).toBe(false);
  });
  it("requires explicit cluster targeting rather than host membership", () => {
    const selected = {
      ...audience,
      majorIds: ["me"],
      clusterIds: ["example-makers", "example-careers"],
    };
    expect(eventAudienceMatch(industry, selected, organizations)).toMatchObject(
      { relevant: true, cluster: true, major: false },
    );
    expect(
      eventAudienceMatch(
        { ...industry, targetClusterIds: [] },
        selected,
        organizations,
      ).relevant,
    ).toBe(false);
    const conflict = analyzeProposal(
      {
        title: "Scenario",
        start: industry.start,
        end: industry.end,
        ...selected,
      },
      [industry],
      [],
      organizations,
    )[0];
    expect(conflict.reason).toContain(
      "explicitly targets a selected organization cluster",
    );
  });
  it("models many-to-many memberships without changing majors", () => {
    const process = organizations.find((o) => o.id === "example-process")!;
    expect(process.clusterIds).toHaveLength(2);
    expect(
      organizations.filter((o) => o.clusterIds?.includes("example-makers")),
    ).toHaveLength(2);
    expect(organizationClusters).toHaveLength(2);
    expect(process.defaultMajorIds).toEqual(["che"]);
  });
  it("handles unknown event levels as broad and empty selections explicitly", () => {
    const event = { ...industry, targetAcademicLevels: undefined };
    expect(
      eventAudienceMatch(
        event,
        { ...audience, academicLevels: ["first"] },
        organizations,
      ).relevant,
    ).toBe(true);
    expect(
      eventAudienceMatch(
        event,
        { ...audience, academicLevels: [] },
        organizations,
      ).relevant,
    ).toBe(false);
  });
  it("maps introductory STEM across majors and upper courses to their majors", () => {
    const general = exams.filter((e) => e.id.startsWith("scenario-intro"));
    expect(general).toHaveLength(2);
    for (const exam of general)
      for (const major of ["bme", "che", "me"])
        expect(
          examAudienceMatch(exam, {
            majorIds: [major],
            academicLevels: ["first"],
          }),
        ).toMatchObject({ relevant: true, weight: 1 });
    const upper = exams.find((e) => e.id === "scenario-upper-process")!;
    expect(
      examAudienceMatch(upper, {
        majorIds: ["che"],
        academicLevels: ["third"],
      }),
    ).toMatchObject({ relevant: true, weight: 1 });
    expect(examAudienceMatch(upper, { majorIds: ["me"] }).relevant).toBe(false);
  });
  it("retains out-of-sequence and unknown-level exams conservatively", () => {
    const exam = exams[0];
    expect(
      examAudienceMatch(exam, {
        majorIds: ["che"],
        academicLevels: ["fifth-plus"],
      }),
    ).toMatchObject({ relevant: true, weight: 0.65 });
    expect(
      examAudienceMatch(
        { ...exam, typicalAcademicLevels: undefined },
        audience,
      ),
    ).toMatchObject({ relevant: true, weight: 0.8 });
    expect(
      examAudienceMatch({ ...exam, relevantMajorIds: [] }, audience)
        .explanation,
    ).toContain("unknown");
  });
});
describe("weekly factual counts", () => {
  it("uses Sunday–Saturday boundaries across months and years", () => {
    expect(calendarWeeks("2026-12-30", "2027-01-06")).toEqual([
      { start: "2026-12-27", end: "2027-01-03" },
      { start: "2027-01-03", end: "2027-01-10" },
    ]);
    expect(() => calendarWeeks("2026-12-30", "2026-12-29")).toThrow();
  });
  it("deduplicates cluster, audience and category matches by canonical identity", () => {
    const selected = {
      ...audience,
      clusterIds: ["example-makers", "example-careers"],
    };
    const result = summarizeWeek(week, selected, {
      ...context,
      events: [industry, industry],
      exams: [exams[0], exams[0]],
      externalEvents: [externalEvents[0], externalEvents[0]],
    });
    expect(result.counts).toMatchObject({
      otherEvents: 1,
      exams: 1,
      psuWide: 1,
      clusterMatches: 1,
      majorMatches: 1,
      academicLevelMatches: 1,
      uniqueTotal: 3,
    });
  });
  it("distinguishes college-wide programming from campus/local and national", () => {
    const result = summarizeWeek(week, audience, context);
    expect(result.counts.collegeWide).toBe(1);
    expect(result.counts.psuWide).toBe(2);
    expect(result.counts.campusLocal).toBe(1);
    expect(result.counts.national).toBe(1);
    expect(result.counts.uniqueTotal).toBe(
      result.events.length +
        result.exams.length +
        result.uncertainExams.length +
        result.externalEvents.length,
    );
  });
  it("counts a multi-day external occurrence once in each intersecting week", () => {
    const homecoming = externalEvents[0];
    for (const window of [week, { start: "2026-10-25", end: "2026-11-01" }])
      expect(
        summarizeWeek(window, audience, {
          ...context,
          externalEvents: [homecoming],
        }).externalEvents,
      ).toHaveLength(1);
    expect(
      summarizeWeek({ start: "2026-10-26", end: "2026-10-27" }, audience, {
        ...context,
        externalEvents: [homecoming],
      }).externalEvents,
    ).toHaveLength(0);
  });
  it("includes overnight second-day constraints and respects exclusive ends", () => {
    const night = events.find((e) => e.id === "example-night-build")!;
    const selected = { ...audience, majorIds: ["me"] };
    expect(
      summarizeWeek({ start: "2026-10-27", end: "2026-10-28" }, selected, {
        ...context,
        events: [night],
      }).events,
    ).toHaveLength(1);
    expect(
      summarizeWeek({ start: "2026-10-28", end: "2026-10-29" }, selected, {
        ...context,
        events: [night],
      }).events,
    ).toHaveLength(0);
  });
  it("never admits unpublished records or unclassified host-only matches", () => {
    const result = summarizeWeek(week, audience, {
      ...context,
      events: [
        eventSchema.parse({ ...industry, status: "tentative" }),
        eventSchema.parse({
          ...industry,
          targeting: "unclassified",
          targetMajorIds: [],
          targetClusterIds: [],
        }),
      ],
    });
    expect(result.events).toEqual([]);
  });
  it("keeps missing times and unverified sources intact", () => {
    const external = externalEventSchema.parse({
      ...externalEvents[0],
      source: { label: "Uncertain scenario", verification: "unverified" },
    });
    const result = summarizeWeek(week, audience, {
      ...context,
      externalEvents: [external],
    });
    expect(result.externalEvents[0]).not.toHaveProperty("start");
    expect(result.externalEvents[0].source.verification).toBe("unverified");
    expect(
      externalEventSchema.safeParse({
        ...external,
        start: "2026-10-23T00:00:00Z",
      }).success,
    ).toBe(false);
  });
  it("validates known Eastern date bounds and external category scopes", () => {
    const known = externalEvents.find((e) => e.timeKnown)!;
    expect(
      externalEventSchema.safeParse({ ...known, startDate: "2026-10-23" })
        .success,
    ).toBe(false);
    expect(
      externalEventSchema.safeParse({ ...known, scope: "national" }).success,
    ).toBe(false);
  });
  it("fetches preparation lookahead and never accepts display visibility filters", () => {
    const result = getWeeklyPlanningContext({
      start: "2026-10-18",
      end: "2026-10-25",
    });
    expect(result.exams.some((e) => e.id === "scenario-upper-process")).toBe(
      true,
    );
    expect(result.externalEvents.length).toBe(4);
    const snapshot = structuredClone(result);
    dayPressureBreakdown("2026-10-21", audience, result);
    expect(result).toEqual(snapshot);
  });
  it("separates day snapshots, direct intervals and the gated overall design", () => {
    const result = dayPressureBreakdown("2026-10-21", audience, context);
    expect(result.overall).toEqual({
      score: null,
      status: "awaiting-methodology-review",
    });
    expect(result.dateOnlyConstraints).toBe(1);
    expect(result.contextOnlyExternalEvents).toHaveLength(1);
    expect(result.knownTimedConstraints.some((c) => c.id === industry.id)).toBe(
      true,
    );
    expect(
      result.preparationAtDayStart.cells
        .flatMap((cell) => cell.contributions)
        .some((c) => c.state === "date-uncertain"),
    ).toBe(true);
  });
  it("handles unknown exam levels without fabricating stored data", () => {
    const exam = examSchema.parse({
      ...exams[0],
      typicalAcademicLevels: undefined,
    });
    const result = summarizeWeek(week, audience, { ...context, exams: [exam] });
    expect(result.exams[0].typicalAcademicLevels).toBeUndefined();
  });
});

it("deduplicates a canonical occurrence across layers while retaining category counts", () => {
  const external = externalEventSchema.parse({
    ...externalEvents[1],
    id: industry.id,
    startDate: "2026-10-21",
    endDate: "2026-10-22",
    start: industry.start,
    end: industry.end,
  });
  const result = summarizeWeek(week, audience, {
    ...context,
    events: [industry],
    exams: [],
    externalEvents: [external],
  });
  expect(result.counts).toMatchObject({
    otherEvents: 1,
    psuWide: 1,
    uniqueTotal: 1,
  });
  expect(
    dayPressureBreakdown("2026-10-21", audience, {
      ...context,
      events: [industry],
      exams: [],
      externalEvents: [external],
    }).knownTimedConstraints,
  ).toHaveLength(1);
});
it("rejects malformed weekly boundaries", () =>
  expect(() => calendarWeeks("2026-10-18", "not-a-date")).toThrow());

it("fetches complete summary weeks even when compact display starts midweek", () => {
  const context = getWeeklyPlanningContext({
    start: "2026-10-22",
    end: "2026-10-23",
  });
  expect(context.events.some((event) => event.id === "example-industry")).toBe(
    true,
  );
  expect(
    context.externalEvents.some((event) => event.id === "scenario-election"),
  ).toBe(true);
});
