import type { WeeklySummary } from "../../lib/domain/weekly-planning";
import {
  WeeklySummaryCell,
  weekLabel,
  compactWeekLabel,
} from "./weekly-intelligence";
export function CompactWeeklySummaries({
  weeks,
  activeWeek,
  onWeekChange,
  onOpen,
}: {
  weeks: WeeklySummary[];
  activeWeek: WeeklySummary;
  onWeekChange: (start: string) => void;
  onOpen: (week: WeeklySummary) => void;
}) {
  return (
    <section
      className="compact-weekly-summaries"
      aria-label="Weekly scheduling summaries"
    >
      <div className="compact-week-heading">
        <h3>Weekly scheduling summaries</h3>
        <label>
          Show weekly summary for
          <select
            aria-label="Show weekly summary for"
            className="control"
            value={activeWeek.start}
            onChange={(event) => onWeekChange(event.target.value)}
          >
            {weeks.map((week) => (
              <option
                key={week.start}
                value={week.start}
                aria-label={`${weekLabel(week)} · ${week.counts.uniqueTotal} records`}
              >
                {compactWeekLabel(week)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="field-help">
        All analysis layers included, even when hidden. Counts are factual;
        overall scoring methodology awaits review.
      </p>
      <WeeklySummaryCell week={activeWeek} onSelect={onOpen} />
    </section>
  );
}
