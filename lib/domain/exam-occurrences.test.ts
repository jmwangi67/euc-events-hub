import { describe, expect, it } from "vitest";
import { examOccurrences } from "./exam-occurrences";
import { examSchema, type Exam } from "./models";
import { analyzeProposal, type Proposal } from "./planning";
import { combinedExamPreparation, examPreparation } from "./exam-pressure";
import { analyzePlanningProposal } from "./proposal-analysis";
import { getExams } from "../data/fixtures";
import { summarizeWeek } from "./weekly-planning";

const monday = examSchema.parse({
  id: "synthetic-conflicting-exam",
  courseId: "EXAMPLE-COMMON",
  termId: "synthetic-fall-2026",
  date: "2026-10-26",
  timeKnown: true,
  start: "2026-10-26T09:00:00-04:00",
  end: "2026-10-26T10:00:00-04:00",
  relevantMajorIds: ["bme"],
  typicalAcademicLevels: ["third"],
  sectionScope: ["Example A"],
  source: {
    label: "Synthetic Monday source",
    url: "https://example.edu/monday",
    verification: "unverified",
  },
});
const tuesday = examSchema.parse({
  ...monday,
  date: "2026-10-27",
  start: "2026-10-27T09:00:00-04:00",
  end: "2026-10-27T10:00:00-04:00",
  source: {
    label: "Synthetic Tuesday source",
    url: "https://example.edu/tuesday",
    verification: "synthetic",
  },
});
const proposal = (
  date = "2026-10-27",
  patch: Partial<Proposal> = {},
): Proposal => ({
  title: "Synthetic uncertainty regression",
  start: `${date}T09:30:00-04:00`,
  end: `${date}T10:00:00-04:00`,
  majorIds: ["bme", "che"],
  academicLevels: ["third"],
  ...patch,
});
const analyze = (records: readonly Exam[], p = proposal()) =>
  analyzeProposal(p, [], records, []);

