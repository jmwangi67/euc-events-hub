import { describe, expect, it } from "vitest";
import { eventSchema, type Event } from "./models";
import { externalEventSchema, type ExternalEvent } from "./external-events";
import {
  analyzeNonExamScheduling,
  DEFAULT_NON_EXAM_POLICIES,
  nonExamDensityLabel,
  policySourceWindow,
  type NonExamContext,
} from "./non-exam-scheduling";
import { combinedExamPreparation } from "./exam-pressure";
import { resolveEasternLocal } from "../time/eastern-local";
import { easternDayStart } from "../time/eastern";

const source = {
  label: "Fictional policy test",
  verification: "synthetic" as const,
};
const audience = {
  majorIds: ["bme", "che"],
  academicLevels: ["first", "third"] as const,
  clusterIds: ["makers"],
};
const at = (date: string, clock = "12:00") => resolveEasternLocal(date, clock);
const range = (start = "2026-10-24", end = "2026-10-25") => ({
  start: easternDayStart(start),
  end: easternDayStart(end),
});
function engineering(
  id: string,
  major = "bme",
  start = at("2026-10-24", "14:00"),
  end = at("2026-10-24", "16:00"),
): Event {
  return eventSchema.parse({
    id,
    title: `Example ${id}`,
    hostOrganizationIds: ["org"],
    targetMajorIds: [major],
    targeting: "explicit",
    collegeWide: false,
    category: "technical-workshop",
    status: "published",
    allDay: false,
    start,
    end,
    source,
  });
}
type ExternalOverrides = Partial<
  Omit<ExternalEvent, "timeKnown" | "start" | "end">
> & { timeKnown?: boolean; start?: string; end?: string };
function external(overrides: ExternalOverrides = {}): ExternalEvent {
  return externalEventSchema.parse({
    id: "context",
    title: "Example local concert",
    category: "concert",
    scope: "campus-local",
    analysis: "context-only",
    analysisReason: "No documented selected-audience applicability.",
    geography: "Fictional town",
    audience: "Fictional audience",
    source,
    timeKnown: true,
    startDate: "2026-10-24",
    endDate: "2026-10-25",
    start: at("2026-10-24", "19:00"),
    end: at("2026-10-24", "22:00"),
    ...overrides,
  });
}
function thon(overrides: ExternalOverrides = {}) {
  return external({
    id: "thon",
    title: "Example THON",
    category: "thon",
    scope: "psu-wide",
    analysis: "broad-context",
    analysisReason:
      "Explicit fictional university-wide scenario, not universal attendance.",
    timeKnown: false,
    start: undefined,
    end: undefined,
    startDate: "2026-10-30",
    endDate: "2026-11-02",
    ...overrides,
  });
}
function music(overrides: ExternalOverrides = {}) {
  return external({
    analysis: "audience-targeted",
    analysisReason: "Documented fictional selected-major applicability.",
    targetMajorIds: ["bme"],
    impactPolicy: "major-local-music",
    policyRationale: "Explicit fictional major music classification.",
    ...overrides,
  });
}
const context = (
  events: Event[] = [],
  externalEvents: ExternalEvent[] = [],
): NonExamContext => ({ events, externalEvents, organizations: [] });
const analyze = (records: NonExamContext, window = range()) =>
  analyzeNonExamScheduling(records, audience, window);

