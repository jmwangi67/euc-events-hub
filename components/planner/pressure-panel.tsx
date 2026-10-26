"use client";
import { useMemo, useState } from "react";
import type { PlanningContext } from "../../lib/domain/weekly-planning";
import { weekForInstant } from "../../lib/domain/weekly-planning";
import { dailyPreparation } from "../../lib/domain/preparation-sampling";
import type { PlanningAudience } from "../../lib/domain/planning-audience";
import {
  addCalendarDays,
  formatAllDayDate,
  easternDayStart,
  formatTimedInstant,
} from "../../lib/time/eastern";
import {
  PreparationCells,
  PreparationMethodology,
  AudienceUncertainty,
} from "./preparation-details";
import { PreparationRange } from "./preparation-range";
import styles from "./preparation.module.css";

export function PressurePanel({
  start,
  days,
  audience,
  context,
}: {
  start: string;
  days: number;
  audience: PlanningAudience;
  context: PlanningContext;
}) {
  const [enabled, setEnabled] = useState(false);
  const daily = useMemo(
    () =>
      Array.from({ length: days }, (_, i) =>
        dailyPreparation(context.exams, addCalendarDays(start, i), audience),
      ),
    [start, days, audience, context.exams],
  );
  const uncertain = [
    ...new Map(
      daily
        .flatMap((day) => day.maximum.audienceUncertainExams)
        .map((exam) => [exam.id, exam]),
    ).values(),
  ];
  return (
    <section className="pressure-preview" aria-label="Scheduling information">
      <div
        className="overall-pressure-pending"
        data-overall-status="awaiting-methodology-review"
      >
        <h3>Overall scheduling pressure</h3>
        <p>
          <strong>Unavailable · Awaiting methodology review</strong>
        </p>
        <p className="field-help">
          No numerical overall score or rating is approved. Exam Preparation and
          Other Scheduling Constraints are independent indicators. They are
          never combined, summed or averaged into a shared result.
        </p>
      </div>
      <div className={styles.indicators}>
        <section className={styles.section} aria-label="Exam Preparation">
          <h3>Exam Preparation</h3>
          <label className="choice">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Preview experimental exam preparation
          </label>
          <p className={styles.note}>
            Academic exams only. Uncalibrated relative model units, never
            percentages of students unavailable. Each selected major ×
            academic-year subgroup is calculated independently.
          </p>
          {enabled && (
            <>
              <p className={styles.legend}>
                Experimental relative preparation estimates: solid navy shows
                the lower bound; diagonal stripes extend to the upper bound.
                Stripes mean uncertainty, not probability.
              </p>
              <p className={styles.note}>
                Peak may be a limit just before an exam starts. It is not
                pressure after an exam, a daily average, or a whole-audience
                score.
              </p>
              <div
                className={`pressure-days ${styles.days} ${days === 1 ? "single-pressure-day" : ""}`}
              >
                {daily.map((prep) => {
                  const nextWeek = context.exams.filter(
                    (exam) =>
                      prep.upcomingExamIds.includes(exam.id) &&
                      exam.date >=
                        weekForInstant(easternDayStart(prep.date)).end,
                  );
                  const upcoming = [
                    ...new Map(
                      context.exams
                        .filter((exam) =>
                          prep.upcomingExamIds.includes(exam.id),
                        )
                        .map((exam) => [exam.id, exam]),
                    ).values(),
                  ];
                  return (
                    <div
                      className={`pressure-day ${styles.day}`}
                      key={prep.date}
                    >
                      <h4>{formatAllDayDate(prep.date)}</h4>
                      <div className="experimental-day-preparation">
                        <PreparationCells
                          analysis={prep.maximum}
                          exams={context.exams}
                          label="Experimental day peak"
                        />
                        {upcoming.length > 0 && (
                          <p className="field-help">
                            Upcoming:{" "}
                            {upcoming
                              .map(
                                (exam) =>
                                  `${exam.courseId} (${formatAllDayDate(exam.date)})`,
                              )
                              .join("; ")}
                            .
                          </p>
                        )}
                        {nextWeek.length > 0 && (
                          <p className="cross-week-note">
                            Preparation for next week:{" "}
                            {nextWeek.map((exam) => exam.courseId).join("; ")}.
                            Those exams are not counted as occurring this week.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <details className={styles.advanced}>
                <summary>Advanced methodology &amp; sources</summary>
                <p>
                  These are experimental relative preparation estimates on a
                  0–10 scale. Each cell retains its source mappings, typical or
                  atypical academic-year relationship and uncertainty. No
                  enrollment or attendance probability is established.
                </p>
                {daily.map((prep) => (
                  <section className={styles.advancedDay} key={prep.date}>
                    <h4>{formatAllDayDate(prep.date)}</h4>
                    <p>
                      Daily maximum over the Eastern date: inclusive start,
                      exclusive end. Exact transition limits are retained.
                    </p>
                    <PreparationMethodology
                      analysis={prep.maximum}
                      exams={context.exams}
                    />
                    <details>
                      <summary>Inspect 10 PM contributions</summary>
                      <p>
                        10 PM Eastern reference ·{" "}
                        {formatTimedInstant(prep.eveningInstant)}
                      </p>
                      <PreparationRange
                        range={prep.evening.range}
                        label="10 PM experimental relative preparation estimate"
                      />
                      <PreparationMethodology
                        analysis={prep.evening}
                        exams={context.exams}
                      />
                    </details>
                  </section>
                ))}
              </details>
            </>
          )}
          <AudienceUncertainty exams={uncertain} sourceExams={context.exams} />
        </section>
      </div>
    </section>
  );
}
