import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConflictPanel } from "./conflict-panel";
import { getMajors } from "../../lib/data/fixtures";
import { examSchema, type Exam } from "../../lib/domain/models";
import { analyzeProposal } from "../../lib/domain/planning";

const monday = examSchema.parse({
  id: "synthetic-conflict",
  courseId: "EXAMPLE-SOURCE",
  termId: "synthetic-term",
  date: "2026-10-26",
  timeKnown: true,
  start: "2026-10-26T09:00:00-04:00",
  end: "2026-10-26T10:00:00-04:00",
  relevantMajorIds: ["bme"],
  typicalAcademicLevels: ["third"],
  sectionScope: ["Example BME section"],
  source: {
    label: "Synthetic Monday source",
    url: "https://example.edu/synthetic-monday",
    verification: "unverified",
  },
});
const tuesday = examSchema.parse({
  ...monday,
  date: "2026-10-27",
  timeKnown: false,
  start: undefined,
  end: undefined,
  relevantMajorIds: ["che"],
  typicalAcademicLevels: ["first"],
  sectionScope: ["Example CHE section"],
  source: { label: "Synthetic Tuesday source", verification: "synthetic" },
});
const proposal = {
  title: "Synthetic proposal",
  start: "2026-10-27T19:00:00-04:00",
  end: "2026-10-27T20:00:00-04:00",
  majorIds: ["bme", "che"],
};
const render = (exams: Exam[]) =>
  renderToStaticMarkup(
    createElement(ConflictPanel, {
      proposal,
      conflicts: analyzeProposal(proposal, [], exams, []),
      majors: getMajors(),
      onEventSelect: () => {},
      onExamSelect: () => {},
    }),
  );

describe("canonical timing uncertainty presentation", () => {
  it("shows all source timings and mappings under one caution without claiming a confirmed overlap", () => {
    const html = render([monday, tuesday]);
    expect(html).toContain("0 interval overlaps");
    expect(html).toContain("1 date-level warning");
    expect(html).toContain("Timing-uncertain academic constraint");
    expect(html).toContain("Inspect conflicting exam sources");
    expect(html).toContain("not a confirmed exam time");
    expect(html).toContain("Oct 26, 2026");
    expect(html).toContain("Oct 27, 2026");
    expect(html).toContain("9:00–10:00 AM");
    expect(html).toContain("Time unknown");
    expect(html).toContain("Synthetic Monday source");
    expect(html).toContain("https://example.edu/synthetic-monday");
    expect(html).toContain("Verification: Unverified");
    expect(html).toContain("Example Tuesday source");
    expect(html).toContain("Verification: Demo data — not verified");
    expect(html).toContain("Example BME section");
    expect(html).toContain("Example CHE section");
    expect(html).toContain("Mapped majors: BME");
    expect(html).toContain("Mapped majors: CHE");
    expect(html).toContain("Typical levels: Third year");
    expect(html).toContain("Typical levels: First year");
    expect(html).not.toContain("Known-time academic exam overlap");
    expect(html).not.toMatch(/\b(?:EST|EDT)\b/);
    expect(render([tuesday, monday])).toBe(html);
  });

  it("preserves an ordinary date-only warning without a conflicting-source disclosure", () => {
    const html = render([tuesday]);
    expect(html).toContain("Date-level academic warning · Time unknown");
    expect(html).not.toContain("Inspect conflicting exam sources");
    expect(html).toContain("Example Tuesday source");
    expect(html).toContain("Verification: Demo data — not verified");
  });
});
