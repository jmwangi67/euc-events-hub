import type { AcademicLevel, Event, Exam, Organization } from "./models";
import { isEventRelevant } from "./relevance";
export const ACADEMIC_LEVELS: Record<AcademicLevel, string> = {
  first: "First year",
  second: "Second year",
  third: "Third year",
  fourth: "Fourth year",
  "fifth-plus": "Fifth year or later",
};
export const ALL_LEVELS = Object.keys(ACADEMIC_LEVELS) as AcademicLevel[];
export type PlanningAudience = {
  majorIds: readonly string[];
  academicLevels?: readonly AcademicLevel[];
  clusterIds?: readonly string[];
};
export function eventAudienceMatch(
  event: Event,
  audience: PlanningAudience,
  organizations: readonly Organization[],
) {
  const major = isEventRelevant(
    event,
    { mode: "recommended", majorIds: [...audience.majorIds] },
    organizations,
  );
  // Explicit event targeting only: a host's cluster membership never implies an event audience.
  const cluster = !!event.targetClusterIds?.some((id) =>
    audience.clusterIds?.includes(id),
  );
  const levels = audience.academicLevels ?? ALL_LEVELS;
  const level =
    !event.targetAcademicLevels?.length ||
    event.targetAcademicLevels.some((id) => levels.includes(id));
  return {
    relevant: (major || cluster) && level && levels.length > 0,
    major,
    cluster,
    level,
    levelExplicit: !!event.targetAcademicLevels?.length,
  };
}
export function examAudienceMatch(exam: Exam, audience: PlanningAudience) {
  const major =
    !exam.relevantMajorIds.length ||
    exam.relevantMajorIds.some((id) => audience.majorIds.includes(id));
  const levels = audience.academicLevels ?? ALL_LEVELS;
  const known = !!exam.typicalAcademicLevels?.length;
  const typical = !!exam.typicalAcademicLevels?.some((id) =>
    levels.includes(id),
  );
  return {
    relevant: major && levels.length > 0 && audience.majorIds.length > 0,
    // Model-strength weights, never enrollment shares or attendance probabilities.
    weight: typical ? 1 : known ? 0.65 : 0.8,
    explanation: !exam.relevantMajorIds.length
      ? "Major mapping unknown; conservatively included."
      : !known
        ? "Academic levels unknown; conservatively included."
        : typical
          ? "Typical academic levels intersect; course mapping is approximate, not enrollment."
          : "Outside typical course sequence; retained because students take courses out of sequence.",
  };
}
