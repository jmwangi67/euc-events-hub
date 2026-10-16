import { describe, expect, it } from "vitest";
import { examSchema, type Exam } from "./models";
import {
  combinedExamPreparation,
  combinePreparation,
  examPreparation,
  preparationSaturday,
} from "./exam-pressure";
import { proposalPreparation, dailyPreparation } from "./preparation-sampling";
import { externalEventSchema } from "./external-events";
import { externalEligibility } from "./scheduling-eligibility";
import { externalEvents } from "../../data/fixtures/planning-context";
import { DEFAULT_RELEVANCE_WEIGHTS } from "./planning-parameters";
import { examAudienceMatch, ALL_LEVELS } from "./planning-audience";
import { resolveEasternLocal } from "../time/eastern-local";
import {
  events as sampleEvents,
  organizations as sampleOrganizations,
} from "../../data/fixtures";
import { dayPressureBreakdown, summarizeWeek } from "./weekly-planning";
import { plannerTwoWeekRange } from "./planner-calendar-state";
import { analyzePlanningProposal } from "./proposal-analysis";
const at = (date: string, time = "12:00") => resolveEasternLocal(date, time);
const audience = {
  majorIds: ["bme", "che"],
  academicLevels: ["first", "third"] as const,
  clusterIds: ["example-makers"],
};
const record = (
  id: string,
  majorIds: string[],
  date = "2026-10-21",
  time = "09:00",
): Extract<Exam, { timeKnown: true }> =>
  examSchema.options[1].parse({
    id,
    courseId: id,
    termId: "Synthetic term",
    relevantMajorIds: majorIds,
    typicalAcademicLevels: ["first"],
    sectionScope: [],
    timeKnown: true,
    date,
    start: at(date, time),
    end: at(date, "23:00"),
    source: { label: "Synthetic test scenario", verification: "synthetic" },
  });
