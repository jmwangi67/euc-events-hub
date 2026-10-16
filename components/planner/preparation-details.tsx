import { formatTimedInstant } from "../../lib/time/eastern";
import type { Exam } from "../../lib/domain/models";
import { ACADEMIC_LEVELS } from "../../lib/domain/planning-audience";
import type { PreparationContribution } from "../../lib/domain/exam-pressure";
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
  academicLevel: keyof typeof ACADEMIC_LEVELS;
}) {
  return `${cell.majorId.toUpperCase()} · ${ACADEMIC_LEVELS[cell.academicLevel]}`;
}
type Cell = {
  id: string;
  majorId: string;
  academicLevel: keyof typeof ACADEMIC_LEVELS;
  range: [number, number];
  contributions: PreparationContribution[];
  maximumAt?: { instant: string; side: "at" | "left" };
};
type Analysis = {
  range: [number, number];
  cells: Cell[];
  mostAffectedCells: Cell[];
  audienceUncertainExams: readonly Exam[];
};
export function PreparationCells({
  analysis,
  exams,
}: {
  analysis: Analysis;
  exams: readonly Exam[];
}) {
  const affected = analysis.cells.filter((cell) => cell.range[1] > 0);
  return (
    <div className="preparation-cells">
      <p>
        <strong>{preparationLabel(analysis.range)}</strong> · largest modeled
        subgroup envelope
      </p>
      <p className="field-help">
        {analysis.mostAffectedCells.length
          ? `Most affected by modeled upper bound: ${analysis.mostAffectedCells.map(cellLabel).join("; ")}.`
          : "No numerical preparation contribution in these audience cells at this reference."}{" "}
        This does not represent everyone; uncertainty bounds may overlap. Cells
        are never added or population averaged.
      </p>
      <details>
        <summary>Inspect {affected.length} affected audience cells</summary>
        {affected.map((cell) => (
          <div className="preparation-cell" key={cell.id}>
            <h4>
              {cellLabel(cell)} · {preparationLabel(cell.range)}
            </h4>
            {cell.maximumAt && (
              <p className="field-help">
                Upper peak{" "}
                {cell.maximumAt.side === "left"
                  ? "as a limit just before"
                  : "at"}{" "}
                {formatTimedInstant(cell.maximumAt.instant)}. Lower and upper
                maxima can occur at different references.
              </p>
            )}
            <ul>
              {cell.contributions
                .filter((c) => c.range[1] > 0)
                .map((contribution) => {
                  const exam = exams.find(
                    (exam) => exam.id === contribution.examId,
                  )!;
                  return (
                    <li key={contribution.examId}>
                      <strong>{exam.courseId}</strong> ·{" "}
                      {preparationLabel(contribution.range)}.{" "}
                      {contribution.explanation}
                      <span className="field-help">
                        Source: {contribution.source.label} ·{" "}
                        {contribution.source.verification}. Curated course
                        mapping; enrollment unknown.
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </details>
    </div>
  );
}
export function AudienceUncertainty({ exams }: { exams: readonly Exam[] }) {
  if (!exams.length) return null;
  return (
    <section
      className="audience-uncertainty"
      aria-label="Audience-uncertain academic constraints"
    >
      <h3>Audience-uncertain academic constraints</h3>
      <p className="field-help">
        Missing audience mappings or conflicting canonical records are retained
        as cautions. They add no numerical preparation to any subgroup.
      </p>
      <ul>
        {exams.map((exam) => (
          <li key={exam.id}>
            <strong>{exam.courseId}</strong> · {exam.date}
            <span className="field-help">
              Affected majors / levels are not established. {exam.source.label}{" "}
              · Verification: {exam.source.verification}
            </span>
            {exam.source.url && (
              <a href={exam.source.url} target="_blank" rel="noreferrer">
                Source (new tab)
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
