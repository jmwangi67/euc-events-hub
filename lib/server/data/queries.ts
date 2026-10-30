import "server-only";
import {
  calendarQuerySchema,
  calendarDataSchema,
  eventQuerySchema,
  eventResponseSchema,
  referenceDataSchema,
  planningQuerySchema,
  planningContextSchema,
} from "../../data/contracts";
import {
  getEvents,
  getEventById,
  getExams,
  getOrganizations,
  getMajors,
} from "../../data/fixtures";
import {
  getExternalEvents,
  getOrganizationClusters,
  getWeeklyPlanningContext,
} from "../../data/weekly-planning";
import { getProposalIntelligenceContext } from "../../data/planner";

/** The only production entrypoint to the synthetic fixture provider. No private loader. */
export async function loadReferenceData() {
  return referenceDataSchema.parse({
    majors: getMajors(),
    organizations: getOrganizations(),
    clusters: getOrganizationClusters(),
  });
}
export async function readCalendar(input: unknown) {
  const { window, filters, planning } = calendarQuerySchema.parse(input);
  return calendarDataSchema.parse({
    events: getEvents({ ...window, filters: planning ? undefined : filters }),
    exams: planning ? getExams(window) : [],
    externalEvents: planning ? getExternalEvents(window) : [],
    organizations: getOrganizations(),
  });
}
export async function readEvent(input: unknown) {
  const { id } = eventQuerySchema.parse(input);
  return eventResponseSchema.parse({ event: getEventById(id) ?? null });
}
export async function readPlanningContext(input: unknown) {
  const query = planningQuerySchema.parse(input);
  const context =
    query.kind === "weekly"
      ? getWeeklyPlanningContext(query.window)
      : {
          ...getProposalIntelligenceContext(query.range),
          organizations: getOrganizations(),
        };
  return planningContextSchema.parse(context);
}
