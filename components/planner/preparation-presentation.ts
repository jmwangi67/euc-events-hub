import type { AcademicLevel } from "../../lib/domain/models";
import type { PreparationContribution } from "../../lib/domain/exam-pressure";
import { ACADEMIC_LEVELS } from "../../lib/domain/planning-audience";

export type PreparationCell = {
  id: string;
  majorId: string;
  academicLevel: AcademicLevel;
  range: [number, number];
  contributions: PreparationContribution[];
  maximumAt?: { instant: string; side: "at" | "left" };
  lowerMaximumAt?: { instant: string; side: "at" | "left" };
};
export type PreparationAnalysis = {
  range: [number, number];
  cells: PreparationCell[];
  mostAffectedCells: PreparationCell[];
  audienceUncertainExams: readonly import("../../lib/domain/models").Exam[];
};

export function preparationLabel([low, high]: [number, number]) {
  if (Math.abs(high - low) < 1e-7)
    return high === 0
      ? "0 / 10"
      : high < 0.5
        ? "Below 1 / 10"
        : `About ${Math.round(high)} / 10`;
  return `About ${Math.floor(low)}–${Math.ceil(high)} / 10`;
}
export function cellLabel(cell: {
  majorId: string;
  academicLevel: AcademicLevel;
}) {
  return `${cell.majorId.toUpperCase()} · ${ACADEMIC_LEVELS[cell.academicLevel]}`;
}

/** Exact presentation equivalence, never a combination of model outputs. */
export function groupPreparationCells(cells: readonly PreparationCell[]) {
  const groups = new Map<string, PreparationCell[]>();
  for (const cell of cells) {
    const key = JSON.stringify({
      range: cell.range,
      maximumAt: cell.maximumAt,
      lowerMaximumAt: cell.lowerMaximumAt,
      contributions: [...cell.contributions].sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b)),
      ),
    });
    const group = groups.get(key);
    if (group) group.push(cell);
    else groups.set(key, [cell]);
  }
  return [...groups.values()];
}

export function preparationGroupLabel(cells: readonly PreparationCell[]) {
  const majors = new Map<string, string[]>();
  for (const cell of cells) {
    const levels = majors.get(cell.majorId) ?? [];
    if (!levels.includes(ACADEMIC_LEVELS[cell.academicLevel]))
      levels.push(ACADEMIC_LEVELS[cell.academicLevel]);
    majors.set(cell.majorId, levels);
  }
  return [...majors]
    .map(([major, levels]) => `${major.toUpperCase()} · ${levels.join(", ")}`)
    .join("; ");
}

/** Geometry preserves fractional bounds; invalid/missing data remains unavailable. */
export function preparationSegments(range: readonly [number, number] | null) {
  if (
    !range ||
    range.some((n) => !Number.isFinite(n)) ||
    range[0] < 0 ||
    range[1] > 10 ||
    range[1] < range[0]
  )
    return null;
  return {
    solid: range[0] * 10,
    uncertainty: (range[1] - range[0]) * 10,
    unfilled: (10 - range[1]) * 10,
  };
}
