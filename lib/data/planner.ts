import type { Proposal } from "../domain/planning";
import { addCalendarDays, easternDate } from "../time/eastern";
import { getEvents, getExams } from "./fixtures";
import { getNonExamAnalysisRecords } from "./weekly-planning";

/** Fetch proposal-window identities and all their source alternatives, independent of display. */
export function getProposalContext(
  proposal: Pick<Proposal, "start" | "end"> & Partial<Proposal>,
) {
  const window = {
    start: easternDate(proposal.start),
    end: addCalendarDays(
      easternDate(new Date(Date.parse(proposal.end) - 1).toISOString()),
      1,
    ),
  };
  return {
    events: getEvents({ ...window, includeIdentityAlternatives: true }),
    exams: getExams({ ...window, includeIdentityAlternatives: true }),
  };
}

/** Full proposal days plus the following week for preparation; visibility is never an input. */
export function getProposalIntelligenceContext(
  proposal: Pick<Proposal, "start" | "end"> & Partial<Proposal>,
) {
  const window = {
    start: easternDate(proposal.start),
    end: addCalendarDays(
      easternDate(new Date(Date.parse(proposal.end) - 1).toISOString()),
      1,
    ),
  };
  return {
    ...getNonExamAnalysisRecords(window),
    exams: getExams({
      ...window,
      end: addCalendarDays(window.end, 7),
      includeIdentityAlternatives: true,
    }),
  };
}
