"use client";
import { useState } from "react";
import type { ProposalAnalysis } from "../../lib/domain/proposal-analysis";
import type { PlanningContext } from "../../lib/domain/weekly-planning";
import { formatTimedInstant } from "../../lib/time/eastern";
import {
  PreparationCells,
  PreparationMethodology,
  AudienceUncertainty,
} from "./preparation-details";
import { SchedulingConstraintsSummary } from "./other-scheduling-constraints";
import styles from "./preparation.module.css";

export function ProposalFactors({
  analysis,
  context,
}: {
  analysis: ProposalAnalysis;
  context: PlanningContext;
}) {
  const [enabled, setEnabled] = useState(false);
  return (
    <section
      className="proposal-factors"
      aria-labelledby="proposal-factors-title"
    >
      <h2 id="proposal-factors-title">
        Scheduling information for this proposal
      </h2>
      <p className="field-help">
        Overall score unavailable pending methodology review. Exam Preparation
        and Other Scheduling Constraints are independent; no combined numerical
        result is approved.
      </p>
      <div className={styles.indicators}>
        <SchedulingConstraintsSummary
          analysis={analysis.nonExam}
          showDays={false}
        />
        <section
          className={styles.section}
          aria-label="Proposal Exam Preparation"
        >
          <h3>Exam Preparation</h3>
          <label className="choice">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Inspect experimental proposal preparation
          </label>
          {enabled && (
            <>
              <p className={styles.legend}>
                Experimental relative preparation estimates; solid navy shows
                the lower bound and stripes show uncertainty up to the upper
                bound, not probability. Academic exams are the only inputs.
              </p>
              <p className={styles.note}>
                Peak may be a limit just before an exam starts. It is not
                pressure after an exam, a daily average, or a whole-audience
                score.
              </p>
              <div className="proposal-preparation-grid">
                <section>
                  <h3>At proposed start</h3>
                  <PreparationCells
                    analysis={analysis.preparation.atStart}
                    exams={context.exams}
                  />
                </section>
                <section>
                  <h3>Peak during proposal interval</h3>
                  <PreparationCells
                    analysis={analysis.preparation}
                    exams={context.exams}
                  />
                </section>
              </div>
              <details className={styles.advanced}>
                <summary>Advanced methodology &amp; sources</summary>
                <p>
                  The candidate curve is uncalibrated. Each major ×
                  academic-year cell is analyzed independently; there is no
                  invented enrollment share or whole-audience average. Cells are
                  never added or population averaged.
                </p>
                <section className={styles.advancedDay}>
                  <h4>At proposed start</h4>
                  <p>
                    Reference:{" "}
                    {formatTimedInstant(analysis.preparation.interval.start)}
                  </p>
                  <PreparationMethodology
                    analysis={analysis.preparation.atStart}
                    exams={context.exams}
                  />
                </section>
                <section className={styles.advancedDay}>
                  <h4>Peak during proposal interval</h4>
                  <p>
                    Inclusive start, exclusive end. Exact limits immediately
                    before exam starts and the interval end are considered; a
                    peak limit is not an attained post-start value. Lower and
                    upper maxima can occur at different references.
                  </p>
                  <PreparationMethodology
                    analysis={analysis.preparation}
                    exams={context.exams}
                  />
                </section>
                <ul className="preparation-cutoffs">
                  {context.exams
                    .filter(
                      (exam) =>
                        exam.timeKnown &&
                        Date.parse(exam.start) >=
                          Date.parse(analysis.preparation.interval.start) &&
                        Date.parse(exam.start) <
                          Date.parse(analysis.preparation.interval.end),
                    )
                    .map((exam, index) => (
                      <li key={`${exam.id}-${index}`}>
                        {exam.courseId}: preparation ends at{" "}
                        {formatTimedInstant(exam.start!)}; its recorded academic
                        interval is then an exam-only direct constraint, ending
                        exclusively at {formatTimedInstant(exam.end!)}. It never
                        enters Other Scheduling Constraints.
                      </li>
                    ))}
                </ul>
              </details>
            </>
          )}
          <AudienceUncertainty
            exams={analysis.preparation.audienceUncertainExams}
            sourceExams={context.exams}
          />
        </section>
      </div>
    </section>
  );
}
