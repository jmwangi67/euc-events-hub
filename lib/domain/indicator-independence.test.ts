import { describe, expect, it } from "vitest";
import { analyzePlanningProposal } from "./proposal-analysis";
import { getWeeklyPlanningContext } from "../data/weekly-planning";
import { getProposalIntelligenceContext } from "../data/planner";
import { getOrganizations } from "../data/fixtures";

const proposal = {
  title: "Example unsaved proposal",
  start: "2026-10-21T16:30:00-04:00",
  end: "2026-10-21T17:30:00-04:00",
  majorIds: ["bme", "che"],
  academicLevels: ["third"] as "third"[],
};
const context = () =>
  getWeeklyPlanningContext({ start: "2026-10-18", end: "2026-10-25" });
describe("strict exam/non-exam indicator independence", () => {
  it("adding or removing exams cannot change any non-exam constraint, policy or density", () => {
    const input = context();
    const withExams = analyzePlanningProposal(proposal, input);
    const withoutExams = analyzePlanningProposal(proposal, {
      ...input,
      exams: [],
    });
    expect(withExams.nonExam).toEqual(withoutExams.nonExam);
    expect(withExams.preparation.range[1]).toBeGreaterThan(0);
    expect(withoutExams.preparation.range).toEqual([0, 0]);
    expect(
      withExams.nonExam.constraints.every(
        (item) => !item.category.includes("exam"),
      ),
    ).toBe(true);
    expect(withExams.nonExam.overall).toEqual({
      status: "awaiting-methodology-review",
      score: null,
    });
  });
  it("non-exam events and policy windows cannot change exam preparation", () => {
    const input = context();
    const withEvents = analyzePlanningProposal(proposal, input);
    const withoutEvents = analyzePlanningProposal(proposal, {
      ...input,
      events: [],
      externalEvents: [],
    });
    expect(withEvents.preparation).toEqual(withoutEvents.preparation);
    expect(withEvents.nonExam.constraints.length).toBeGreaterThan(0);
    expect(withoutEvents.nonExam.constraints).toEqual([]);
    expect(withEvents.nonExam.score).toBeNull();
    expect(withEvents.overall).toEqual({
      status: "awaiting-methodology-review",
      score: null,
    });
  });
  it("retrieves next-week THON for its seven-day preparation caution without calling it an actual overlap", () => {
    const future = {
      ...proposal,
      start: "2026-10-23T12:00:00-04:00",
      end: "2026-10-23T13:00:00-04:00",
    };
    const input = {
      ...getProposalIntelligenceContext(future),
      organizations: getOrganizations(),
    };
    expect(
      input.externalEvents.some((event) => event.id === "scenario-thon"),
    ).toBe(true);
    const result = analyzePlanningProposal(future, input);
    expect(
      result.nonExam.days[0].cautions.some(
        (caution) =>
          caution.label === "Scheduling caution — THON preparation week",
      ),
    ).toBe(true);
    expect(
      result.externalConstraints.some(
        (item) => item.event.id === "scenario-thon",
      ),
    ).toBe(false);
  });
});
