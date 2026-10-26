import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PreparationContribution } from "../../lib/domain/exam-pressure";
import type { Exam } from "../../lib/domain/models";
import { PreparationRange } from "./preparation-range";
import { PressurePanel } from "./pressure-panel";
import { OtherSchedulingConstraints } from "./other-scheduling-constraints";
import {
  PreparationCells,
  PreparationMethodology,
  AudienceUncertainty,
} from "./preparation-details";
import {
  groupPreparationCells,
  preparationGroupLabel,
  preparationSegments,
  type PreparationCell,
} from "./preparation-presentation";

const exam: Exam = {
  id: "example-exam",
  courseId: "EXAMPLE-COURSE",
  termId: "example-term",
  date: "2026-10-28",
  timeKnown: false,
  sectionScope: [],
  relevantMajorIds: ["bme"],
  source: { label: "Synthetic course example", verification: "synthetic" },
};
const contribution: PreparationContribution = {
  examId: exam.id,
  value: null,
  range: [3.25, 7.75],
  state: "date-uncertain",
  explanation: "Curated typical academic-year mapping; enrollment is unknown.",
  source: exam.source,
};
const first: PreparationCell = {
  id: "bme:first",
  majorId: "bme",
  academicLevel: "first",
  range: [3.25, 7.75],
  contributions: [contribution],
  maximumAt: { instant: "2026-10-28T04:00:00Z", side: "left" },
  lowerMaximumAt: { instant: "2026-10-27T04:00:00Z", side: "at" },
};
const second: PreparationCell = {
  ...first,
  id: "bme:second",
  academicLevel: "second",
};
const analysis = {
  range: [3.25, 7.75] as [number, number],
  cells: [first, second],
  mostAffectedCells: [first, second],
  audienceUncertainExams: [],
};

describe("experimental preparation range presentation", () => {
  it.each([
    [[6, 10], { solid: 60, uncertainty: 40, unfilled: 0 }],
    [[3, 7], { solid: 30, uncertainty: 40, unfilled: 30 }],
    [[3.25, 7.75], { solid: 32.5, uncertainty: 45, unfilled: 22.5 }],
    [[5, 5], { solid: 50, uncertainty: 0, unfilled: 50 }],
    [[0, 0], { solid: 0, uncertainty: 0, unfilled: 100 }],
  ] as const)(
    "preserves exact bounds %j without inventing a midpoint",
    (range, expected) => {
      expect(preparationSegments(range)).toEqual(expected);
    },
  );
  it.each([null, [-1, 4], [3, 11], [7, 3], [Number.NaN, 4], [3, Infinity]])(
    "keeps unavailable/invalid bounds unavailable: %j",
    (range) => {
      expect(preparationSegments(range as [number, number] | null)).toBeNull();
    },
  );
  it("renders solid lower, striped uncertainty and empty remainder with fractional equivalents", () => {
    const html = renderToStaticMarkup(
      createElement(PreparationRange, { range: [3.25, 7.75] }),
    );
    expect(html).toContain('style="width:32.5%"');
    expect(html).toContain('style="width:45%"');
    expect(html).toContain('style="width:22.5%"');
    expect(html).toContain('role="img"');
    expect(html).toContain("3.25 to 7.75 out of 10");
    expect(html).toContain(
      "uncertainty up to the upper bound, not probability",
    );
    expect(html).toContain("Experimental relative preparation estimate");
    expect(html).not.toContain("5.5");
  });
  it("has no striped portion for equal bounds and distinguishes zero from unavailable", () => {
    const zero = renderToStaticMarkup(
      createElement(PreparationRange, { range: [0, 0] }),
    );
    const missing = renderToStaticMarkup(
      createElement(PreparationRange, { range: null }),
    );
    expect(zero).not.toContain('data-range-part="uncertainty"');
    expect(zero).toContain("0 / 10");
    expect(zero).toContain("No uncertainty interval");
    expect(missing).toContain("Unavailable");
    expect(missing).toContain("No numerical estimate");
    expect(missing).not.toContain("0 / 10");
  });
});

