import type { DisplayDay } from "./display-busyness";
import { formatAllDayDate } from "../../lib/time/eastern";
import { externalScopeLabel } from "../../lib/domain/source-labels";

export function DayActivityDots({ day }: { day: DisplayDay }) {
  const count = day.items.length;
  const label = `${formatAllDayDate(day.date)}: ${count} calendar ${count === 1 ? "commitment" : "commitments"}, ${day.filled} of 5 activity dots. PSU-wide and national events always included, even when hidden. Display activity, not a scheduling score.`;
  return (
    <span
      className="day-activity-dots"
      role="img"
      aria-label={label}
      title={label}
      data-activity-date={day.date}
      data-activity-count={count}
      data-activity-filled={day.filled}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={
            index < day.filled ? "activity-dot filled" : "activity-dot"
          }
        />
      ))}
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
