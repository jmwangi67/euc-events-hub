import type { Proposal } from "../domain/planning";
import { addCalendarDays, easternDate } from "../time/eastern";
import { getEvents, getExams } from "./fixtures";
import { getExternalEvents } from "./weekly-planning";

/** Fetch every recorded constraint in the proposal window, independent of display. */
export function getProposalContext(proposal: Proposal) {
  const window = {
    start: easternDate(proposal.start),
    end: addCalendarDays(
      easternDate(new Date(Date.parse(proposal.end) - 1).toISOString()),
      1,
    ),
  };
  return { events: getEvents(window), exams: getExams(window) };
}

/** Full proposal days plus the following week for preparation; visibility is never an input. */
export function getProposalIntelligenceContext(proposal: Proposal) {
  const window = {
    start: easternDate(proposal.start),
    end: addCalendarDays(
      easternDate(new Date(Date.parse(proposal.end) - 1).toISOString()),
      1,
    ),
  };
  return {
    events: getEvents(window),
    exams: getExams({ ...window, end: addCalendarDays(window.end, 7) }),
    externalEvents: getExternalEvents(window),
  };
}