describe("strict non-exam boundaries and factual audience-cell density", () => {
  it("keeps numerical non-exam and overall scores unavailable", () => {
    expect(analyze(context()).score).toBeNull();
    expect(analyze(context()).overall).toEqual({
      status: "awaiting-methodology-review",
      score: null,
    });
  });
  it("accepts no exam inputs and ignores unrelated runtime properties", () => {
    const plain = context([engineering("a")]);
    const withExtraneousExams = {
      ...plain,
      exams: [
        {
          id: "exam",
          date: "2026-10-24",
          timeKnown: true,
          start: at("2026-10-24", "10:00"),
          end: at("2026-10-24", "23:00"),
        },
      ],
    };
    expect(analyze(withExtraneousExams)).toEqual(analyze(plain));
    expect(
      combinedExamPreparation([], at("2026-10-24"), audience).range,
    ).toEqual([0, 0]);
  });
  it("does not pool simultaneous commitments for disjoint majors or levels", () => {
    const bme = {
      ...engineering("bme"),
      targetAcademicLevels: ["first"] as const,
    };
    const che = {
      ...engineering("che", "che"),
      targetAcademicLevels: ["third"] as const,
    };
    const result = analyze(
      context([
        { ...bme, targetAcademicLevels: [...bme.targetAcademicLevels] },
        { ...che, targetAcademicLevels: [...che.targetAcademicLevels] },
      ]),
    );
    expect(result.days[0].maximumConcurrent).toBe(1);
    expect(
      result.days[0].cells.map((cell) => [cell.id, cell.maximumConcurrent]),
    ).toEqual([
      ["bme:first", 1],
      ["bme:third", 0],
      ["che:first", 0],
      ["che:third", 1],
    ]);
    expect(result.days[0].primaryCaution).toBeNull();
  });
  it.each([0, 1, 2, 3, 4])(
    "reports %i overlapping commitments without inventing risk thresholds",
    (count) => {
      const result = analyze(
        context(
          Array.from({ length: count }, (_, n) => engineering(String(n))),
        ),
      );
      expect(result.days[0].maximumConcurrent).toBe(count);
      expect(result.days[0].band).toBe(
        count === 0
          ? "none"
          : count === 1
            ? "one"
            : count === 2
              ? "two"
              : "three-plus",
      );
      expect(nonExamDensityLabel(count)).toBe(
        `${count >= 3 ? "3+" : count} simultaneous commitment${count === 1 ? "" : "s"}`,
      );
      expect(result.score).toBeNull();
    },
  );
  it("does not turn sequential or back-to-back events into simultaneous overlap", () => {
    const result = analyze(
      context([
        engineering(
          "a",
          "bme",
          at("2026-10-24", "12:00"),
          at("2026-10-24", "14:00"),
        ),
        engineering("b"),
      ]),
    );
    expect(result.days[0].maximumConcurrent).toBe(1);
    expect(result.days[0].cautions).toEqual([]);
  });
  it("uses exclusive ends and clips top-level segments to exact proposal instants", () => {
    const result = analyze(context([engineering("a")]), {
      start: at("2026-10-24", "16:00"),
      end: at("2026-10-24", "17:00"),
    });
    expect(result.constraints).toEqual([]);
    expect(
      result.timeSegments.every((segment) => segment.maximumConcurrent === 0),
    ).toBe(true);
    expect(result.days[0].maximumConcurrent).toBe(0); // Proposal analysis is restricted to its actual hours.
    const clipped = analyze(context([engineering("a")]), {
      start: at("2026-10-24", "14:30"),
      end: at("2026-10-24", "15:00"),
    });
    expect(clipped.timeSegments).toHaveLength(1);
    expect(clipped.timeSegments[0].start).toBe(at("2026-10-24", "14:30"));
    expect(clipped.timeSegments[0].end).toBe(at("2026-10-24", "15:00"));
  });
  it("retains explicit clusters but does not infer targeting from host membership", () => {
    const event = {
      ...engineering("cluster", "unrelated"),
      targetClusterIds: ["makers"],
      targetAcademicLevels: ["third"] as Event["targetAcademicLevels"],
    };
    const host = {
      id: "org",
      name: "Example host",
      defaultMajorIds: [],
      networkIds: [],
      clusterIds: ["makers"],
    };
    const selected = analyze({ ...context([event]), organizations: [host] });
    expect(selected.constraints[0].affectedCellIds).toEqual([
      "bme:third",
      "che:third",
    ]);
    expect(
      analyze({
        ...context([{ ...event, targetClusterIds: undefined }]),
        organizations: [host],
      }).constraints,
    ).toEqual([]);
  });
  it("keeps college-wide applicability subject to documented level restrictions", () => {
    const record = {
      ...engineering("all"),
      collegeWide: true,
      targetMajorIds: [],
      targetAcademicLevels: ["third"] as Event["targetAcademicLevels"],
    };
    expect(analyze(context([record])).constraints[0].affectedCellIds).toEqual([
      "bme:third",
      "che:third",
    ]);
  });
  it("excludes drafts, tentative, canceled and irrelevant engineering events", () => {
    const events = ["draft", "tentative", "canceled"].map((status) => ({
      ...engineering(status),
      status: status as Event["status"],
    }));
    expect(
      analyze(context([...events, engineering("unrelated", "unknown")]))
        .constraints,
    ).toEqual([]);
  });
  it("retains genuine all-day commitments separately without invented timed density", () => {
    const record = eventSchema.parse({
      ...engineering("all-day"),
      allDay: true,
      start: "2026-10-24",
      end: "2026-10-26",
    });
    const result = analyze(context([record]));
    expect(result.days[0].allDayCommitments).toBe(1);
    expect(result.days[0].eligibleCommitments).toBe(1);
    expect(
      result.timeSegments.every((segment) => segment.maximumConcurrent === 0),
    ).toBe(true);
  });
});

