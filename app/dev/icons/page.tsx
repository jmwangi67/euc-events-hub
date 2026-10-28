import { notFound } from "next/navigation";
import { EventTypeIcon } from "../../../components/calendar/event-type-icon";
import { eventIconType } from "../../../components/calendar/planner-presentation";
import { ICON_INVENTORY } from "../../../components/calendar/icon-inventory";
export const dynamic = "force-dynamic";
export default function IconInventoryPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main id="main" className="application-main icon-inventory">
      <h1>Event icon inventory</h1>
      <p>
        Development review — actual rendered SVG components. Identity is
        separate from category color, event scope, and PSU hosting paw badges.
        No proposed or approximate substitutes are shown. Symbols are magnified
        to 24px here for review; calendar sizes are unchanged.
      </p>
      <table>
        <thead>
          <tr>
            <th>Icon</th>
            <th>Current label / name</th>
            <th>Semantic meaning</th>
            <th>Used in</th>
          </tr>
        </thead>
        <tbody>
          {ICON_INVENTORY.map((row) => (
            <tr key={row.label}>
              <td>
                <EventTypeIcon
                  props={row.props}
                  large
                  useThonMark={!row.fallback}
                />
              </td>
              <th scope="row">
                {row.label}
                <small>
                  {row.fallback ? "users" : eventIconType(row.props)}
                </small>
              </th>
              <td>{row.meaning}</td>
              <td>{row.where}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
