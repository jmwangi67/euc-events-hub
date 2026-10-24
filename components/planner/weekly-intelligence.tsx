"use client";
import type { WeeklySummary } from "../../lib/domain/weekly-planning";
import { SCHEDULING_FACTORS } from "../../lib/domain/weekly-planning";
import type { PlanningAudience } from "../../lib/domain/planning-audience";
import {
  clusterTargetingLabel,
  examAudienceMatch,
} from "../../lib/domain/planning-audience";
import {
  addCalendarDays,
  formatAllDayDate,
  formatEventTime,
} from "../../lib/time/eastern";
import { EXTERNAL_CATEGORIES } from "../../lib/domain/external-events";
import { AudienceUncertainty } from "./preparation-details";
import { DetailsDialog } from "../calendar/details-dialog";
import { examTimeLabel } from "../calendar/planner-events";
import {
  sourceLabel,
  verificationLabel,
  externalScopeLabel,
} from "../../lib/domain/source-labels";
export function weekLabel(week: { start: string; end: string }) {
  return `${formatAllDayDate(week.start)} – ${formatAllDayDate(addCalendarDays(week.end, -1))}`;
}
export function compactWeekLabel(week: WeeklySummary) {
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
  onFocusWeek,
}: {
  week: WeeklySummary;
  onSelect: (week: WeeklySummary) => void;
  height?: number;
  onFocusWeek?: (week: WeeklySummary) => void;
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
        aria-haspopup="dialog"
        aria-label={`Weekly summary: ${weekLabel(week)}. ${c.uniqueTotal} unique commitments: ${c.collegeWide} College-wide, ${c.otherEvents} other relevant events, ${c.exams} mapped exams, ${c.psuWide} PSU-wide, ${c.campusLocal} Local, ${c.national} National; ${c.uncertainExams} audience-uncertain exams. Open weekly summary details.`}
      >
        <span className="week-summary-date">{compactWeekLabel(week)}</span>
        <span>
          <strong>{c.uniqueTotal}</strong> unique commitments
        </span>
        {c.uniqueTotal > 0 && (
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
              PSU-wide <b>{c.psuWide}</b>
            </span>
            <span>
              Local <b>{c.campusLocal}</b>
            </span>
            <span>
              National <b>{c.national}</b>
            </span>
          </span>
        )}
        {c.uniqueTotal > 0 && (
          <span className="weekly-audience-tags">
            Audience tags: {c.majorMatches} major · {c.academicLevelMatches}{" "}
            level · {c.clusterMatches} cluster
          </span>
        )}
        {c.uncertainExams > 0 && (
          <span>{c.uncertainExams} audience-uncertain exams</span>
        )}
        <span className="field-help">Weekly summary details →</span>
      </button>
      {onFocusWeek && (
        <button
          type="button"
          className="focus-week-control"
          onClick={() => onFocusWeek(week)}
          aria-label={`Focus this week in calendar: ${weekLabel(week)}`}
        >
          Focus this week in calendar ↑
        </button>
      )}
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
        Example scenarios, not real or verified schedules. Counts describe
        available records, not expected attendance or pressure.
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
            <span>{clusterTargetingLabel(event)}</span>
            <span>
              {event.collegeWide
                ? "College-wide"
                : "Other relevant engineering / organization"}{" "}
              · {sourceLabel(event.source)} ·{" "}
              {verificationLabel(event.source.verification)}
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
              {sourceLabel(exam.source)} ·{" "}
              {verificationLabel(exam.source.verification)} ·{" "}
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
      <AudienceUncertainty exams={week.uncertainExams} />
      <h3>Significant external commitments ({week.externalEvents.length})</h3>
      <ul className="weekly-detail-records">
        {week.externalEvents.map((event) => (
          <li key={event.id}>
            <strong>{event.title}</strong>
            <span>
              {EXTERNAL_CATEGORIES[event.category]} ·{" "}
              {externalScopeLabel(event.scope)}
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
              {event.analysisReason}{" "}
              {event.analysis === "context-only"
                ? "Context only; excluded from analytical scheduling density."
                : "Eligibility follows documented scope/audience; participation is unknown."}
            </span>
            <span>
              {event.geography} · {event.audience}
            </span>
            <span>
              {sourceLabel(event.source)} ·{" "}
              {verificationLabel(event.source.verification)}
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