describe("provisional THON policy and precedence", () => {
  it("covers seven prior calendar days, then day-before through day-after avoidance", () => {
    const result = analyze(
      context([], [thon()]),
      range("2026-10-22", "2026-11-04"),
    );
    const day = (date: string) =>
      result.days.find((item) => item.date === date)!;
    expect(day("2026-10-22").primaryCaution).toBeNull();
    expect(day("2026-10-23").primaryCaution?.label).toBe(
      "Scheduling caution — THON preparation week",
    );
    expect(day("2026-10-28").primaryCaution?.guidance).toBe(
      "scheduling-caution",
    );
    for (const date of [
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]) {
      expect(day(date).primaryCaution?.label).toBe("Avoid scheduling — THON");
      expect(
        day(date).cautions.filter((caution) => caution.eventId === "thon"),
      ).toHaveLength(1);
    }
    expect(day("2026-11-03").primaryCaution).toBeNull();
    expect(
      result.constraints[0].windows.map(
        (window) => window.internalPolicyImportance,
      ),
    ).toEqual([0.5, 1]);
    expect(result.constraints[0].windows[1].overridesWeakerCautions).toBe(true);
  });
  it("never invents hourly density from unknown THON clocks", () => {
    const result = analyze(
      context([], [thon()]),
      range("2026-10-29", "2026-11-03"),
    );
    expect(
      result.timeSegments.every((segment) => segment.maximumConcurrent === 0),
    ).toBe(true);
    expect(result.days.every((day) => day.maximumConcurrent === 0)).toBe(true);
    expect(
      result.days.every((day) => day.primaryCaution?.timingUncertain),
    ).toBe(true);
  });
  it("prioritizes eligible avoidance while keeping other reasons accessible without duplicates", () => {
    const fair = {
      ...engineering(
        "fair",
        "bme",
        at("2026-10-29", "10:00"),
        at("2026-10-29", "17:00"),
      ),
      category: "career-networking" as const,
      subtype: "career-fair" as const,
    };
    const result = analyze(
      context([fair], [thon(), thon()]),
      range("2026-10-29", "2026-10-30"),
    );
    expect(result.days[0].primaryCaution?.guidance).toBe("avoid-scheduling");
    expect(
      result.days[0].cautions.map((caution) => caution.eventId).sort(),
    ).toEqual(["fair", "thon"]);
  });
  it("uses Eastern calendar boundaries across the fall DST transition", () => {
    const result = analyze(
      context([], [thon()]),
      range("2026-10-29", "2026-11-03"),
    );
    const avoid = result.constraints[0].windows.find(
      (window) => window.guidance === "avoid-scheduling",
    )!;
    expect(avoid.start).toBe("2026-10-29T04:00:00.000Z");
    expect(avoid.end).toBe("2026-11-03T05:00:00.000Z");
    expect((Date.parse(avoid.end!) - Date.parse(avoid.start!)) / 3600000).toBe(
      121,
    );
  });
  it("does not give a context-only THON record hard analytical avoidance", () => {
    const result = analyze(
      context([], [thon({ analysis: "context-only" })]),
      range("2026-10-29", "2026-10-30"),
    );
    expect(result.days[0].primaryCaution).toMatchObject({
      contextOnly: true,
      guidance: "review-conflicts",
    });
    expect(result.days[0].maximumConcurrent).toBe(0);
  });
});

