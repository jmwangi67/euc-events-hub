import type { DisplayDay } from "./display-busyness";
import { formatAllDayDate } from "../../lib/time/eastern";
import { externalScopeLabel } from "../../lib/domain/source-labels";

const activityLabels = [
  "Free",
  "Open",
  "Light",
  "Moderate",
  "Heavy",
  "Extreme",
];

export function DayActivityDots({ day }: { day: DisplayDay }) {
  const count = day.items.length;
  const level = activityLabels[day.filled];
  const label = `${formatAllDayDate(day.date)}. Busyness: ${level}, ${day.filled} of 5 activity dots. ${count} calendar ${count === 1 ? "commitment" : "commitments"}. PSU-wide and national events always included, even when hidden. Recorded activity only; not availability or a scheduling score.`;
  return (
    <span
      className="day-activity-indicator"
      role="img"
      aria-label={label}
      title={label}
      data-activity-date={day.date}
      data-activity-count={count}
      data-activity-filled={day.filled}
    >
      <span className="day-activity-label" aria-hidden="true">
        {level}
      </span>
      <span className="day-activity-dots" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <svg
            key={index}
            viewBox="0 0 8 8"
            width="8"
            height="8"
            focusable="false"
            className={
              index < day.filled ? "activity-dot filled" : "activity-dot"
            }
          >
            <circle cx="4" cy="4" r="3.5" strokeWidth="1" />
          </svg>
        ))}
      </span>
    </span>
  );
}

export function DayActivityContext({ day }: { day: DisplayDay }) {
  return (
    <details className="planner-day-context">
      <summary>
        Day context · {formatAllDayDate(day.date)} · {day.items.length}{" "}
        {day.items.length === 1 ? "commitment" : "commitments"}
      </summary>
      <p className="field-help">
        One dot per unique calendar commitment on this date, capped at five.
        Proposals and background shading are excluded. This describes recorded
        activity, not attendance, concurrency or a validated pressure score.
      </p>
      {day.items.length ? (
        <ul className="day-context-items">
          {day.items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.timeLabel}</span>
              {item.scope && <span>{externalScopeLabel(item.scope)}</span>}
              {!item.visible && (
                <span>Included even while its calendar layer is hidden.</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          No recorded commitments in this display context. Coverage may be
          incomplete; this does not establish availability.
        </p>
      )}
    </details>
  );
}
