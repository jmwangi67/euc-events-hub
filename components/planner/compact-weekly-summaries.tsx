import type { WeeklySummary } from "../../lib/domain/weekly-planning";
import { weekLabel, compactWeekLabel } from "./weekly-intelligence";
/** Small, below-grid access to the existing independent weekly analysis. */
export function CompactWeeklySummaries({
  weeks,
  activeWeek,
  onWeekChange,
  onOpen,
  onFocusWeek,
}: {
  weeks: WeeklySummary[];
  activeWeek: WeeklySummary;
  onWeekChange: (start: string) => void;
  onOpen: (week: WeeklySummary) => void;
  onFocusWeek: (week: WeeklySummary) => void;
}) {
  const c = activeWeek.counts;
  return (
    <nav
      className="compact-weekly-summaries calendar-week-actions"
      aria-label="Week detail controls"
    >
      <label>
        Week details for{" "}
        <select
          aria-label="Show weekly summary for"
          className="control"
          value={activeWeek.start}
          onChange={(e) => onWeekChange(e.target.value)}
        >
          {weeks.map((week) => (
            <option key={week.start} value={week.start}>
              {compactWeekLabel(week)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="control"
        data-calendar-event-id={`week:${activeWeek.start}`}
        aria-label={`Weekly summary: ${weekLabel(activeWeek)}. ${c.uniqueTotal} unique commitments: ${c.collegeWide} College-wide, ${c.otherEvents} other relevant events, ${c.exams} mapped exams, ${c.psuWide} PSU-wide, ${c.campusLocal} Local, ${c.national} National; ${c.uncertainExams} audience-uncertain exams. Open weekly summary details.`}
        onClick={() => onOpen(activeWeek)}
      >
        Weekly summary details
      </button>
      <button
        type="button"
        className="control focus-week-control"
        aria-label={`Focus this week in calendar: ${weekLabel(activeWeek)}`}
        onClick={() => onFocusWeek(activeWeek)}
      >
        Focus this week in calendar
      </button>
    </nav>
  );
}