describe("explicit Local policies, actual instants and timing uncertainty", () => {
  it("adds exactly two real hours before and after an eligible major concert", () => {
    const result = analyze(context([], [music()]));
    expect(result.constraints[0].windows[0]).toMatchObject({
      start: at("2026-10-24", "17:00"),
      end: at("2026-10-25", "00:00"),
      guidance: "scheduling-caution",
    });
    expect(result.days[0].maximumConcurrent).toBe(1);
    expect(result.constraints[0].affectedCellIds).toEqual([
      "bme:first",
      "bme:third",
    ]);
  });
  it("supports multi-day festivals and overnight buffers", () => {
    const record = music({
      category: "festival",
      startDate: "2026-10-24",
      endDate: "2026-10-26",
      start: at("2026-10-24", "14:00"),
      end: at("2026-10-25", "01:00"),
    });
    const result = analyze(
      context([], [record]),
      range("2026-10-24", "2026-10-26"),
    );
    expect(result.constraints[0].windows[0]).toMatchObject({
      start: at("2026-10-24", "12:00"),
      end: at("2026-10-25", "03:00"),
    });
    expect(result.days.map((day) => day.maximumConcurrent)).toEqual([1, 1]);
  });
  it.each([
    [
      "2026-03-08T01:30:00-05:00",
      "2026-03-08T03:30:00-04:00",
      "2026-03-08",
      "2026-03-09",
    ],
    [
      "2026-11-01T01:30:00-04:00",
      "2026-11-01T01:30:00-05:00",
      "2026-11-01",
      "2026-11-02",
    ],
  ])(
    "uses elapsed buffers across DST at %s",
    (start, end, startDate, endDate) => {
      const record = music({ start, end, startDate, endDate });
      const result = analyze(context([], [record]), range(startDate, endDate));
      const window = result.constraints[0].windows[0];
      expect(Date.parse(start) - Date.parse(window.start!)).toBe(7200000);
      expect(Date.parse(window.end!) - Date.parse(end)).toBe(7200000);
      expect(Date.parse(window.end!) - Date.parse(window.start!)).toBe(
        5 * 3600000,
      );
    },
  );
  it("leaves ordinary nearby context out of density even when its policy is explicit", () => {
    const result = analyze(
      context(
        [],
        [music({ analysis: "context-only", targetMajorIds: undefined })],
      ),
    );
    expect(result.constraints[0].contextOnly).toBe(true);
    expect(result.days[0].maximumConcurrent).toBe(0);
    expect(result.days[0].primaryCaution?.label).toMatch(/^Context only/);
  });
  it("requires relevant major/level or explicit cluster intersection", () => {
    const record = music({
      targetMajorIds: ["unrelated"],
      targetClusterIds: ["makers"],
      targetAcademicLevels: ["third"],
    });
    expect(
      analyze(context([], [record])).constraints[0].affectedCellIds,
    ).toEqual(["bme:third", "che:third"]);
    expect(
      analyzeNonExamScheduling(
        context([], [record]),
        { ...audience, clusterIds: [] },
        range(),
      ).days[0].maximumConcurrent,
    ).toBe(0);
  });
  it("retains unknown music hours as date cautions without making up buffered clocks", () => {
    const record = music({
      timeKnown: false,
      start: undefined,
      end: undefined,
    });
    const result = analyze(context([], [record]));
    expect(result.constraints[0].windows[0].start).toBeUndefined();
    expect(result.constraints[0].windows[0].end).toBeUndefined();
    expect(result.days[0].timingUncertainties).toBe(1);
    expect(
      result.timeSegments.every((segment) => segment.maximumConcurrent === 0),
    ).toBe(true);
    expect(result.days[0].primaryCaution?.guidance).toBe("scheduling-caution");
  });
  it("does not select a policy by title", () => {
    const result = analyze(
      context(
        [],
        [
          external({
            title: "THON academic break major festival",
            analysis: "audience-targeted",
            targetMajorIds: ["bme"],
          }),
        ],
      ),
    );
    expect(result.constraints[0].windows[0]).toMatchObject({
      kind: "actual",
      start: at("2026-10-24", "19:00"),
      end: at("2026-10-24", "22:00"),
    });
  });
});