describe("audience-cell analysis (H1/M4)", () => {
  it("does not combine BME and CHE exams into a fictitious individual's burden", () => {
    const exams = [record("bme", ["bme"]), record("che", ["che"])];
    const result = combinedExamPreparation(exams, at("2026-10-20"), audience);
    expect(result.cells).toHaveLength(4);
    for (const cell of result.cells)
      expect(cell.contributions.map((c) => c.examId)).toEqual([cell.majorId]);
    const single = examPreparation(exams[0], at("2026-10-20"), {
      majorIds: ["bme"],
      academicLevels: ["first"],
    }).value!;
    expect(result.range[1]).toBeCloseTo(single);
    expect(result.range[1]).toBeLessThan(combinePreparation([single, single]));
    expect(result.mostAffectedCells.map((c) => c.id)).toEqual([
      "bme:first",
      "che:first",
    ]);
  });
  it("deduplicates a common exam and merges its documented major audiences", () => {
    const exam = record("common", ["bme"]);
    const result = combinedExamPreparation(
      [exam, { ...exam, relevantMajorIds: ["che"] }, exam],
      at("2026-10-20"),
      audience,
    );
    for (const cell of result.cells) expect(cell.contributions).toHaveLength(1);
    expect(result.range).toEqual(
      combinedExamPreparation(
        [{ ...exam, relevantMajorIds: ["bme", "che"] }],
        at("2026-10-20"),
        audience,
      ).range,
    );
  });
  it("retains unmapped exams as cautions without inflating any cell", () => {
    const unknown = record("unknown", []);
    const result = combinedExamPreparation(
      [unknown],
      at("2026-10-20"),
      audience,
    );
    expect(result.range).toEqual([0, 0]);
    expect(result.cells.every((c) => c.contributions.length === 0)).toBe(true);
    expect(result.audienceUncertainExams[0]).toEqual(unknown);
    expect(examPreparation(unknown, at("2026-10-20"), audience)).toMatchObject({
      value: null,
      range: [0, 0],
      state: "audience-uncertain",
    });
  });
  it("flags conflicting canonical timestamps instead of selecting a numerical record", () => {
    const exam = record("conflict", ["bme"]);
    const result = combinedExamPreparation(
      [exam, { ...exam, start: at(exam.date, "10:00") }],
      at("2026-10-20"),
      audience,
    );
    expect(result.range).toEqual([0, 0]);
    expect(result.audienceUncertainExams).toHaveLength(1);
  });
  it("keeps unknown academic levels numerical only when a major mapping exists", () => {
    const exam = {
      ...record("unknown-levels", ["bme"]),
      typicalAcademicLevels: undefined,
    };
    expect(examAudienceMatch(exam, audience)).toMatchObject({
      numericalEligible: true,
      weight: DEFAULT_RELEVANCE_WEIGHTS.unknown,
    });
    expect(
      examAudienceMatch({ ...exam, relevantMajorIds: [] }, audience),
    ).toMatchObject({ numericalEligible: false, weight: 0 });
  });
});
describe("parameter sensitivity (M3)", () => {
  it.each([0, 0.3, 0.8, 1])(
    "uses configurable typical/atypical/unknown strengths at %s",
    (weight) => {
      const exam = record("sensitivity", ["bme"]);
      const parameters = {
        decay: 0.3,
        exponent: 1.35,
        relevanceWeights: {
          typical: weight,
          atypical: weight,
          unknown: weight,
        },
      };
      const full = examPreparation(exam, at("2026-10-20"), {
        majorIds: ["bme"],
        academicLevels: ["first"],
      }).value!;
      for (const [levels, typical] of [
        [["first"], ["first"]],
        [["third"], ["first"]],
        [["first"], undefined],
      ] as const) {
        const result = examPreparation(
          {
            ...exam,
            typicalAcademicLevels: typical ? [...typical] : undefined,
          },
          at("2026-10-20"),
          { majorIds: ["bme"], academicLevels: [...levels] },
          parameters,
        );
        expect(result.value).toBeCloseTo(full * weight);
      }
    },
  );
  it.each([-1, 1.1, NaN, Infinity])("rejects invalid strength %s", (weight) =>
    expect(() =>
      examAudienceMatch(record("x", ["bme"]), audience, {
        typical: weight,
        atypical: 0.65,
        unknown: 0.8,
      }),
    ).toThrow(),
  );
});
describe("exact interval and daily preparation (H2/M1/M2)", () => {
  it("finds the exact pre-exam limit and excludes the start instant", () => {
    const exam = record("exam", ["bme"]);
    const before = proposalPreparation(
      [exam],
      { start: at(exam.date, "08:00"), end: exam.start! },
      audience,
    );
    expect(before.range[1]).toBe(10);
    expect(before.cells[0].maximumAt).toEqual({
      instant: new Date(exam.start!).toISOString(),
      side: "left",
    });
    const during = proposalPreparation(
      [exam],
      { start: exam.start!, end: exam.end! },
      audience,
    );
    expect(during.range).toEqual([0, 0]);
    expect(during.atStart.cells[0].contributions[0].state).toBe(
      "direct-constraint",
    );
    expect(
      proposalPreparation(
        [exam],
        { start: exam.end!, end: at("2026-10-22", "00:00") },
        audience,
      ).range,
    ).toEqual([0, 0]);
  });
  it("finds maxima on either side of multiple start cutoffs", () => {
    const exams = [
      record("morning", ["bme"], "2026-10-21", "09:00"),
      record("afternoon", ["bme"], "2026-10-21", "15:00"),
    ];
    const result = proposalPreparation(
      exams,
      { start: at("2026-10-21", "08:00"), end: at("2026-10-21", "16:00") },
      audience,
    );
    expect(result.range[1]).toBe(10);
    expect(result.boundaries).toContainEqual({
      instant: at("2026-10-21", "09:00"),
      side: "left",
    });
    expect(result.boundaries).toContainEqual({
      instant: at("2026-10-21", "09:00"),
      side: "at",
    });
  });
  it("reports evening separately and never shows preparation after a finished morning exam", () => {
    const exam = record("morning", ["bme"]);
    const day = dailyPreparation([exam], exam.date, audience);
    expect(day.maximum.range[1]).toBe(10);
    expect(day.evening.range).toEqual([0, 0]);
    expect(day.eveningInstant).toBe(at(exam.date, "22:00"));
    expect(
      dailyPreparation([exam], "2026-10-20", audience).evening.range[1],
    ).toBeGreaterThan(8.5);
  });
  it("retains the Saturday discontinuity and finds an onset within a proposal", () => {
    const exam = record("monday", ["bme"], "2026-10-19");
    const result = proposalPreparation(
      [exam],
      { start: at("2026-10-16", "23:00"), end: at("2026-10-17", "01:00") },
      audience,
    );
    expect(result.atStart.range).toEqual([0, 0]);
    expect(result.range[1]).toBeGreaterThan(0);
    expect(
      examPreparation(
        exam,
        at("2026-10-17", "00:00"),
        audience,
        undefined,
        "left",
      ).value,
    ).toBe(0);
  });
  it.each([
    ["2026-10-18", "2026-10-17"],
    ["2026-10-24", "2026-10-17"],
  ])("anchors Sunday/Saturday exam %s", (date, onset) =>
    expect(preparationSaturday(date)).toBe(onset),
  );
  it("attributes Saturday preparation to next week's Monday exam without changing factual exam dates", () => {
    const exam = record("next-monday", ["bme"], "2026-10-26");
    const day = dailyPreparation([exam], "2026-10-24", audience);
    expect(day.maximum.range[1]).toBeGreaterThan(0);
    expect(day.upcomingExamIds).toEqual([exam.id]);
    expect(
      summarizeWeek({ start: "2026-10-18", end: "2026-10-25" }, audience, {
        events: [],
        exams: [exam],
        externalEvents: [],
        organizations: [],
      }).counts.exams,
    ).toBe(0);
  });
  it("preserves unknown-hour ranges during interval analysis", () => {
    const exam = examSchema.parse({
      ...record("unknown-time", ["bme"]),
      timeKnown: false,
      start: undefined,
      end: undefined,
    });
    const result = proposalPreparation(
      [exam],
      { start: at(exam.date, "08:00"), end: at(exam.date, "18:00") },
      audience,
    );
    expect(result.range).toEqual([0, 10]);
    expect(result.cells[0].contributions[0].value).toBeNull();
  });
  it.each([
    ["2026-03-08T01:30:00-05:00", "2026-03-08T03:30:00-04:00", "2026-03-09"],
    ["2026-11-01T01:30:00-04:00", "2026-11-01T01:30:00-05:00", "2026-11-02"],
  ])("handles DST interval %s", (start, end, date) => {
    const result = proposalPreparation(
      [record("dst", ["bme"], date)],
      { start, end },
      audience,
    );
    expect(result.range[1]).toBeGreaterThan(result.atStart.range[1]);
    expect(result.range[1]).toBeLessThanOrEqual(10);
  });
  it("is monotone, order-independent and bounded within each cell", () => {
    const exams = [
      record("a", ["bme"]),
      record("b", ["bme"]),
      record("c", ["che"]),
    ];
    expect(
      combinedExamPreparation(exams, at("2026-10-20"), audience).range,
    ).toEqual(
      combinedExamPreparation([...exams].reverse(), at("2026-10-20"), audience)
        .range,
    );
    expect(combinePreparation([0, 2, 3])).toBeCloseTo(
      combinePreparation([3, 2, 0]),
    );
    expect(combinePreparation([2, 3])).toBeGreaterThan(combinePreparation([2]));
    expect(combinePreparation([])).toBe(0);
    expect(combinePreparation(Array(100).fill(8))).toBeLessThanOrEqual(10);
  });
});
describe("external eligibility and gated overall analysis", () => {
  it("includes explicitly designated PSU-wide/national context but excludes nearby local events", () => {
    for (const event of externalEvents)
      expect(externalEligibility(event, audience).eligible).toBe(
        event.scope !== "campus-local",
      );
    const renamed = {
      ...externalEvents.find((e) => e.category === "concert")!,
      title: "THON Super Bowl Election",
    };
    expect(externalEligibility(renamed, audience).eligible).toBe(false);
  });
  it("requires explicit audience relationships for local analytical eligibility", () => {
    const local = externalEventSchema.parse({
      ...externalEvents.find((e) => e.category === "concert")!,
      analysis: "audience-targeted",
      targetMajorIds: ["bme"],
      targetAcademicLevels: ["first"],
    });
    expect(externalEligibility(local, audience).eligible).toBe(true);
    expect(
      externalEligibility(local, {
        majorIds: ["che"],
        academicLevels: ["first"],
      }).eligible,
    ).toBe(false);
    expect(
      externalEligibility(local, {
        majorIds: ["bme"],
        academicLevels: ["third"],
      }).eligible,
    ).toBe(false);
    expect(
      externalEventSchema.safeParse({ ...local, analysis: "broad-context" })
        .success,
    ).toBe(false);
  });
  it("preserves null overall score and separates local context from actual proposal constraints", () => {
    const proposal = {
      title: "Synthetic proposal",
      start: at("2026-10-21", "17:00"),
      end: at("2026-10-21", "18:00"),
      majorIds: ["bme", "che"],
      academicLevels: ALL_LEVELS,
    };
    const result = analyzePlanningProposal(proposal, {
      events: [],
      exams: [],
      organizations: [],
      externalEvents,
    });
    expect(result.overall).toEqual({
      status: "awaiting-methodology-review",
      score: null,
    });
    expect(
      result.contextOnlyExternalEvents.some((e) => e.category === "concert"),
    ).toBe(true);
    expect(
      result.externalConstraints.some((c) => c.event.category === "concert"),
    ).toBe(false);
  });
  it.each([
    ["2026-12-31", "2026-12-27", "2027-01-10"],
    ["2026-11-01", "2026-11-01", "2026-11-15"],
  ])(
    "defines two Sunday–Saturday date-grid weeks from %s",
    (date, start, end) =>
      expect(plannerTwoWeekRange(date)).toEqual({ start, end }),
  );
});