describe("presentation-only audience grouping and disclosure", () => {
  it("groups exactly equivalent cells without mutating or replacing their independent results", () => {
    const input = [first, second];
    const before = JSON.stringify(input);
    const groups = groupPreparationCells(input);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual([first, second]);
    expect(groups[0][0]).toBe(first);
    expect(preparationGroupLabel(groups[0])).toBe(
      "BME · First year, Second year",
    );
    expect(JSON.stringify(input)).toBe(before);
    expect(first.range).toEqual([3.25, 7.75]);
  });
  it("does not group different contributions, provenance, cutoffs or exact bounds that round alike", () => {
    const variants: PreparationCell[] = [
      first,
      { ...second, range: [3.251, 7.75] },
      { ...second, contributions: [{ ...contribution, examId: "other-exam" }] },
      {
        ...second,
        contributions: [
          {
            ...contribution,
            source: { ...exam.source, label: "Other source" },
          },
        ],
      },
      {
        ...second,
        lowerMaximumAt: { instant: "2026-10-27T05:00:00Z", side: "at" },
      },
    ];
    expect(groupPreparationCells(variants)).toHaveLength(5);
  });
  it("leads with one range, grouped affected audience, main exam and visible uncertainty", () => {
    const html = renderToStaticMarkup(
      createElement(PreparationCells, { analysis, exams: [exam] }),
    );
    expect(html).toContain("Most affected selected subgroups");
    expect(html).toContain("BME · First year, Second year");
    expect(html).toContain("Main contributing exams");
    expect(html).toContain(exam.courseId);
    expect(html).toContain("uncertainty, not probability");
    expect(html).not.toContain("Upper maximum");
    expect(html).not.toContain("10 PM");
    expect(html).not.toContain("preparation-cell ");
    expect(html).not.toContain("Synthetic");
  });
  it("retains exact lower/upper references, independent cells and source detail in a closed disclosure", () => {
    const html = renderToStaticMarkup(
      createElement(PreparationMethodology, { analysis, exams: [exam] }),
    );
    expect(html).toContain("Inspect all distinct subgroup estimates (1 group)");
    expect(html).not.toContain(" open=");
    expect(html).toContain("Cells are never added or population averaged");
    expect(html).toContain("BME · First year; BME · Second year");
    expect(html).toContain("Upper maximum as a limit just before");
    expect(html).toContain("Lower maximum at");
    expect(html).toContain("Example course example");
    expect(html).toContain("Demo data — not verified");
    expect(html).toContain("enrollment is unknown");
    expect(html).not.toMatch(/\b(?:EST|EDT)\b/);
  });
  it("keeps all contradictory source dates visible as a caution with zero numerical contribution", () => {
    const other: Exam = {
      ...exam,
      date: "2026-10-29",
      source: { label: "Example second claim", verification: "unverified" },
    };
    const html = renderToStaticMarkup(
      createElement(AudienceUncertainty, {
        exams: [exam],
        sourceExams: [exam, other],
      }),
    );
    expect(html).toContain("Conflicting source claims; timing is unresolved");
    expect(html).toContain("2026-10-28");
    expect(html).toContain("2026-10-29");
    expect(html).toContain("no numerical preparation");
    expect(html).toContain("Example second claim");
    expect(html).not.toContain("<details");
  });
});

describe("independent scheduling indicators by default", () => {
  const props = {
    start: "2026-10-27",
    days: 1,
    audience: { majorIds: ["bme"] },
    context: {
      events: [],
      exams: [] as Exam[],
      organizations: [],
      externalEvents: [],
    },
  };
  it("keeps estimates opt-in, overall unavailable and non-exam output unchanged by exam-only inputs", () => {
    const empty = renderToStaticMarkup(createElement(PressurePanel, props));
    const academic = renderToStaticMarkup(
      createElement(PressurePanel, {
        ...props,
        context: { ...props.context, exams: [exam] },
      }),
    );
    expect(academic).toBe(empty);
    expect(empty).toContain('aria-label="Exam Preparation"');
    expect(empty).not.toContain('aria-label="Other Scheduling Constraints"');
    expect(empty).toContain(
      'data-overall-status="awaiting-methodology-review"',
    );
    expect(empty).not.toContain('data-non-exam-score="unavailable"');
    const nonExam = renderToStaticMarkup(
      createElement(OtherSchedulingConstraints, props),
    );
    expect(
      renderToStaticMarkup(
        createElement(OtherSchedulingConstraints, {
          ...props,
          context: { ...props.context, exams: [exam] },
        }),
      ),
    ).toBe(nonExam);
    expect(nonExam).toContain('data-non-exam-score="unavailable"');
    expect(empty).not.toContain('data-preparation-range="true"');
    expect(empty).not.toContain("Advanced methodology &amp; sources");
  });
  it("keeps missing-audience exam warnings visible with preparation off and outside the non-exam section", () => {
    const html = renderToStaticMarkup(
      createElement(PressurePanel, {
        ...props,
        context: {
          ...props.context,
          exams: [{ ...exam, relevantMajorIds: [] }],
        },
      }),
    );
    expect(html).toContain("Audience-uncertain academic constraints");
    expect(html).toContain("no numerical preparation");
    expect(html).not.toContain('data-preparation-range="true"');
    expect(html).not.toContain('aria-label="Other Scheduling Constraints"');
    const nonExam = renderToStaticMarkup(
      createElement(OtherSchedulingConstraints, {
        ...props,
        context: {
          ...props.context,
          exams: [{ ...exam, relevantMajorIds: [] }],
        },
      }),
    );
    expect(nonExam).not.toContain(exam.courseId);
    expect(nonExam).toContain("0 audience-relevant non-exam commitments");
  });
});
