import { examOccurrences } from "./exam-occurrences";
import { z } from "zod";
import {
  academicLevelSchema,
  eventCategorySchema,
  instantSchema,
  type Event,
  type Exam,
  type Organization,
} from "./models";
import {
  ALL_LEVELS,
  eventAudienceMatch,
  examAudienceMatch,
} from "./planning-audience";
import { addCalendarDays, easternDayStart } from "../time/eastern";

export const proposalSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a proposed event title.").max(160),
    start: instantSchema,
    end: instantSchema,
    category: eventCategorySchema.optional(),
    academicLevels: z.array(academicLevelSchema).min(1).optional(),
    clusterIds: z.array(z.string().min(1)).optional(),
    majorIds: z
      .array(z.string().min(1))
      .min(1, "Select at least one planning major."),
  })
  .refine((p) => Date.parse(p.end) > Date.parse(p.start), {
    path: ["end"],
    message:
      "End must be after start. For overnight events, choose the following end date.",
  });
export type Proposal = z.infer<typeof proposalSchema>;
export type PlanningConflict = {
  id: string;
  kind:
    | "event-overlap"
    | "exam-overlap"
    | "exam-date-warning"
    | "exam-audience-warning";
  record: Event | Exam;
  /** Complete source alternatives for an unresolved canonical identity; never confirmed overlaps. */
  examAlternatives?: readonly Exam[];
  majorIds: string[];
  reason: string;
};
export function planningAudience(
  organization: Organization,
  override?: readonly string[],
): string[] {
  return [...new Set(override ?? organization.defaultMajorIds)];
}
export function intervalsOverlap(
  a: { start: string; end: string },
  b: { start: string; end: string },
): boolean {
  return (
    Date.parse(a.start) < Date.parse(b.end) &&
    Date.parse(b.start) < Date.parse(a.end)
  );
}
export function isExamRelevant(
  exam: Exam,
  majorIds: readonly string[],
): boolean {
  return examAudienceMatch(exam, { majorIds }).relevant;
}

/** Analysis takes the complete planning context, never calendar display filters. */
export function analyzeProposal(
  input: Proposal,
  events: readonly Event[],
  exams: readonly Exam[],
  organizations: readonly Organization[],
): PlanningConflict[] {
  const proposal = proposalSchema.parse(input);
  const conflicts: PlanningConflict[] = [];
  for (const event of new Map(
    events.map((event) => [event.id, event]),
  ).values()) {
    if (
      event.status !== "published" ||
      !eventAudienceMatch(event, proposal, organizations).relevant
    )
      continue;
    const interval = event.allDay
      ? { start: easternDayStart(event.start), end: easternDayStart(event.end) }
      : event;
    if (!intervalsOverlap(proposal, interval)) continue;
    const audience =
      event.targeting === "explicit"
        ? event.targetMajorIds
        : organizations
            .filter((org) => event.hostOrganizationIds.includes(org.id))
            .flatMap((org) => org.defaultMajorIds);
    conflicts.push({
      id: `event:${event.id}`,
      kind: "event-overlap",
      record: event,
      majorIds: event.collegeWide
        ? [...proposal.majorIds]
        : proposal.majorIds.filter((id) => audience.includes(id)),
      reason: eventAudienceMatch(event, proposal, organizations).cluster
        ? "The event explicitly targets a selected organization cluster; host membership alone is not used."
        : event.collegeWide
          ? "College-wide programming applies to the entire planning audience."
          : event.targeting === "explicit"
            ? "The event explicitly targets part of your planning audience."
            : "Audience relevance is inferred from the hosts’ documented majors.",
    });
  }
  const canonical = examOccurrences(exams);
  const intersectsAudience = (exam: Exam) => {
    if (
      !examAudienceMatch(exam, {
        ...proposal,
        academicLevels: proposal.academicLevels ?? ALL_LEVELS,
      }).relevant
    )
      return false;
    const interval = exam.timeKnown
      ? exam
      : {
          start: easternDayStart(exam.date),
          end: easternDayStart(addCalendarDays(exam.date, 1)),
        };
    return intervalsOverlap(proposal, interval);
  };
  for (const exam of canonical.exams) {
    if (!intersectsAudience(exam)) continue;
    conflicts.push({
      id: `exam:${exam.id}`,
      kind: examAudienceMatch(exam, proposal).audienceUncertain
        ? "exam-audience-warning"
        : exam.timeKnown
          ? "exam-overlap"
          : "exam-date-warning",
      record: exam,
      majorIds: proposal.majorIds.filter((id) =>
        exam.relevantMajorIds.includes(id),
      ),
      reason: examAudienceMatch(exam, proposal).explanation,
    });
  }
  for (const group of canonical.identityConflicts) {
    // Relevance and overlap must hold for the same source record, not a merged Cartesian audience.
    const intersecting = group.alternatives.filter(intersectsAudience);
    if (!intersecting.length) continue;
    conflicts.push({
      id: `exam:${group.id}`,
      kind: "exam-audience-warning",
      record: intersecting[0],
      examAlternatives: group.alternatives,
      majorIds: proposal.majorIds.filter((id) =>
        intersecting.some((exam) => exam.relevantMajorIds.includes(id)),
      ),
      reason:
        "Canonical exam records disagree about timing; a relevant source alternative may intersect this proposal. Retained as uncertainty, not a confirmed overlap. Numerical preparation is excluded until the records are reconciled.",
    });
  }
  return conflicts;
}
