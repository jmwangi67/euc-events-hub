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
  const selectedLevels = audience.academicLevels ?? ALL_LEVELS;
  const level =
    selectedLevels.length > 0 &&
    (!event.targetAcademicLevels?.length ||
      event.targetAcademicLevels.some((id) => selectedLevels.includes(id)));
  const eligible =
    level &&
    (event.analysis === "broad-context"
      ? event.scope === "psu-wide" || event.scope === "national"
      : event.analysis === "audience-targeted" && (major || cluster));
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
