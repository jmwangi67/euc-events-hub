import type {
  Organization,
  OrganizationCluster,
} from "../../lib/domain/models";
import {
  CATEGORY_DESCRIPTIONS,
  EVENT_CATEGORIES,
} from "../../lib/domain/event-categories";
export function DiscoveryGuide({
  clusters,
  organizations,
}: {
  clusters: OrganizationCluster[];
  organizations: Organization[];
}) {
  return (
    <details className="discovery-guide">
      <summary>Explore event types &amp; student communities</summary>
      <p>
        <strong>Major:</strong> your academic discipline and event relevance.{" "}
        <strong>Organization cluster:</strong> organizations grouped by
        interests, activities or community. <strong>Event category:</strong> the
        type of activity.
      </p>
      <div className="guide-columns">
        <section>
          <h2>Event types</h2>
          <ul>
            {Object.entries(EVENT_CATEGORIES).map(([id, label]) => (
              <li key={id}>
                <span
                  className={`category-swatch category-${id}`}
                  aria-hidden="true"
                />
                <div>
                  <strong>{label}</strong>
                  <p>
                    {
                      CATEGORY_DESCRIPTIONS[
                        id as keyof typeof CATEGORY_DESCRIPTIONS
                      ]
                    }
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Student communities</h2>
          <ul>
            {clusters.map((cluster) => (
              <li key={cluster.id}>
                <div>
                  <strong>{cluster.name}</strong>
                  <p>{cluster.description}</p>
                  <p className="field-help">
                    Documented hosts:{" "}
                    {organizations
                      .filter((org) => org.clusterIds?.includes(cluster.id))
                      .map((org) => org.name)
                      .join(", ") || "Membership not documented"}
                    .
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="field-help">
            Discovery matches host membership. Missing memberships are not
            guessed. Planner analysis instead requires explicit event targeting.
          </p>
        </section>
      </div>
    </details>
  );
}
