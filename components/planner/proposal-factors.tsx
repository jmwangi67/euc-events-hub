"use client";
import { useState } from "react";
import type { ProposalAnalysis } from "../../lib/domain/proposal-analysis";
import type { PlanningContext } from "../../lib/domain/weekly-planning";
import { formatEventTime, formatTimedInstant } from "../../lib/time/eastern";
import {
  PreparationCells,
  AudienceUncertainty,
  cellLabel,
} from "./preparation-details";
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
      <h2 id="proposal-factors-title">Why this proposal may be busy</h2>
      <p className="field-help">
        Overall score unavailable pending methodology review. Confirmed
        intervals, date-level cautions and experimental preparation have
        different meanings.
      </p>
      {analysis.externalConstraints.length > 0 && (
        <ul className="weekly-detail-records">
          {analysis.externalConstraints.map(
            ({ event, kind, affectedCells }) => (
              <li key={event.id}>
                <strong>{event.title}</strong>
                <span>
                  {kind === "known-time-overlap"
                    ? "Known-time overlap"
                    : "Date-level caution · Time unknown"}{" "}
                  ·{" "}
                  {event.scope === "psu-wide"
                    ? "PSU-wide"
                    : event.scope === "national"
                      ? "National"
                      : "Explicitly audience-targeted local event"}
                </span>
                <span>
                  {event.timeKnown
                    ? formatEventTime({
                        allDay: false,
                        start: event.start,
                        end: event.end,
                      })
                    : `${event.startDate} – ${event.endDate} (exclusive end)`}
                </span>
                <span>
                  {event.analysisReason} Affected context:{" "}
                  {affectedCells.map(cellLabel).join("; ")}. Participation is
                  unknown.
                </span>
                <span>
                  Source: {event.source.label} · {event.source.verification}
                </span>
                {event.source.url && (
                  <a href={event.source.url} target="_blank" rel="noreferrer">
                    Source (new tab)
                  </a>
                )}
              </li>
            ),
          )}
        </ul>
      )}
      {analysis.contextOnlyExternalEvents.length > 0 && (
        <p className="field-help">
          Context only, excluded from analytical factors:{" "}
          {analysis.contextOnlyExternalEvents
            .map((event) => event.title)
            .join("; ")}
          . Proximity alone does not establish audience relevance.
        </p>
      )}
      <details>
        <summary>Factors by selected audience subgroup</summary>
        <ul className="subgroup-factors">
          {analysis.cells.map((cell) => (
            <li key={cell.id}>
              <strong>{cellLabel(cell)}</strong>: {cell.eventIds.length}{" "}
              relevant engineering / organization overlaps,{" "}
              {cell.examIds.length} academic constraints,{" "}
              {cell.externalIds.length} broad or explicitly relevant external
              cautions.{" "}
              {cell.eventIds
                .concat(cell.examIds, cell.externalIds)
                .map(
                  (id) =>
                    context.events.find((e) => e.id === id)?.title ??
                    context.exams.find((e) => e.id === id)?.courseId ??
                    context.externalEvents.find((e) => e.id === id)?.title ??
                    id,
                )
                .join("; ") ||
                "No recorded direct constraints for this cell; coverage is incomplete."}
            </li>
          ))}
        </ul>
      </details>
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
          <p className="field-help">
            The candidate curve is uncalibrated. Each major × academic-level
            cell is analyzed independently; there is no invented enrollment
            share or whole-audience average.
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
              <p className="field-help">
                Inclusive start, exclusive end. Exact limits immediately before
                exam starts and the interval end are considered; a peak limit is
                not an attained post-start value.
              </p>
            </section>
          </div>
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
              .map((exam) => (
                <li key={exam.id}>
                  {exam.courseId}: preparation ends at{" "}
                  {formatTimedInstant(exam.start!)}; its recorded exam interval
                  is then a direct constraint, ending exclusively at{" "}
                  {formatTimedInstant(exam.end!)}.
                </li>
              ))}
          </ul>
        </>
      )}
      <AudienceUncertainty
        exams={analysis.preparation.audienceUncertainExams}
      />
    </section>
  );
}
