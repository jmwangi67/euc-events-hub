import type { ExternalEvent } from "./external-events";
import {
  ALL_LEVELS,
  audienceCells,
  type PlanningAudience,
} from "./planning-audience";
export function externalEligibility(
  event: ExternalEvent,
  audience: PlanningAudience,
) {
  const major = !!event.targetMajorIds?.some((id) =>
    audience.majorIds.includes(id),
  );
  const cluster = !!event.targetClusterIds?.some((id) =>
    audience.clusterIds?.includes(id),
  );
  const level =
    !event.targetAcademicLevels?.length ||
    event.targetAcademicLevels.some((id) =>
      (audience.academicLevels ?? ALL_LEVELS).includes(id),
    );
  const eligible =
    event.analysis === "broad-context"
      ? event.scope === "psu-wide" || event.scope === "national"
      : event.analysis === "audience-targeted" && (major || cluster) && level;
  return {
    eligible,
    reason: event.analysisReason,
    broadContext: eligible && event.analysis === "broad-context",
  };
}
export function externalAudienceCells(
  event: ExternalEvent,
  audience: PlanningAudience,
) {
  return audienceCells(audience).filter(
    (cell) => externalEligibility(event, cell.audience).eligible,
  );
}