it("preserves bounded aggregation under varied input order without mutating values", () => {
  const inputs = [1.237, 7.671, 3.16, 0.04];
  const before = [...inputs];
  expect(combinePreparation(inputs)).toBe(
    combinePreparation([...inputs].reverse()),
  );
  expect(inputs).toEqual(before);
});
it("deduplicates common exam mappings in factual counts and direct proposal constraints", () => {
  const exam = record("shared", ["bme"]);
  const exams = [exam, { ...exam, relevantMajorIds: ["che"] }];
  const proposal = {
    title: "Synthetic",
    start: at(exam.date, "10:00"),
    end: at(exam.date, "11:00"),
    majorIds: ["bme"],
    academicLevels: ALL_LEVELS,
  };
  const result = analyzePlanningProposal(proposal, {
    events: [],
    exams,
    externalEvents: [],
    organizations: [],
  });
  expect(result.conflicts).toHaveLength(1);
  expect(result.conflicts[0].majorIds).toEqual(["bme"]);
  expect(
    summarizeWeek({ start: "2026-10-18", end: "2026-10-25" }, proposal, {
      events: [],
      exams,
      externalEvents: [],
      organizations: [],
    }).counts.exams,
  ).toBe(1);
});

it("matches the documented BME + CHE proposal example without pooling the two exams", () => {
  const exams = [
    record("biomedical", ["bme"], "2026-10-28"),
    record("process", ["che"], "2026-10-28"),
  ]
    .map((exam) => ({ ...exam, typicalAcademicLevels: ["third"] as const }))
    .map((exam) => ({
      ...exam,
      typicalAcademicLevels: [...exam.typicalAcademicLevels],
    }));
  const result = proposalPreparation(
    exams,
    { start: at("2026-10-27", "17:00"), end: at("2026-10-27", "18:00") },
    audience,
  );
  expect(result.atStart.range[1]).toBeCloseTo(8.41, 2);
  expect(result.range[1]).toBeCloseTo(8.53, 2);
  expect(result.mostAffectedCells.map((cell) => cell.id)).toEqual([
    "bme:third",
    "che:third",
  ]);
  expect(
    result.cells.find((cell) => cell.id === "bme:first")!.range[1],
  ).toBeGreaterThan(0);
});

