"use client";
import { useState } from "react";
import type {
  WeeklySummary,
  PlanningContext,
} from "../../lib/domain/weekly-planning";
import {
  dayPressureBreakdown,
  SCHEDULING_FACTORS,
} from "../../lib/domain/weekly-planning";
import type { PlanningAudience } from "../../lib/domain/planning-audience";
import { examAudienceMatch } from "../../lib/domain/planning-audience";
import {
  addCalendarDays,
  formatAllDayDate,
  formatEventTime,
} from "../../lib/time/eastern";
import { EXTERNAL_CATEGORIES } from "../../lib/domain/external-events";
import { DetailsDialog } from "../calendar/details-dialog";
import { examTimeLabel } from "../calendar/planner-events";
export function weekLabel(week: { start: string; end: string }) {
  return `${formatAllDayDate(week.start)} – ${formatAllDayDate(addCalendarDays(week.end, -1))}`;
}
function compactWeekLabel(week: WeeklySummary) {
  const last = addCalendarDays(week.end, -1);
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: week.start.slice(0, 4) !== last.slice(0, 4) ? "numeric" : undefined,
  });
  return `${format.format(new Date(`${week.start}T00:00:00Z`))} – ${format.format(new Date(`${last}T00:00:00Z`))}`;
}
export function WeeklySummaryCell({
  week,
  onSelect,
  height,
}: {
  week: WeeklySummary;
  onSelect: (week: WeeklySummary) => void;
  height?: number;
}) {
  const c = week.counts;
  return (
    <div
      className="weekly-summary-cell"
      style={height ? { height } : undefined}
    >
      <button
        className="weekly-summary-trigger"
        data-calendar-event-id={`week:${week.start}`}
        onClick={() => onSelect(week)}
        aria-label={`Weekly summary: ${weekLabel(week)}. ${c.uniqueTotal} unique commitments. Open details.`}
      >
        <span className="week-summary-date">{compactWeekLabel(week)}</span>
        <span>
          <strong>{c.uniqueTotal}</strong> unique commitments
        </span>
        <span className="weekly-counts">
          <span>
            College-wide <b>{c.collegeWide}</b>
          </span>
          <span>
            Other engineering <b>{c.otherEvents}</b>
          </span>
          <span>
            Academic exams <b>{c.exams}</b>
          </span>
          <span>
            Campus / local <b>{c.campusLocal}</b>
          </span>
          <span>
            National <b>{c.national}</b>
          </span>
        </span>
        <span className="weekly-audience-tags">
          Audience tags: {c.majorMatches} major · {c.academicLevelMatches} level
          · {c.clusterMatches} cluster
        </span>
        <span className="field-help">View weekly details →</span>
      </button>
    </div>
  );
}
export function WeeklyDetails({
  week,
  audience,
  triggerId,
  onClose,
}: {
  week: WeeklySummary;
  triggerId: string;
  audience: PlanningAudience;
  onClose: () => void;
}) {
  return (
    <DetailsDialog
      triggerId={triggerId}
      title={weekLabel(week)}
      titleId="weekly-detail-title"
      label="Weekly summary details"
      onClose={onClose}
    >
      <p className="example-note">
        Synthetic scenarios, not confirmed schedules. Counts describe available
        records, not expected attendance or pressure.
      </p>
      <p>
        <strong>{week.counts.uniqueTotal} unique commitments.</strong> Each
        record is counted once in this week, including multi-day occurrences.
        The same occurrence can appear in another week it spans.
      </p>
      <p className="field-help">
        Overlapping audience tags (do not add): {week.counts.majorMatches} major
        matches · {week.counts.academicLevelMatches} explicit academic-level
        matches · {week.counts.clusterMatches} explicit cluster matches. Cluster
        membership alone never targets an event.
      </p>
      <h3>Engineering and organization events ({week.events.length})</h3>
      <ul className="weekly-detail-records">
        {week.events.map((event) => (
          <li key={event.id}>
            <strong>{event.title}</strong>
            <span>{formatEventTime(event)}</span>
            <span>
              {event.collegeWide
                ? "College-wide"
                : "Other relevant engineering / organization"}{" "}
              · {event.source.label} · {event.source.verification}
            </span>
            {event.source.url && (
              <a href={event.source.url} target="_blank" rel="noreferrer">
                Source (new tab)
              </a>
            )}
          </li>
        ))}
      </ul>
      <h3>Academic exams ({week.exams.length})</h3>
      <ul className="weekly-detail-records">
        {week.exams.map((exam) => (
          <li key={exam.id}>
            <strong>{exam.courseId}</strong>
            <span>{examTimeLabel(exam)}</span>
            <span>{examAudienceMatch(exam, audience).explanation}</span>
            <span>
              {exam.source.label} · {exam.source.verification} ·{" "}
              {exam.sectionScope.join(", ") || "Section coverage unknown"}
            </span>
            {exam.source.url && (
              <a href={exam.source.url} target="_blank" rel="noreferrer">
                Source (new tab)
              </a>
            )}
          </li>
        ))}
      </ul>
      <h3>Significant external commitments ({week.externalEvents.length})</h3>
      <ul className="weekly-detail-records">
        {week.externalEvents.map((event) => (
          <li key={event.id}>
            <strong>{event.title}</strong>
            <span>
              {EXTERNAL_CATEGORIES[event.category]} ·{" "}
              {event.scope === "national" ? "National" : "Campus / local"}
            </span>
            <span>
              {event.timeKnown
                ? formatEventTime({
                    allDay: false,
                    start: event.start,
                    end: event.end,
                  })
                : `${formatAllDayDate(event.startDate)} – ${formatAllDayDate(addCalendarDays(event.endDate, -1))} · Time unknown`}
            </span>
            <span>
              {event.geography} · {event.audience}
            </span>
            <span>
              {event.source.label} · Verification: {event.source.verification}
            </span>
            {event.source.url && (
              <a href={event.source.url} target="_blank" rel="noreferrer">
                Source (new tab)
              </a>
            )}
          </li>
        ))}
      </ul>
      <h3>Overall scoring methodology: awaiting review</h3>
      <p>
        No numerical overall score is enabled. Factor weights, cross-factor
        overlap handling and calibration need independent review and approval.
      </p>
      <ul>
        {SCHEDULING_FACTORS.map((factor) => (
          <li key={factor.id}>
            <strong>{factor.label}:</strong> {factor.method}
          </li>
        ))}
      </ul>
      <p className="field-help">
        Mappings and sources are incomplete. No attendance probabilities,
        reservations or verified enrollment are inferred.
      </p>
    </DetailsDialog>
  );
}
export function WeekPressurePreview({
  start,
  audience,
  context,
}: {
  start: string;
  audience: PlanningAudience;
  context: PlanningContext;
}) {
  const [enabled, setEnabled] = useState(false);
  return (
    <section
      className="pressure-preview"
      aria-label="Experimental week breakdown"
    >
      <label className="choice">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Preview experimental exam preparation
      </label>
      <p className="field-help">
        Overall scoring methodology awaiting review. Preparation values are
        relative model units, never percentages of students unavailable.
      </p>
      {enabled && (
        <>
          <p className="field-help">
            Snapshots at Eastern day start, not daily averages or event-time
            conflict scores. Unknown exam hours produce ranges. A contribution
            stops at the actual exam start; direct intervals remain separate.
          </p>
          <div className="pressure-days">
            {Array.from({ length: 7 }, (_, i) => {
              const day = dayPressureBreakdown(
                addCalendarDays(start, i),
                audience,
                context,
              );
              const [low, high] = day.preparationAtDayStart.range;
              return (
                <div className="pressure-day" key={day.date}>
                  <h3>{formatAllDayDate(day.date)}</h3>
                  <p className="preparation-value">
                    Prep {low.toFixed(1)}
                    {Math.abs(high - low) > 0.01 ? `–${high.toFixed(1)}` : ""} /
                    10
                  </p>
                  <div className="preparation-track" aria-hidden="true">
                    <span style={{ width: `${high * 10}%` }} />
                  </div>
                  <p>
                    {day.knownTimedConstraints.length} known-time commitments
                    <br />
                    {day.dateOnlyConstraints} date-level uncertainties
                  </p>
                  <p>
                    Campus / local {day.counts.campusLocal} · National{" "}
                    {day.counts.national}
                  </p>
                  <details>
                    <summary>Model contributions</summary>
                    <ul>
                      {day.preparationAtDayStart.contributions
                        .filter(
                          (c) =>
                            c.range[1] > 0 || c.state === "direct-constraint",
                        )
                        .map((c) => (
                          <li key={c.examId}>
                            {c.examId}: {c.range[0].toFixed(1)}–
                            {c.range[1].toFixed(1)} · {c.state}. {c.explanation}
                          </li>
                        ))}
                    </ul>
                    <p>Direct intervals (not preparation):</p>
                    <ul>
                      {day.knownTimedConstraints.map((c) => (
                        <li key={c.id}>
                          {c.id}: {formatEventTime({ allDay: false, ...c })}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
