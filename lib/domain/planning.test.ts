import { describe, expect, it } from "vitest";
import { getEventById, getExams, getOrganizations } from "../data/fixtures";
import { eventSchema, examSchema, type Event, type Exam } from "./models";
import {
  analyzeProposal,
  planningAudience,
  proposalSchema,
  type Proposal,
} from "./planning";

const organizations = getOrganizations();
const proposed = (patch: Partial<Proposal> = {}): Proposal => ({
  title: "Local scenario",
  start: "2026-10-21T16:30:00-04:00",
  end: "2026-10-21T17:30:00-04:00",
  majorIds: ["bme"],
  ...patch,
});
const industry = getEventById("example-industry")!;
const unknown = getExams({ start: "2026-10-21", end: "2026-10-22" })[0];
const known = getExams({ start: "2026-10-22", end: "2026-10-23" })[0];
const analyze = (p: Proposal, events: Event[] = [], exams: Exam[] = []) =>
  analyzeProposal(p, events, exams, organizations);

describe("planning audiences", () => {
  it("copies defaults and honors independent overrides, including empty audiences", () => {
    const org = organizations.find((o) => o.id === "example-process")!;
    const defaults = planningAudience(org);
    defaults.push("me");
    expect(org.defaultMajorIds).toEqual(["che"]);
    expect(planningAudience(org, ["bme", "bme"])).toEqual(["bme"]);
    expect(planningAudience(org, [])).toEqual([]);
    expect(
      planningAudience(organizations.find((o) => o.id === "example-council")!),
    ).toEqual([]);
  });
  it("requires a nonempty planning audience and valid interval", () => {
    expect(() => analyze(proposed({ majorIds: [] }))).toThrow();
    expect(
      proposalSchema.safeParse(proposed({ end: proposed().start })).success,
    ).toBe(false);
    expect(
      proposalSchema.safeParse(proposed({ end: "2026-10-21T15:00:00-04:00" }))
        .success,
    ).toBe(false);
  });
});
describe("explicit recorded constraints", () => {
  it("includes cross-major explicit relevance beyond the host defaults", () => {
    const [conflict] = analyze(proposed(), [industry]);
    expect(conflict).toMatchObject({
      kind: "event-overlap",
      majorIds: ["bme"],
      reason: expect.stringContaining("explicitly"),
    });
  });
  it("excludes back-to-back intervals at either boundary", () => {
    expect(
      analyze(
        proposed({ start: industry.end, end: "2026-10-21T18:00:00-04:00" }),
        [industry],
      ),
    ).toEqual([]);
    expect(
      analyze(
        proposed({ start: "2026-10-21T15:00:00-04:00", end: industry.start }),
        [industry],
      ),
    ).toEqual([]);
  });
  it("always includes overlapping college-wide programming", () => {
    const event = eventSchema.parse({
      ...industry,
      collegeWide: true,
      targeting: "unclassified",
      targetMajorIds: [],
    });
    expect(analyze(proposed({ majorIds: ["me"] }), [event])[0]).toMatchObject({
      majorIds: ["me"],
      reason: expect.stringContaining("College-wide"),
    });
  });
  it("uses inherited audiences and explains their uncertainty", () => {
    const event = eventSchema.parse({
      ...industry,
      targeting: "inherited",
      targetMajorIds: [],
      hostOrganizationIds: ["example-design"],
    });
    expect(analyze(proposed(), [event])[0].reason).toContain("inferred");
    expect(analyze(proposed({ majorIds: ["che"] }), [event])).toEqual([]);
  });
  it("does not assume unclassified events are relevant", () => {
    expect(
      analyze(proposed(), [
        eventSchema.parse({
          ...industry,
          targeting: "unclassified",
          targetMajorIds: [],
        }),
      ]),
    ).toEqual([]);
  });
  it.each(["tentative", "draft", "canceled"] as const)(
    "excludes %s events even when passed directly",
    (status) => {
      expect(
        analyze(proposed(), [eventSchema.parse({ ...industry, status })]),
      ).toEqual([]);
    },
  );
  it("handles all-day, multi-day and exclusive-end boundaries", () => {
    const event = getEventById("example-design-days")!;
    expect(
      analyze(
        proposed({
          start: "2026-10-25T23:30:00-04:00",
          end: "2026-10-26T00:30:00-04:00",
        }),
        [event],
      ),
    ).toHaveLength(1);
    expect(
      analyze(
        proposed({
          start: "2026-10-26T00:00:00-04:00",
          end: "2026-10-26T01:00:00-04:00",
        }),
        [event],
      ),
    ).toEqual([]);
  });
  it("finds an overnight event when the proposal begins on its second day", () => {
    expect(
      analyze(
        proposed({
          start: "2026-10-27T00:00:00-04:00",
          end: "2026-10-27T00:15:00-04:00",
        }),
        [getEventById("example-night-build")!],
      ),
    ).toHaveLength(1);
  });
  it("compares real instants across spring and fall transitions", () => {
    const spring = eventSchema.parse({
      ...industry,
      start: "2026-03-08T01:50:00-05:00",
      end: "2026-03-08T03:10:00-04:00",
    });
    expect(
      analyze(
        proposed({
          start: "2026-03-08T03:00:00-04:00",
          end: "2026-03-08T03:30:00-04:00",
        }),
        [spring],
      ),
    ).toHaveLength(1);
    const fall = eventSchema.parse({
      ...industry,
      start: "2026-11-01T01:30:00-04:00",
      end: "2026-11-01T01:45:00-04:00",
    });
    expect(
      analyze(
        proposed({
          start: "2026-11-01T01:30:00-05:00",
          end: "2026-11-01T01:45:00-05:00",
        }),
        [fall],
      ),
    ).toEqual([]);
  });
  it("distinguishes exact exam overlaps from unknown-time date warnings", () => {
    expect(analyze(proposed(), [], [unknown])[0]).toMatchObject({
      kind: "exam-date-warning",
      majorIds: ["bme"],
    });
    expect(
      analyze(
        proposed({
          start: "2026-10-22T19:30:00-04:00",
          end: "2026-10-22T20:00:00-04:00",
          majorIds: ["me"],
        }),
        [],
        [known],
      )[0],
    ).toMatchObject({ kind: "exam-overlap", majorIds: ["me"] });
    expect(
      analyze(
        proposed({
          start: known.end,
          end: "2026-10-22T21:00:00-04:00",
          majorIds: ["me"],
        }),
        [],
        [known],
      ),
    ).toEqual([]);
  });
  it("places date-only exams correctly across midnight, excluding the exact end date", () => {
    expect(
      analyze(
        proposed({
          start: "2026-10-20T23:30:00-04:00",
          end: "2026-10-21T00:00:00-04:00",
        }),
        [],
        [unknown],
      ),
    ).toEqual([]);
    expect(
      analyze(
        proposed({
          start: "2026-10-20T23:30:00-04:00",
          end: "2026-10-21T00:01:00-04:00",
        }),
        [],
        [unknown],
      ),
    ).toHaveLength(1);
  });
  it("retains incomplete section and source information without inventing it", () => {
    const exam = examSchema.parse({
      ...unknown,
      sectionScope: [],
      source: { label: "Unverified example", verification: "unverified" },
    });
    const conflict = analyze(proposed(), [], [exam])[0];
    expect(conflict.record).toEqual(exam);
    expect(conflict.kind).toBe("exam-date-warning");
    expect(conflict.record).not.toHaveProperty("start");
  });
  it("ignores unrelated exams and reports empty results without changing inputs", () => {
    const data = structuredClone({
      proposal: proposed({ majorIds: ["che"] }),
      events: [industry],
      exams: [known],
    });
    const before = structuredClone(data);
    expect(analyze(data.proposal, [], data.exams)).toEqual([]);
    analyze(data.proposal, data.events, data.exams);
    expect(data).toEqual(before);
    expect(analyze(proposed())).toEqual([]);
  });
});

it.each([
  [
    "2026-03-08",
    "2026-03-09",
    "2026-03-08T03:00:00-04:00",
    "2026-03-09T00:00:00-04:00",
  ],
  [
    "2026-11-01",
    "2026-11-02",
    "2026-11-01T01:30:00-05:00",
    "2026-11-02T00:00:00-05:00",
  ],
])(
  "keeps all-day constraints on their actual Eastern DST day %s",
  (start, end, inside, boundary) => {
    const event = eventSchema.parse({
      ...getEventById("example-design-days")!,
      start,
      end,
    });
    expect(
      analyze(proposed({ start: inside, end: boundary }), [event]),
    ).toHaveLength(1);
    expect(
      analyze(
        proposed({
          start: boundary,
          end: new Date(Date.parse(boundary) + 3600000).toISOString(),
        }),
        [event],
      ),
    ).toEqual([]);
  },
);