it("keeps recorded all-day engineering intervals separate from unknown-hour cautions", () => {
  const result = dayPressureBreakdown(
    "2026-10-24",
    { majorIds: ["bme"] },
    {
      events: sampleEvents,
      exams: [],
      externalEvents: [],
      organizations: sampleOrganizations,
    },
  );
  expect(result.allDayConstraints.map((item) => item.id)).toEqual([
    "example-design-days",
  ]);
  expect(result.dateOnlyConstraints).toBe(0);
  expect(result.knownTimedConstraints).toHaveLength(0);
  expect(result.allDayConstraints[0].end).toBe("2026-10-26T04:00:00.000Z");
});

it("preserves major-level associations across common-exam mappings instead of inventing a Cartesian audience", () => {
  const bme = {
    ...record("common-mapped", ["bme"]),
    typicalAcademicLevels: ["third"] as const,
  };
  const che = {
    ...record("common-mapped", ["che"]),
    typicalAcademicLevels: ["first"] as const,
  };
  const records = [bme, che].map((exam) => ({
    ...exam,
    typicalAcademicLevels: [...exam.typicalAcademicLevels],
  }));
  const result = combinedExamPreparation(records, at("2026-10-20"), audience);
  const value = (id: string) =>
    result.cells.find((cell) => cell.id === id)!.range[1];
  expect(value("bme:first")).toBeCloseTo(value("bme:third") * 0.65);
  expect(value("che:third")).toBeCloseTo(value("che:first") * 0.65);
  expect(result.cells.every((cell) => cell.contributions.length === 1)).toBe(
    true,
  );
  expect(result.cells[0].contributions[0].source).toEqual(bme.source);
});
