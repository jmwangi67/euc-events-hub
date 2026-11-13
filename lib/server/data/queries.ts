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
import { getEvents, getEventById } from "../../data/fixtures";
import { calendarWeeks } from "../../domain/weekly-planning";
import {
  getExternalEvents,
  getWeeklyPlanningContext,
} from "../../data/weekly-planning";
import { getProposalIntelligenceContext } from "../../data/planner";
import { publicEvents } from "../../../data/public-calendar/events";
import { publicContext } from "../../../data/public-calendar/context";
import {
  publicMajors,
  publicOrganizations,
  publicClusters,
} from "../../../data/public-calendar/reference";
import publicExamJson from "../../../data/public-calendar/fall-2026-exams.json";
import { normalizeExamDataset, queryStagedExams } from "../../exams/staging";
import { toReviewedCanonicalExams } from "../../exams/canonical";

const { dataset } = normalizeExamDataset(publicExamJson);
const references = {
  majors: publicMajors,
  organizations: publicOrganizations,
  clusters: publicClusters,
};
const publicData = {
  events: publicEvents,
  organizations: publicOrganizations,
  externalEvents: publicContext,
  exams: toReviewedCanonicalExams(dataset),
};

export async function loadReferenceData() {
  return referenceDataSchema.parse(references);
}

export async function readCalendar(input: unknown) {
  const {
    window,
    filters: discovery,
    planning,
  } = calendarQuerySchema.parse(input);
  const filters = planning ? undefined : discovery;
  const search = filters?.search?.trim().toLowerCase() ?? "";
  const discoveryFilter = Boolean(
    filters?.organizationIds?.length ||
    filters?.clusterIds?.length ||
    filters?.categories?.length,
  );
  const examContext = !discoveryFilter && !filters?.universityOnly;
  return calendarDataSchema.parse({
    events: getEvents(
      { ...window, filters: planning ? undefined : filters },
      publicData.events,
      publicData.organizations,
    ),
    exams: [],
    publicExams: {
      ...dataset,
      exams: examContext
        ? queryStagedExams(dataset, window.start, window.end).filter(
            (exam) =>
              !search ||
              exam.claims.some((claim) =>
                `academic exam ${claim.courseId} ${claim.designation ?? ""}`
                  .toLowerCase()
                  .includes(search),
              ),
          )
        : [],
    },
    externalEvents: discoveryFilter
      ? []
      : getExternalEvents(window, publicData.externalEvents).filter(
          (event) =>
            (!filters?.universityOnly || event.scope === "psu-wide") &&
            (!search ||
              `${event.title} ${event.geography}`
                .toLowerCase()
                .includes(search)),
        ),
    organizations: references.organizations,
  });
}

export async function readEvent(input: unknown) {
  const { id } = eventQuerySchema.parse(input);
  return eventResponseSchema.parse({
    event: getEventById(id, publicData.events) ?? null,
  });
}

export async function readPlanningContext(input: unknown) {
  const query = planningQuerySchema.parse(input);
  const weeks =
    query.kind === "weekly"
      ? calendarWeeks(query.window.start, query.window.end)
      : [];
  const context =
    query.kind === "weekly"
      ? {
          ...getWeeklyPlanningContext(query.window, publicData),
          publicExams: {
            ...dataset,
            exams: queryStagedExams(dataset, weeks[0].start, weeks.at(-1)!.end),
          },
        }
      : {
          ...getProposalIntelligenceContext(query.range, publicData),
          organizations: publicData.organizations,
        };
  return planningContextSchema.parse(context);
}