describe("break, fair and ordinary interval policies", () => {
  it("flags exactly two days before a documented fictional academic break, with no timed event", () => {
    const record = external({
      id: "break",
      title: "Example break",
      category: "academic-break",
      scope: "psu-wide",
      analysis: "broad-context",
      impactPolicy: "academic-break",
      policyRationale:
        "Fictional documented academic-break scenario; not a real university date.",
      timeKnown: false,
      start: undefined,
      end: undefined,
      startDate: "2026-11-02",
      endDate: "2026-11-07",
    });
    const result = analyze(
      context([], [record]),
      range("2026-10-30", "2026-11-04"),
    );
    expect(
      result.days.filter((day) => day.primaryCaution).map((day) => day.date),
    ).toEqual(["2026-10-31", "2026-11-01"]);
    expect(result.days[1].primaryCaution?.label).toBe(
      "Scheduling caution — Students may leave early for break",
    );
    expect(
      result.timeSegments.every((segment) => segment.maximumConcurrent === 0),
    ).toBe(true);
  });
  it("does not apply break departures to an ordinary holiday-like title", () => {
    const record = external({
      title: "Example holiday",
      timeKnown: false,
      start: undefined,
      end: undefined,
      startDate: "2026-11-02",
      endDate: "2026-11-03",
    });
    expect(
      analyze(
        context([], [record]),
        range("2026-10-31", "2026-11-02"),
      ).days.every((day) => day.primaryCaution === null),
    ).toBe(true);
  });
  it("runs eligible specialized career-fair impact from Eastern midnight to its exact finish", () => {
    const fair = {
      ...engineering(
        "fair",
        "bme",
        at("2026-10-24", "10:00"),
        at("2026-10-24", "15:00"),
      ),
      category: "career-networking" as const,
      subtype: "career-fair" as const,
      targetAcademicLevels: ["third"] as Event["targetAcademicLevels"],
    };
    const result = analyze(context([fair]));
    expect(result.constraints[0].windows[0]).toMatchObject({
      start: at("2026-10-24", "00:00"),
      end: at("2026-10-24", "15:00"),
    });
    expect(result.constraints[0].affectedCellIds).toEqual(["bme:third"]);
    expect(
      analyze(context([fair]), {
        start: fair.end,
        end: at("2026-10-24", "16:00"),
      }).constraints,
    ).toEqual([]);
  });
  it("does not buffer ordinary engineering events", () => {
    const record = engineering("ordinary");
    expect(analyze(context([record])).constraints[0].windows[0]).toMatchObject({
      kind: "actual",
      start: record.start,
      end: record.end,
    });
  });
});

