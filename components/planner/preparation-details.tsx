import { formatEventTime, formatTimedInstant } from "../../lib/time/eastern";
import type { Exam } from "../../lib/domain/models";
import { examOccurrences } from "../../lib/domain/exam-occurrences";
import { sourceLabel, verificationLabel } from "../../lib/domain/source-labels";
import {
  cellLabel,
  groupPreparationCells,
  preparationGroupLabel,
  preparationLabel,
  type PreparationAnalysis,
  type PreparationCell,
} from "./preparation-presentation";
import { PreparationRange } from "./preparation-range";
import styles from "./preparation.module.css";
export { cellLabel, preparationLabel } from "./preparation-presentation";

/** Summarize equivalent cells without changing or combining their calculations. */
export function PreparationCells({
  analysis,
  exams,
  label,
}: {
  analysis: PreparationAnalysis;
  exams: readonly Exam[];
  label?: string;
}) {
  const mainExams = [
    ...new Set(
      analysis.mostAffectedCells.flatMap((cell) =>
        [...cell.contributions]
          .filter((contribution) => contribution.range[1] > 0)
          .sort((a, b) => b.range[1] - a.range[1])
          .map((contribution) => contribution.examId),
      ),
    ),
  ];
  const uncertainty = analysis.range[1] > analysis.range[0] + 1e-7;
  const groups = groupPreparationCells(analysis.mostAffectedCells);
  return (
    <div className="preparation-cells">
      <PreparationRange range={analysis.range} label={label} />
      <div className={styles.summary}>
        <p>
          <strong>
            Most affected selected subgroups (modeled upper bound):
          </strong>{" "}
          {groups.length
            ? groups.map(preparationGroupLabel).join("; ")
            : "No numerical preparation contribution at this reference."}
        </p>
        {mainExams.length > 0 && (
          <p>
            <strong>Main contributing exams:</strong>{" "}
            {mainExams
              .map((id) => exams.find((exam) => exam.id === id)?.courseId)
              .filter(Boolean)
              .join("; ")}
            .
          </p>
        )}
        <p className="field-help">
          {uncertainty
            ? "The range preserves uncertain exam hours and model bounds. Stripes show uncertainty, not probability."
            : "No time-range uncertainty in this estimate; course mappings and enrollment remain unverified."}
        </p>
      </div>
    </div>
  );
}

function CellReferences({ cell }: { cell: PreparationCell }) {
  const reference = (boundary: { instant: string; side: "at" | "left" }) =>
    `${boundary.side === "left" ? "as a limit just before" : "at"} ${formatTimedInstant(boundary.instant)}`;
  if (!cell.maximumAt && !cell.lowerMaximumAt) return null;
  return (
    <p className={styles.references}>
      {cell.maximumAt && <>Upper maximum {reference(cell.maximumAt)}. </>}
      {cell.lowerMaximumAt && (
        <>Lower maximum {reference(cell.lowerMaximumAt)}. </>
      )}
      Lower and upper maxima can occur at different references.
    </p>
  );
}

/** Complete cell/source inspection lives inside the caller's advanced disclosure. */
export function PreparationMethodology({
  analysis,
  exams,
}: {
  analysis: PreparationAnalysis;
  exams: readonly Exam[];
}) {
  const groups = groupPreparationCells(analysis.cells);
  return (
    <details className={styles.groupDisclosure}>
      <summary>
        Inspect all distinct subgroup estimates ({groups.length}{" "}
        {groups.length === 1 ? "group" : "groups"})
      </summary>
      <p className="field-help">
        Cells are never added or population averaged. Identical results share a
        presentation group only; each major × academic-year calculation remains
        independent. The largest subgroup envelope does not represent everyone.
      </p>
      {groups.map((cells) => {
        const cell = cells[0];
        return (
          <div
            className={`preparation-cell ${styles.group}`}
            key={cells.map((cell) => cell.id).join("|")}
            data-audience-cell-ids={cells.map((cell) => cell.id).join(" ")}
          >
            <h4>
              {preparationGroupLabel(cells)} · {preparationLabel(cell.range)}
            </h4>
            <p className={styles.references}>
              Calculated independently: {cells.map(cellLabel).join("; ")}.
            </p>
            <CellReferences cell={cell} />
            {cell.contributions.length ? (
              <ul>
                {cell.contributions.map((contribution) => {
                  const exam = exams.find(
                    (record) => record.id === contribution.examId,
                  );
                  return (
                    <li key={contribution.examId}>
                      <strong>
                        {exam?.courseId ?? "Recorded academic exam"}
                      </strong>{" "}
                      · {preparationLabel(contribution.range)}. State:{" "}
                      {contribution.state.replaceAll("-", " ")}.{" "}
                      {contribution.explanation}
                      <span className={styles.source}>
                        Source: {sourceLabel(contribution.source)} ·{" "}
                        {verificationLabel(contribution.source.verification)}.
                        Curated course-to-major and typical academic-year
                        mapping; enrollment is unknown. Atypical years remain
                        included with the documented candidate relevance.
                      </span>
                      {contribution.source.url && (
                        <a
                          href={contribution.source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Source (new tab)
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No numerical preparation contribution in this subgroup.</p>
            )}
          </div>
        );
      })}
    </details>
  );
}

export function AudienceUncertainty({
  exams,
  sourceExams = exams,
}: {
  exams: readonly Exam[];
  sourceExams?: readonly Exam[];
}) {
  if (!exams.length) return null;
  const conflicts = examOccurrences(sourceExams).identityConflicts;
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
        {exams.map((exam) => {
          const conflict = conflicts.find((group) => group.id === exam.id);
          const claims = conflict?.alternatives ?? [exam];
          return (
            <li key={exam.id}>
              <strong>{exam.courseId}</strong> ·{" "}
              {conflict
                ? "Conflicting source claims; timing is unresolved."
                : "Affected majors / academic years are not established."}
              <ul>
                {claims.map((claim, index) => (
                  <li key={index}>
                    {claim.date} ·{" "}
                    {claim.timeKnown
                      ? formatEventTime({
                          allDay: false,
                          start: claim.start,
                          end: claim.end,
                        })
                      : "Time unknown"}
                    <span className={styles.source}>
                      {sourceLabel(claim.source)} ·{" "}
                      {verificationLabel(claim.source.verification)}
                    </span>
                    {claim.source.url && (
                      <a
                        href={claim.source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source (new tab)
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
