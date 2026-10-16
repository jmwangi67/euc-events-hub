import type { PlannerCalendarView } from "../../lib/domain/planner-calendar-state";
export function CalendarToolbar({
  date,
  view,
  views,
  onNavigate,
  onDateChange,
  onViewChange,
}: {
  date: string;
  view: PlannerCalendarView;
  views: [PlannerCalendarView, string][];
  onNavigate: (direction: "prev" | "next" | "today") => void;
  onDateChange: (date: string) => void;
  onViewChange: (view: PlannerCalendarView) => void;
}) {
  return (
    <div className="calendar-toolbar">
      <div
        className="calendar-navigation"
        role="group"
        aria-label="Date navigation"
      >
        <button
          className="control arrow-control"
          aria-label="Previous date range"
          onClick={() => onNavigate("prev")}
        >
          ←
        </button>
        <button
          className="control arrow-control"
          aria-label="Next date range"
          onClick={() => onNavigate("next")}
        >
          →
        </button>
        <button className="control" onClick={() => onNavigate("today")}>
          Today
        </button>
      </div>
      <div className="view-controls" role="group" aria-label="Calendar view">
        {views.map(([id, label]) => (
          <button
            className="control"
            key={id}
            aria-pressed={view === id}
            onClick={() => onViewChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="date-jump">
        Go to date{" "}
        <input
          className="control"
          type="date"
          value={date}
          onChange={(event) => {
            if (event.target.value) onDateChange(event.target.value);
          }}
        />
      </label>
    </div>
  );
}
