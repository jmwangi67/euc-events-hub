import type { Proposal } from "./planning";
import { analyzeProposal, intervalsOverlap } from "./planning";
import type { PlanningContext } from "./weekly-planning";
import { eventInterval } from "./weekly-planning";
import { proposalPreparation } from "./preparation-sampling";
import {
  eventAudienceCells,
  examAudienceMatch,
  audienceCells,
} from "./planning-audience";
import {
  externalAudienceCells,
  externalEligibility,
} from "./scheduling-eligibility";
export function analyzePlanningProposal(
  proposal: Proposal,
  context: PlanningContext,
) {
  const conflicts = analyzeProposal(
    proposal,
    context.events,
    context.exams,
    context.organizations,
  );
  const preparation = proposalPreparation(context.exams, proposal, proposal);
  const externalConstraints = context.externalEvents
    .filter(
      (event) =>
        externalEligibility(event, proposal).eligible &&
        intervalsOverlap(proposal, eventInterval(event)),
    )
    .map((event) => ({
      event,
      kind: event.timeKnown
        ? ("known-time-overlap" as const)
        : ("date-level-caution" as const),
      affectedCells: externalAudienceCells(event, proposal),
    }));
  const cells = audienceCells(proposal).map((cell) => ({
    ...cell,
    eventIds: conflicts
      .filter(
        (conflict) =>
          conflict.kind === "event-overlap" &&
          eventAudienceCells(
            conflict.record as import("./models").Event,
            proposal,
            context.organizations,
          ).some((c) => c.id === cell.id),
      )
      .map((c) => c.record.id),
    examIds: conflicts
      .filter(
        (conflict) =>
          conflict.kind !== "event-overlap" &&
          conflict.kind !== "exam-audience-warning" &&
          examAudienceMatch(
            conflict.record as import("./models").Exam,
            cell.audience,
          ).numericalEligible,
      )
      .map((c) => c.record.id),
    externalIds: externalConstraints
      .filter((item) => item.affectedCells.some((c) => c.id === cell.id))
      .map((item) => item.event.id),
  }));
  return {
    conflicts,
    preparation,
    externalConstraints,
    cells,
    contextOnlyExternalEvents: context.externalEvents.filter(
      (event) => !externalEligibility(event, proposal).eligible,
    ),
    overall: { status: "awaiting-methodology-review" as const, score: null },
  };
}
export type ProposalAnalysis = ReturnType<typeof analyzePlanningProposal>;
