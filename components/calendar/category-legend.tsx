import { EVENT_CATEGORIES } from "../../lib/domain/event-categories";
export function CategoryLegend() {
  return (
    <section
      className="calendar-legend student-category-legend"
      aria-label="Event categories legend"
    >
      <h3>Event types</h3>
      <ul>
        {Object.entries(EVENT_CATEGORIES).map(([id, label]) => (
          <li key={id}>
            <span
              className={`category-swatch category-${id}`}
              aria-hidden="true"
            />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
