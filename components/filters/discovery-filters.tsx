"use client";
import { useState } from "react";
import type { DiscoveryState } from "../../lib/domain/calendar-state";
import type {
  Major,
  Organization,
  EventCategory,
} from "../../lib/domain/models";
import { EVENT_CATEGORIES } from "../../lib/domain/event-categories";

type Props = {
  state: DiscoveryState;
  majors: Major[];
  organizations: Organization[];
  onChange: (state: DiscoveryState) => void;
  onReset: () => void;
};
const toggle = (values: string[], id: string) =>
  values.includes(id)
    ? values.filter((value) => value !== id)
    : [...values, id];
export function DiscoveryFilters({
  state,
  majors,
  organizations,
  onChange,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="filters-panel" aria-labelledby="filters-title">
      <div className="filter-heading">
        <h2 id="filters-title">Refine events</h2>
        <button className="text-button" onClick={onReset}>
          Clear filters
        </button>
      </div>
      <button
        className="filter-toggle control"
        aria-expanded={open}
        aria-controls="filter-controls"
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide filters" : "Show filters"}
      </button>
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
              onChange={() => onChange({ ...state, mode: "all" })}
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
        <fieldset aria-describedby="major-help">
          <legend>Your engineering majors</legend>
          <p id="major-help" className="field-help">
            {state.mode === "all"
              ? "Used in Recommended Events. Select one or more."
              : "College-wide events are always included."}
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
        <fieldset>
          <legend>Organizations</legend>
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
        <fieldset>
          <legend>Event categories</legend>
          {(Object.entries(EVENT_CATEGORIES) as [EventCategory, string][]).map(
            ([id, label]) => (
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
            ),
          )}
        </fieldset>
      </div>
    </aside>
  );
}