describe("canonical handling, configuration and independence", () => {
  it("deduplicates identical commitments and preserves original sources/correlated cell mappings", () => {
    const one = {
      ...engineering("same", "bme"),
      targetAcademicLevels: ["first"] as Event["targetAcademicLevels"],
    };
    const two = {
      ...engineering("same", "che"),
      targetAcademicLevels: ["third"] as Event["targetAcademicLevels"],
      source: { ...source, label: "Second fictional source" },
    };
    const result = analyze(context([one, two, one]));
    expect(result.constraints).toHaveLength(1);
    expect(result.constraints[0].sources).toHaveLength(2);
    expect(result.constraints[0].alternatives).toHaveLength(3);
    expect(result.constraints[0].affectedCellIds).toEqual([
      "bme:first",
      "che:third",
    ]);
    expect(result.days[0].maximumConcurrent).toBe(1);
  });
  it("preserves conflicting source alternatives as uncertainty with no selected timed density", () => {
    const one = engineering("same");
    const two = engineering(
      "same",
      "bme",
      at("2026-10-24", "18:00"),
      at("2026-10-24", "20:00"),
    );
    const result = analyze(context([one, two]));
    expect(result.constraints[0].timing).toBe("source-conflict");
    expect(result.constraints[0].alternatives).toHaveLength(2);
    expect(result.days[0].maximumConcurrent).toBe(0);
    expect(result.days[0].timingUncertainties).toBe(1);
    expect(result.days[0].cautions).toHaveLength(1);
  });
  it("deduplicates one canonical identity across engineering and external source layers", () => {
    const event = engineering(
      "cross-layer",
      "bme",
      at("2026-10-24", "19:00"),
      at("2026-10-24", "22:00"),
    );
    const other = external({
      id: event.id,
      title: event.title,
      analysis: "audience-targeted",
      targetMajorIds: ["bme"],
    });
    const result = analyze(context([event], [other]));
    expect(result.constraints).toHaveLength(1);
    expect(result.constraints[0].eventTypes).toEqual(["engineering", "local"]);
    expect(result.constraints[0].alternatives).toHaveLength(2);
    expect(result.constraints[0].timing).toBe("known");
    expect(result.days[0].eligibleCommitments).toBe(1);
    expect(result.days[0].maximumConcurrent).toBe(1);
  });
  it("withholds conflicting cross-layer clocks and retains each alternative's scope/audience", () => {
    const event = engineering(
      "cross-layer",
      "bme",
      at("2026-10-24", "10:00"),
      at("2026-10-24", "11:00"),
    );
    const other = external({
      id: event.id,
      analysis: "audience-targeted",
      targetMajorIds: ["che"],
    });
    const result = analyze(context([event], [other]));
    expect(result.constraints).toHaveLength(1);
    expect(result.constraints[0].timing).toBe("source-conflict");
    expect(result.constraints[0].eventTypes).toEqual(["engineering", "local"]);
    expect(
      result.constraints[0].windows
        .map((window) => [window.eventType, window.affectedCellIds])
        .sort(),
    ).toEqual([
      ["engineering", ["bme:first", "bme:third"]],
      ["local", ["che:first", "che:third"]],
    ]);
    expect(result.days[0].maximumConcurrent).toBe(0);
    const morningChe = analyzeNonExamScheduling(
      context([event], [other]),
      { majorIds: ["che"], academicLevels: ["first"] },
      { start: event.start, end: event.end },
    );
    expect(morningChe.constraints).toEqual([]);
  });
  it("never pairs one conflicting source's audience with another source's date or clock", () => {
    const one = engineering(
      "mixed",
      "bme",
      at("2026-10-24", "10:00"),
      at("2026-10-24", "11:00"),
    );
    const two = engineering(
      "mixed",
      "che",
      at("2026-10-25", "18:00"),
      at("2026-10-25", "19:00"),
    );
    const records = context([one, two]);
    const selected = { majorIds: ["bme"], academicLevels: ["first"] as const };
    const noFalseDate = analyzeNonExamScheduling(
      records,
      selected,
      range("2026-10-25", "2026-10-26"),
    );
    expect(noFalseDate.constraints).toEqual([]);
    expect(noFalseDate.days[0].cautions).toEqual([]);
    const noFalseClock = analyzeNonExamScheduling(records, selected, {
      start: at("2026-10-24", "18:00"),
      end: at("2026-10-24", "19:00"),
    });
    expect(noFalseClock.constraints).toEqual([]);
    expect(noFalseClock.days[0].cautions).toEqual([]);
    const relevant = analyzeNonExamScheduling(records, selected, {
      start: one.start,
      end: one.end,
    });
    expect(relevant.constraints[0].alternatives).toHaveLength(2);
    expect(relevant.constraints[0].timing).toBe("source-conflict");
    expect(relevant.constraints[0].affectedCellIds).toEqual(["bme:first"]);
    expect(relevant.days[0].maximumConcurrent).toBe(0);
    const both = analyze(records, range("2026-10-24", "2026-10-26"));
    expect(both.days[0].cautions[0].affectedCellIds).toEqual([
      "bme:first",
      "bme:third",
    ]);
    expect(both.days[1].cautions[0].affectedCellIds).toEqual([
      "che:first",
      "che:third",
    ]);
  });
  it("does not report an evening policy as a nonintersecting morning proposal caution", () => {
    const result = analyze(context([], [music()]), {
      start: at("2026-10-24", "09:00"),
      end: at("2026-10-24", "10:00"),
    });
    expect(result.constraints).toEqual([]);
    expect(result.days[0].cautions).toEqual([]);
    expect(result.days[0].maximumConcurrent).toBe(0);
  });
  it("is deterministic under duplicate ordering and does not mutate inputs", () => {
    const one = engineering("a"),
      two = engineering("b");
    const records = context([one, two]);
    const snapshot = JSON.stringify(records);
    expect(analyze(context([two, one])).days).toEqual(analyze(records).days);
    expect(JSON.stringify(records)).toBe(snapshot);
  });
  it("has no visibility control inputs that alter analysis", () => {
    const records = context([engineering("a")], [music()]);
    expect(
      analyze({
        ...records,
        visibility: { events: false, external: false },
      } as NonExamContext),
    ).toEqual(analyze(records));
  });
  it("derives safe source lookaround from configured policies", () => {
    expect(
      policySourceWindow({ start: "2026-10-24", end: "2026-10-25" }),
    ).toEqual({ start: "2026-10-22", end: "2026-11-01" });
    const policies = {
      ...DEFAULT_NON_EXAM_POLICIES,
      thon: {
        ...DEFAULT_NON_EXAM_POLICIES.thon,
        leadUpDays: 10,
        maximumPolicyImportance: 8,
      },
      majorLocalMusic: { beforeHours: 72, afterHours: 96 },
    };
    expect(
      policySourceWindow({ start: "2026-10-24", end: "2026-10-25" }, policies),
    ).toEqual({ start: "2026-10-19", end: "2026-11-04" });
    const result = analyzeNonExamScheduling(
      context([], [thon()]),
      audience,
      range("2026-10-20", "2026-10-21"),
      policies,
    );
    expect(result.constraints[0].windows[0].internalPolicyImportance).toBe(4);
    expect(result.score).toBeNull();
  });
  it.each([NaN, Infinity, -1])("rejects invalid policy values %s", (value) => {
    const policies = {
      ...DEFAULT_NON_EXAM_POLICIES,
      majorLocalMusic: { beforeHours: value, afterHours: 2 },
    };
    expect(() =>
      analyzeNonExamScheduling(context(), audience, range(), policies),
    ).toThrow();
  });
  it("rejects invalid range and incomplete policy metadata", () => {
    expect(() =>
      analyze(context(), { start: at("2026-10-24"), end: at("2026-10-24") }),
    ).toThrow();
    expect(
      externalEventSchema.safeParse({ ...music(), policyRationale: undefined })
        .success,
    ).toBe(false);
    expect(
      externalEventSchema.safeParse({
        ...external(),
        impactPolicy: "academic-break",
        policyRationale: "Holiday is not an academic break",
      }).success,
    ).toBe(false);
    expect(
      externalEventSchema.safeParse({
        ...thon(),
        impactPolicy: "major-local-music",
        policyRationale: "Wrong category",
      }).success,
    ).toBe(false);
  });
});