describe("conflicting canonical exam alternatives", () => {
  it("warns for a Tuesday-only proposal even when the Monday record is first", () => {
    const warnings = analyze([monday, tuesday]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({
      id: `exam:${monday.id}`,
      kind: "exam-audience-warning",
      record: tuesday,
      majorIds: ["bme"],
      examAlternatives: [monday, tuesday],
    });
    expect(warnings[0].reason).toContain("not a confirmed overlap");
  });

  it("returns identical canonicalization and proposal results under reversed input order", () => {
    expect(examOccurrences([tuesday, monday])).toEqual(
      examOccurrences([monday, tuesday]),
    );
    expect(analyze([tuesday, monday])).toEqual(analyze([monday, tuesday]));
  });

  it.each(["2026-10-26", "2026-10-27"])(
    "retains one uncertainty warning when the %s alternative intersects",
    (date) => {
      const warnings = analyze([monday, tuesday], proposal(date));
      expect(warnings).toHaveLength(1);
      expect(warnings[0].kind).toBe("exam-audience-warning");
      expect(warnings[0].record).toMatchObject({ date });
    },
  );

  it.each([
    ["2026-10-28T09:30:00-04:00", "2026-10-28T10:00:00-04:00"],
    ["2026-10-27T10:00:00-04:00", "2026-10-27T10:30:00-04:00"],
    ["2026-10-27T08:30:00-04:00", "2026-10-27T09:00:00-04:00"],
  ])(
    "does not warn outside every alternative, including exact boundaries: %s",
    (start, end) => {
      expect(
        analyze([monday, tuesday], proposal(undefined, { start, end })),
      ).toEqual([]);
    },
  );

  it("checks both conflicting times on the same date without warning in the gap", () => {
    const afternoon = examSchema.parse({
      ...monday,
      start: "2026-10-26T14:00:00-04:00",
      end: "2026-10-26T15:00:00-04:00",
    });
    for (const [start, end] of [
      ["09:30", "10:00"],
      ["14:30", "15:00"],
    ]) {
      const warnings = analyze(
        [monday, afternoon],
        proposal("2026-10-26", {
          start: `2026-10-26T${start}:00-04:00`,
          end: `2026-10-26T${end}:00-04:00`,
        }),
      );
      expect(warnings).toHaveLength(1);
      expect(warnings[0].kind).toBe("exam-audience-warning");
    }
    expect(
      analyze(
        [monday, afternoon],
        proposal("2026-10-26", {
          start: "2026-10-26T12:00:00-04:00",
          end: "2026-10-26T13:00:00-04:00",
        }),
      ),
    ).toEqual([]);
  });

  it("preserves known-time and date-only records without assigning unknown clocks", () => {
    const dateOnly = examSchema.parse({
      ...tuesday,
      timeKnown: false,
      start: undefined,
      end: undefined,
    });
    const p = proposal("2026-10-27", {
      start: "2026-10-27T19:00:00-04:00",
      end: "2026-10-27T20:00:00-04:00",
    });
    const warnings = analyze([monday, dateOnly], p);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({
      kind: "exam-audience-warning",
      record: dateOnly,
      examAlternatives: [monday, dateOnly],
    });
    expect(warnings[0].record.start).toBeUndefined();
    expect(analyze([dateOnly, monday], p)).toEqual(warnings);
    expect(
      analyze(
        [monday, dateOnly],
        proposal("2026-10-28", {
          start: "2026-10-28T00:00:00-04:00",
          end: "2026-10-28T00:30:00-04:00",
        }),
      ),
    ).toEqual([]);
  });

  it("deduplicates identical alternatives and produces only one warning spanning both dates", () => {
    const records = [
      monday,
      tuesday,
      structuredClone(monday),
      structuredClone(tuesday),
    ];
    const p = proposal("2026-10-26", { end: "2026-10-27T10:00:00-04:00" });
    const warnings = analyze(records, p);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].examAlternatives).toEqual([monday, tuesday]);
    expect(analyze([...records].reverse(), p)).toEqual(warnings);
  });

  it("keeps source provenance and disjoint major/level mappings with the matching alternative", () => {
    const cheTuesday = examSchema.parse({
      ...tuesday,
      relevantMajorIds: ["che"],
      typicalAcademicLevels: ["first"],
      sectionScope: ["Example CHE"],
    });
    const records = [monday, cheTuesday];
    expect(analyze(records)[0]).toMatchObject({
      majorIds: ["che"],
      record: cheTuesday,
      examAlternatives: [monday, cheTuesday],
    });
    expect(analyze(records, proposal("2026-10-26"))[0].majorIds).toEqual([
      "bme",
    ]);
    // A relevant Monday audience must not make CHE's Tuesday alternative apply to BME.
    expect(
      analyze(records, proposal(undefined, { majorIds: ["bme"] })),
    ).toEqual([]);
    expect(
      analyze(records, proposal("2026-10-26", { majorIds: ["che"] })),
    ).toEqual([]);
    expect(analyze([...records].reverse())).toEqual(analyze(records));
  });

  it("retains different source and audience mappings even when their possible timing agrees", () => {
    const cheTuesday = examSchema.parse({
      ...tuesday,
      relevantMajorIds: ["che"],
      source: { label: "Another synthetic source", verification: "unverified" },
    });
    const warnings = analyze([monday, tuesday, cheTuesday]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].majorIds).toEqual(["bme", "che"]);
    expect(warnings[0].examAlternatives).toHaveLength(3);
    expect(warnings[0].examAlternatives).toEqual(
      expect.arrayContaining([monday, tuesday, cheTuesday]),
    );
  });

  it("excludes every conflicting alternative from numerical preparation and keeps overall scoring null", () => {
    const records = [monday, tuesday];
    for (const ordered of [records, [...records].reverse()]) {
      const result = analyzePlanningProposal(proposal(), {
        exams: ordered,
        events: [],
        organizations: [],
        externalEvents: [],
      });
      expect(result.preparation.range).toEqual([0, 0]);
      expect(result.preparation.atStart.range).toEqual([0, 0]);
      expect(
        result.preparation.cells.every(
          (cell) => cell.contributions.length === 0,
        ),
      ).toBe(true);
      expect(result.preparation.audienceUncertainExams).toHaveLength(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.cells.every((cell) => cell.examIds.length === 0)).toBe(
        true,
      );
      expect(result.overall).toEqual({
        score: null,
        status: "awaiting-methodology-review",
      });
    }
  });

  it("still deduplicates consistent common exams across majors and sections", () => {
    const cheMonday = examSchema.parse({
      ...monday,
      relevantMajorIds: ["che"],
      typicalAcademicLevels: ["first"],
      sectionScope: ["Example CHE"],
    });
    const records = [monday, cheMonday, monday];
    const canonical = examOccurrences(records);
    expect(canonical.exams).toHaveLength(1);
    expect(canonical.identityUncertainExams).toEqual([]);
    expect(canonical.exams[0].relevantMajorIds).toEqual(
      expect.arrayContaining(["bme", "che"]),
    );
    expect(canonical.exams[0].sectionScope).toEqual(
      expect.arrayContaining(["Example A", "Example CHE"]),
    );
    const conflicts = analyze(records, proposal("2026-10-26"));
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].kind).toBe("exam-overlap");
    const preparation = combinedExamPreparation(
      records,
      "2026-10-25T19:00:00-04:00",
      proposal(),
    );
    expect(
      preparation.cells.every((cell) => cell.contributions.length === 1),
    ).toBe(true);
  });

  it("range queries retain the whole identity when only one alternative intersects", () => {
    const records = [monday, tuesday];
    const selected = getExams(
      {
        start: "2026-10-27",
        end: "2026-10-28",
        includeIdentityAlternatives: true,
      },
      records,
    );
    expect(selected).toEqual([monday, tuesday]);
    expect(analyze(selected)[0].kind).toBe("exam-audience-warning");
    expect(
      getExams({ start: "2026-10-27", end: "2026-10-28" }, records),
    ).toEqual([tuesday]);
    expect(
      getExams(
        {
          start: "2026-10-28",
          end: "2026-10-29",
          includeIdentityAlternatives: true,
        },
        records,
      ),
    ).toEqual([]);
    expect(
      getExams(
        {
          start: "2026-10-27",
          end: "2026-10-28",
          termId: "other-term",
          includeIdentityAlternatives: true,
        },
        records,
      ),
    ).toEqual([]);
  });

  it("recognizes date-only alternatives outside another record's known hours on the same date", () => {
    const dateOnly = examSchema.parse({
      ...tuesday,
      timeKnown: false,
      start: undefined,
      end: undefined,
    });
    const warnings = analyze(
      [tuesday, dateOnly],
      proposal(undefined, {
        start: "2026-10-27T18:00:00-04:00",
        end: "2026-10-27T19:00:00-04:00",
      }),
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].kind).toBe("exam-audience-warning");
    expect(warnings[0].record).toMatchObject({ timeKnown: false });
  });

  it("does not attribute an unmapped intersecting alternative to a mapped nonintersecting audience", () => {
    const unknown = examSchema.parse({ ...tuesday, relevantMajorIds: [] });
    const warnings = analyze(
      [monday, unknown],
      proposal(undefined, { majorIds: ["che"] }),
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].majorIds).toEqual([]);
    expect(warnings[0].examAlternatives).toEqual([monday, unknown]);
    const preparation = combinedExamPreparation(
      [monday, unknown],
      "2026-10-25T19:00:00-04:00",
      proposal(),
    );
    expect(preparation.range).toEqual([0, 0]);
    expect(preparation.audienceUncertainExams).toHaveLength(1);
    expect(
      combinedExamPreparation(
        [unknown, monday],
        "2026-10-25T19:00:00-04:00",
        proposal(),
      ),
    ).toEqual(preparation);
  });

  it("checks the actual instants of conflicting repeated fall-back clocks", () => {
    const first = examSchema.parse({
      ...monday,
      date: "2026-11-01",
      start: "2026-11-01T01:15:00-04:00",
      end: "2026-11-01T01:45:00-04:00",
    });
    const second = examSchema.parse({
      ...first,
      start: "2026-11-01T01:15:00-05:00",
      end: "2026-11-01T01:45:00-05:00",
    });
    for (const offset of ["-04:00", "-05:00"]) {
      const warnings = analyze(
        [first, second],
        proposal("2026-11-01", {
          start: `2026-11-01T01:30:00${offset}`,
          end: `2026-11-01T01:45:00${offset}`,
        }),
      );
      expect(warnings).toHaveLength(1);
      expect(warnings[0].record.start).toBe(`2026-11-01T01:15:00${offset}`);
      expect(warnings[0].kind).toBe("exam-audience-warning");
    }
    expect(
      analyze(
        [first, second],
        proposal("2026-11-01", {
          start: "2026-11-01T01:45:00-04:00",
          end: "2026-11-01T01:15:00-05:00",
        }),
      ),
    ).toEqual([]);
  });

  it("retains a matching alternative's weekly uncertainty across week boundaries without double counting", () => {
    const nextWeek = examSchema.parse({
      ...tuesday,
      date: "2026-11-02",
      start: "2026-11-02T09:00:00-05:00",
      end: "2026-11-02T10:00:00-05:00",
      relevantMajorIds: ["che"],
    });
    const context = {
      events: [],
      exams: [monday, nextWeek, nextWeek],
      externalEvents: [],
      organizations: [],
    };
    const summary = summarizeWeek(
      { start: "2026-11-01", end: "2026-11-08" },
      { majorIds: ["che"] },
      context,
    );
    expect(summary.counts).toMatchObject({
      exams: 0,
      uncertainExams: 1,
      uniqueTotal: 1,
    });
    expect(summary.uncertainExams[0]).toEqual(nextWeek);
    expect(
      summarizeWeek(
        { start: "2026-11-01", end: "2026-11-08" },
        { majorIds: ["bme"] },
        context,
      ).counts.uncertainExams,
    ).toBe(0);
  });

  it("does not mutate source records or expose them through returned query copies", () => {
    const records = [monday, tuesday];
    const before = structuredClone(records);
    examOccurrences(records);
    analyze(records);
    const selected = getExams(
      {
        start: "2026-10-27",
        end: "2026-10-28",
        includeIdentityAlternatives: true,
      },
      records,
    );
    selected[0].source.label = "Local edit";
    selected[0].relevantMajorIds.push("me");
    expect(records).toEqual(before);
  });
});

describe("independent preparation numerical oracles", () => {
  // 50-digit Decimal calculation, independent of application helpers:
  // 10 * exp(-0.30 * (hours / 24)^1.35), with hours = 33, 14, 1.
  it.each([
    ["2026-10-25T00:00:00-04:00", 6.305663325244705],
    ["2026-10-25T19:00:00-04:00", 8.650970974602986],
    ["2026-10-26T08:00:00-04:00", 9.958984886215151],
  ])(
    "matches the independent weight-1 Monday-exam reference at %s",
    (instant, expected) => {
      const result = examPreparation(monday, instant, {
        majorIds: ["bme"],
        academicLevels: ["third"],
      });
      expect(result.value).toBeCloseTo(expected, 9);
      expect(result.range[0]).toBeCloseTo(expected, 9);
      expect(result.range[1]).toBeCloseTo(expected, 9);
    },
  );
  it("returns exactly zero at the Monday 9 AM start", () => {
    expect(
      examPreparation(monday, "2026-10-26T09:00:00-04:00", {
        majorIds: ["bme"],
        academicLevels: ["third"],
      }),
    ).toMatchObject({
      value: 0,
      range: [0, 0],
      state: "direct-constraint",
    });
  });
});
