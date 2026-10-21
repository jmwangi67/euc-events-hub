"use client";
import { useState, type ReactNode } from "react";
import type { DiscoveryState } from "../../lib/domain/calendar-state";
import type {
  Major,
  Organization,
  EventCategory,
  OrganizationCluster,
} from "../../lib/domain/models";
import { EVENT_CATEGORIES } from "../../lib/domain/event-categories";

type Props = {
  state: DiscoveryState;
  majors: Major[];
  organizations: Organization[];
  clusters: OrganizationCluster[];
  onChange: (state: DiscoveryState) => void;
  onReset: () => void;
};
const toggle = (values: string[], id: string) =>
  values.includes(id)
    ? values.filter((value) => value !== id)
    : [...values, id];
// Native disclosures retain their mounted, controlled inputs while collapsed.
function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="filter-group" open>
      <summary>{title}</summary>
      {children}
    </details>
  );
}

export function DiscoveryFilters({
  state,
  majors,
  organizations,
  clusters,
  onChange,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false);
  const activeCount =
    state.organizationIds.length +
    state.clusterIds.length +
    state.categories.length +
    state.majorIds.length +
    (state.search.trim() ? 1 : 0);
  return (
    <aside className="filters-panel" aria-labelledby="filters-title">
      <div className="filter-heading">
        <h2 id="filters-title">Refine events</h2>
        <button
          className="filter-toggle control"
          aria-expanded={open}
          aria-controls="filter-controls"
          onClick={() => setOpen(!open)}
        >
          {open ? "Hide filters" : "Show filters"}
          <span className="filter-count">
            {activeCount} active {activeCount === 1 ? "filter" : "filters"}
          </span>
        </button>
        <button className="text-button" onClick={onReset}>
          Clear filters
        </button>
      </div>
      <div
        id="filter-controls"
        className={`filter-body ${open ? "is-open" : ""}`}
      >
        <fieldset>
          <legend>Discover</legend>
          <label className="choice">
            <input
              type="radio"
              name="mode"
              checked={state.mode === "all"}
              onChange={() => onChange({ ...state, mode: "all", majorIds: [] })}
            />
            All Events
          </label>
          <label className="choice">
            <input
              type="radio"
              name="mode"
              checked={state.mode === "recommended"}
              onChange={() => onChange({ ...state, mode: "recommended" })}
            />
            Recommended Events
          </label>
        </fieldset>
        <FilterGroup title="Majors">
          <fieldset aria-describedby="major-help">
            <legend className="sr-only">Your engineering majors</legend>
            <p id="major-help" className="field-help">
              {state.mode === "all"
                ? "Select majors to discover relevant events from any host."
                : "Major relevance includes college-wide events; other active filters still apply."}
            </p>
            {majors.map((major) => (
              <label className="choice" key={major.id}>
                <input
                  type="checkbox"
                  checked={state.majorIds.includes(major.id)}
                  onChange={() =>
                    onChange({
                      ...state,
                      majorIds: toggle(state.majorIds, major.id),
                      mode: toggle(state.majorIds, major.id).length
                        ? "recommended"
                        : "all",
                    })
                  }
                />
                <span>
                  {major.name}{" "}
                  <span className="muted">({major.abbreviation})</span>
                </span>
              </label>
            ))}
          </fieldset>
        </FilterGroup>
        <FilterGroup title="Organizations">
          <fieldset className="filter-options-scroll">
            <legend className="sr-only">Organizations</legend>
            <p className="field-help">Any host unless selected.</p>
            {organizations.map((org) => (
              <label className="choice" key={org.id}>
                <input
                  type="checkbox"
                  checked={state.organizationIds.includes(org.id)}
                  onChange={() =>
                    onChange({
                      ...state,
                      organizationIds: toggle(state.organizationIds, org.id),
                    })
                  }
                />
                {org.name}
              </label>
            ))}
          </fieldset>
        </FilterGroup>
        <FilterGroup title="Student organization clusters">
          <fieldset>
            <legend className="sr-only">Student organization clusters</legend>
            <p className="field-help">
              Matches documented host membership; combines with other filters.
            </p>
            {clusters.map((cluster) => (
              <label key={cluster.id} className="choice">
                <input
                  type="checkbox"
                  checked={state.clusterIds.includes(cluster.id)}
                  onChange={() =>
                    onChange({
                      ...state,
                      clusterIds: toggle(state.clusterIds, cluster.id),
                    })
                  }
                />
                {cluster.name}
              </label>
            ))}
          </fieldset>
        </FilterGroup>
        <FilterGroup title="Event categories">
          <fieldset>
            <legend className="sr-only">Event categories</legend>
            {(
              Object.entries(EVENT_CATEGORIES) as [EventCategory, string][]
            ).map(([id, label]) => (
              <label className="choice" key={id}>
                <input
                  type="checkbox"
                  checked={state.categories.includes(id)}
                  onChange={() =>
                    onChange({
                      ...state,
                      categories: toggle(
                        state.categories,
                        id,
                      ) as EventCategory[],
                    })
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
        </FilterGroup>
      </div>
    </aside>
  );
}
