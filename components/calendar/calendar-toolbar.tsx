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
          <span aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5m6-6-6 6 6 6" />
            </svg>
          </span>
        </button>
        <button
          className="control arrow-control"
          aria-label="Next date range"
          onClick={() => onNavigate("next")}
        >
          <span aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </span>
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
