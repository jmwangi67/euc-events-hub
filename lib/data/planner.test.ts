import { expect, it } from "vitest";
import { getEvents, getOrganizations } from "./fixtures";
import { getProposalContext } from "./planner";
import { analyzeProposal, type Proposal } from "../domain/planning";
it("keeps planning context independent of hidden display categories", () => {
  const proposal: Proposal = {
    title: "Example",
    start: "2026-10-21T16:30:00-04:00",
    end: "2026-10-21T17:30:00-04:00",
    majorIds: ["bme"],
  };
  expect(
    getEvents({
      start: "2026-10-21",
      end: "2026-10-22",
      filters: { categories: ["competition"] },
    }),
  ).toEqual([]);
  const context = getProposalContext(proposal);
  expect(
    analyzeProposal(
      proposal,
      context.events,
      context.exams,
      getOrganizations(),
    ).map((c) => c.kind),
  ).toEqual(["event-overlap", "exam-date-warning"]);
});
it("queries midnight crossings without dropping preceding occurrences", () => {
  const context = getProposalContext({
    title: "Example",
    start: "2026-10-27T00:00:00-04:00",
    end: "2026-10-27T00:30:00-04:00",
    majorIds: ["bme"],
  });
  expect(context.events.map((e) => e.id)).toContain("example-night-build");
});
