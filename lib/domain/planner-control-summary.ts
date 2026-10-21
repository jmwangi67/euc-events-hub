import type { PlanningAudience } from "./planning-audience";
import { ALL_LEVELS } from "./planning-audience";
export function plannerControlCount(
  audience: PlanningAudience,
  visibleLayers: readonly boolean[],
  density: boolean,
) {
  return (
    audience.majorIds.length +
    (audience.academicLevels &&
    audience.academicLevels.length !== ALL_LEVELS.length
      ? audience.academicLevels.length
      : 0) +
    (audience.clusterIds?.length ?? 0) +
    visibleLayers.filter((visible) => !visible).length +
    Number(density)
  );
}
