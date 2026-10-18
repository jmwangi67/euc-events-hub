"use client";
import { useMemo } from "react";
import {
  analyzeNonExamScheduling,
  type NonExamConstraint,
  type NonExamSchedulingAnalysis,
} from "../../lib/domain/non-exam-scheduling";
import type { PlanningAudience } from "../../lib/domain/planning-audience";
import { ACADEMIC_LEVELS } from "../../lib/domain/planning-audience";
import type { PlanningContext } from "../../lib/domain/weekly-planning";
import {
  addCalendarDays,
  easternDayStart,
  formatAllDayDate,
  formatEventTime,
} from "../../lib/time/eastern";
import { sourceLabel, verificationLabel } from "../../lib/domain/source-labels";
import styles from "./other-scheduling-constraints.module.css";

const guidanceOrder = {
  "avoid-scheduling": 0,
  "scheduling-caution": 1,
  "review-conflicts": 2,
};
const typeLabel = {
  engineering: "Engineering event",
  "psu-wide": "PSU-wide",
  national: "National",
  local: "Local",
};
function ConstraintList({ constraints }: { constraints: NonExamConstraint[] }) {
  return (
    <ul className={styles.records}>
      {constraints.map((constraint) => (
        <li key={constraint.id}>
          <strong>{constraint.title}</strong>
          <p className="field-help">
            {constraint.eventTypes.map((kind) => typeLabel[kind]).join(" / ")} ·{" "}
            {constraint.contextOnly
              ? "Context only — excluded from analysis"
              : "Audience-relevant commitment"}{" "}
            ·{" "}
            {constraint.timing === "known"
              ? "Known-time commitment"
              : constraint.timing === "all-day"
                ? "Recorded all-day commitment"
                : constraint.timing === "source-conflict"
                  ? "Conflicting source timing"
                  : "Date-level timing uncertainty"}
          </p>
          {constraint.windows.map((window, index) => (
            <p key={index}>
              {window.kind === "policy"
                ? "Provisional policy window: "
                : "Recorded interval: "}
              {window.start && window.end
                ? formatEventTime({
                    allDay: false,
                    start: window.start,
                    end: window.end,
                  })
                : `${formatAllDayDate(window.startDate)} – ${formatAllDayDate(addCalendarDays(window.endDate, -1))} · Exact hours not established`}
              <span className="field-help">{window.reason}</span>
              {window.source && (
                <span className="field-help">
                  Source for this window: {sourceLabel(window.source)} ·{" "}
                  {verificationLabel(window.source.verification)}
                </span>
              )}
            </p>
          ))}
          <p className="field-help">{constraint.reason}</p>
          <details>
            <summary>Audience applicability & sources</summary>
            <p className="field-help">
              {constraint.affectedCellIds
                .map((id) => {
                  const [major, level] = id.split(":");
                  return `${major.toUpperCase()} · ${ACADEMIC_LEVELS[level as keyof typeof ACADEMIC_LEVELS]}`;
                })
                .join("; ") ||
                "No selected audience is established for analysis."}
            </p>
            {constraint.sources.map((source, index) => (
              <p className="field-help" key={index}>
                Source:{" "}
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {sourceLabel(source)} (opens a new tab)
                  </a>
                ) : (
                  sourceLabel(source)
                )}{" "}
                · {verificationLabel(source.verification)}
              </p>
            ))}
          </details>
        </li>
      ))}
    </ul>
  );
}
export function SchedulingConstraintsSummary({
  analysis,
  showDays = true,
}: {
  analysis: NonExamSchedulingAnalysis;
  showDays?: boolean;
}) {
  const eligible = analysis.constraints.filter(
    (constraint) => constraint.eligible,
  );
  const contextOnly = analysis.constraints.filter(
    (constraint) => constraint.contextOnly,
  );
  const cautions = [
    ...new Map(
      analysis.days
        .flatMap((day) => day.cautions)
        .map((caution) => [caution.id, caution]),
    ).values(),
  ].sort(
    (a, b) =>
      guidanceOrder[a.guidance] - guidanceOrder[b.guidance] ||
      a.id.localeCompare(b.id),
  );
  const primary = cautions[0];
  return (
    <section
      className={styles.panel}
      aria-label="Other Scheduling Constraints"
      data-non-exam-score="unavailable"
    >
      <h3>Other Scheduling Constraints</h3>
      <div
        className={styles.unavailable}
        role="img"
        aria-label="Numerical Other Scheduling Constraints score unavailable — awaiting methodology review"
      >
        Numerical score unavailable · Awaiting methodology review
      </div>
      <p className="field-help">
        Non-exam events and provisional policies only. Academic exams and
        preparation do not enter this indicator. Factual overlaps are not
        attendance probabilities or a pressure score.
      </p>
      <p>
        <strong>
          {eligible.length} audience-relevant non-exam commitments
        </strong>{" "}
        · {contextOnly.length} context-only records
      </p>
      {!showDays && primary && (
        <div className={styles.guidance} data-guidance={primary.guidance}>
          <span aria-hidden="true">!</span>
          <div>
            <strong>{primary.label}</strong>
            <p>{primary.title}</p>
            <p className="field-help">{primary.reason}</p>
          </div>
        </div>
      )}
      {!showDays && !primary && eligible.length > 0 && (
        <div className={styles.guidance} data-guidance="review-conflicts">
          <span aria-hidden="true">!</span>
          <div>
            <strong>Review conflicts</strong>
            <p>
              Audience-relevant non-exam commitments intersect this proposal.
              Review the recorded intervals and audience applicability below.
            </p>
          </div>
        </div>
      )}
      {showDays && (
        <div className={styles.days}>
          {analysis.days.map((day) => (
            <div
              key={day.date}
              className={styles.day}
              data-non-exam-date={day.date}
            >
              <h4>{formatAllDayDate(day.date)}</h4>
              <p>
                <strong>
                  {day.maximumConcurrent} maximum simultaneous timed non-exam{" "}
                  {day.maximumConcurrent === 1 ? "commitment" : "commitments"}
                </strong>
              </p>
              <p className="field-help">
                Largest selected major × academic-year subgroup; groups are
                never added. All-day and uncertain-hour commitments are listed
                separately and do not create hourly density.
              </p>
              <p className="field-help">
                {day.eligibleCommitments} eligible · {day.allDayCommitments}{" "}
                all-day · {day.timingUncertainties} timing uncertainties ·{" "}
                {day.contextOnlyCommitments} context only
              </p>
              {day.primaryCaution && (
                <div
                  className={styles.guidance}
                  data-guidance={day.primaryCaution.guidance}
                >
                  <span aria-hidden="true">!</span>
                  <div>
                    <strong>{day.primaryCaution.label}</strong>
                    <p>{day.primaryCaution.title}</p>
                    {day.primaryCaution.contextOnly && (
                      <p className="field-help">
                        Context only; not part of analytical density.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {day.cautions.length > 0 && (
                <details>
                  <summary>
                    {day.cautions.length === 1
                      ? "Reason & source"
                      : `All scheduling reasons (${day.cautions.length})`}
                  </summary>
                  <ul className={styles.reasons}>
                    {day.cautions.map((caution) => (
                      <li key={caution.id}>
                        <strong>{caution.label}</strong> · {caution.title}
                        <p className="field-help">
                          {caution.reason}
                          {caution.contextOnly
                            ? " Context only; excluded from analytical density."
                            : ""}
                        </p>
                        <p className="field-help">
                          {caution.sources
                            .map(
                              (source) =>
                                `${sourceLabel(source)} · ${verificationLabel(source.verification)}`,
                            )
                            .join("; ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <details>
                <summary>
                  Events & scheduling constraints ({day.constraints.length})
                </summary>
                {day.constraints.length ? (
                  <ConstraintList constraints={day.constraints} />
                ) : (
                  <p className="field-help">
                    No recorded non-exam constraints for this date; coverage may
                    be incomplete.
                  </p>
                )}
              </details>
            </div>
          ))}
        </div>
      )}
      {!showDays && (
        <>
          <details>
            <summary>
              Events & scheduling constraints ({analysis.constraints.length})
            </summary>
            <ConstraintList constraints={analysis.constraints} />
          </details>
          {cautions.length > 1 && (
            <details>
              <summary>All scheduling reasons ({cautions.length})</summary>
              <ul className={styles.reasons}>
                {cautions.map((caution) => (
                  <li key={caution.id}>
                    <strong>{caution.label}</strong> · {caution.title}
                    <p className="field-help">{caution.reason}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
      {contextOnly.length > 0 && (
        <p className="field-help">
          Context only, excluded from analytical factors:{" "}
          {contextOnly.map((constraint) => constraint.title).join("; ")}. Local
          presence alone does not establish selected-audience applicability.
        </p>
      )}
    </section>
  );
}
export function OtherSchedulingConstraints({
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
  const analysis = useMemo(
    () =>
      analyzeNonExamScheduling(context, audience, {
        start: easternDayStart(start),
        end: easternDayStart(addCalendarDays(start, days)),
      }),
    [start, days, audience, context],
  );
  return <SchedulingConstraintsSummary analysis={analysis} />;
}
