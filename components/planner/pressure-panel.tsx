"use client";
import { useMemo, useState } from "react";
import type { PlanningContext } from "../../lib/domain/weekly-planning";
import {
  dayPressureBreakdown,
  weekForInstant,
} from "../../lib/domain/weekly-planning";
import type { PlanningAudience } from "../../lib/domain/planning-audience";
import {
  addCalendarDays,
  formatAllDayDate,
  easternDayStart,
} from "../../lib/time/eastern";
import {
  PreparationCells,
  preparationLabel,
  AudienceUncertainty,
} from "./preparation-details";
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
        dayPressureBreakdown(addCalendarDays(start, i), audience, context),
      ),
    [start, days, audience, context],
  );
  const uncertain = [
    ...new Map(
      daily
        .flatMap((day) => day.preparation.maximum.audienceUncertainExams)
        .map((exam) => [exam.id, exam]),
    ).values(),
  ];
  return (
    <section
      className="pressure-preview"
      aria-label="Scheduling-pressure factors"
    >
      <div
        className="overall-pressure-pending"
        data-overall-status="awaiting-methodology-review"
      >
        <h3>Overall scheduling pressure</h3>
        <p>
          <strong>Unavailable · Awaiting methodology review</strong>
        </p>
        <p className="field-help">
          No numerical overall score or rating is approved. Factual commitments
          and experimental exam preparation remain separate; preparation is
          already a proposed contributor, not an extra value to add to a total.
        </p>
      </div>
      <label className="choice">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Preview experimental exam preparation
      </label>
      <p className="field-help">
        Uncalibrated relative model units, never percentages of students
        unavailable. Broad commitments do not affect everyone equally.
      </p>
      <div
        className={`pressure-days ${days === 1 ? "single-pressure-day" : ""}`}
      >
        {daily.map((day) => {
          const prep = day.preparation;
          const nextWeek = context.exams.filter(
            (exam) =>
              prep.upcomingExamIds.includes(exam.id) &&
              exam.date >= weekForInstant(easternDayStart(day.date)).end,
          );
          return (
            <div className="pressure-day" key={day.date}>
              <h4>{formatAllDayDate(day.date)}</h4>
              <p>
                {day.knownTimedConstraints.length} eligible known-time
                commitments
                <br />
                {day.dateOnlyConstraints} date-level cautions
              </p>
              {day.allDayConstraints.length > 0 && (
                <p>
                  {day.allDayConstraints.length} recorded all-day engineering
                  intervals
                </p>
              )}
              <p>
                PSU-wide {day.counts.psuWide} · National {day.counts.national}
              </p>
              {day.contextOnlyExternalEvents.length > 0 && (
                <p>
                  {day.contextOnlyExternalEvents.length} local context-only
                  records · excluded from analysis
                </p>
              )}
              {enabled && (
                <div className="experimental-day-preparation">
                  <p className="preparation-value">
                    <strong>Experimental day peak</strong>
                    <br />
                    {preparationLabel(prep.maximum.range)}
                  </p>
                  <div className="preparation-track" aria-hidden="true">
                    <span style={{ width: `${prep.maximum.range[1] * 10}%` }} />
                  </div>
                  <p>
                    10 PM Eastern reference
                    <br />
                    {preparationLabel(prep.evening.range)}
                  </p>
                  <div className="preparation-track" aria-hidden="true">
                    <span style={{ width: `${prep.evening.range[1] * 10}%` }} />
                  </div>
                  <p className="field-help">
                    Peak may be a limit just before an exam starts. It is not
                    pressure after an exam, a daily average, or a whole-audience
                    score.
                  </p>
                  {nextWeek.length > 0 && (
                    <p className="cross-week-note">
                      Preparation for next week:{" "}
                      {nextWeek
                        .map(
                          (exam) =>
                            `${exam.courseId} (${formatAllDayDate(exam.date)})`,
                        )
                        .join(", ")}
                      . Those exams are not counted as occurring this week.
                    </p>
                  )}
                  <PreparationCells
                    analysis={prep.maximum}
                    exams={context.exams}
                  />
                  <details>
                    <summary>Inspect 10 PM contributions</summary>
                    <PreparationCells
                      analysis={prep.evening}
                      exams={context.exams}
                    />
                  </details>
                </div>
              )}
              <details>
                <summary>Recorded factors</summary>
                <ul>
                  {[...day.knownTimedConstraints, ...day.allDayConstraints].map(
                    (item) => (
                      <li key={item.id}>{item.id}</li>
                    ),
                  )}
                </ul>
              </details>
            </div>
          );
        })}
      </div>
      <AudienceUncertainty exams={uncertain} />
    </section>
  );
}
