"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Major, Organization } from "../../lib/domain/models";
import { getEventById } from "../../lib/data/fixtures";
import {
  clearDiscoveryFilters,
  discoveryFilters,
  parseCalendarState,
  serializeCalendarState,
} from "../../lib/domain/calendar-state";
import type { DiscoveryState } from "../../lib/domain/calendar-state";
import { easternDate } from "../../lib/time/eastern";
import { DiscoveryFilters } from "../filters/discovery-filters";
import { EventCalendar } from "./event-calendar";
import { EventDetails } from "./event-details";

import { useCompactCalendar } from "./use-compact-calendar";
type Props = {
  initialState: DiscoveryState;
  majors: Major[];
  organizations: Organization[];
};
export function StudentCalendar({
  initialState,
  majors,
  organizations,
}: Props) {
  const [state, setState] = useState(initialState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mobile = useCompactCalendar();
  const view =
    mobile && state.view !== "timeGridDay"
      ? "listMonth"
      : (state.view ?? "dayGridMonth");
  const filters = useMemo(() => discoveryFilters(state), [state]);
  const selectedEvent = selectedId ? getEventById(selectedId) : undefined;
  const update = useCallback((next: DiscoveryState) => {
    setState(next);
    window.history.replaceState(
      window.history.state,
      "",
      `?${serializeCalendarState(next)}`,
    );
  }, []);
  const reset = useCallback(
    () => update(clearDiscoveryFilters(state)),
    [state, update],
  );
  useEffect(() => {
    const restore = () =>
      setState(
        parseCalendarState(
          new URLSearchParams(window.location.search),
          easternDate(new Date().toISOString()),
          {
            majorIds: majors.map((m) => m.id),
            organizationIds: organizations.map((org) => org.id),
          },
        ),
      );
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [majors, organizations]);
  return (
    <>
      <div className="development-notice">
        <p>
          <strong>Fictional events only.</strong> No live event feeds.
        </p>
        <button
          className="text-button"
          onClick={() => update({ ...state, date: "2026-10-19" })}
        >
          View sample dates
        </button>
      </div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Student calendar</p>
          <h1>Engineering events</h1>
          <p>Find opportunities across engineering majors.</p>
        </div>
      </div>
      <div className="discovery-layout">
        <DiscoveryFilters
          state={state}
          majors={majors}
          organizations={organizations}
          onChange={update}
          onReset={reset}
        />
        <div className="discovery-content">
          <div className="discovery-search">
            <label htmlFor="event-search">Search events</label>
            <input
              id="event-search"
              type="search"
              className="control"
              placeholder="Search titles and descriptions"
              maxLength={200}
              value={state.search}
              onChange={(e) => update({ ...state, search: e.target.value })}
            />
            <p className="field-help">
              {state.mode === "all"
                ? "All published events"
                : state.majorIds.length
                  ? "Recommended for your selected majors, including college-wide events"
                  : "Select majors in filters to add recommendations. Showing college-wide events."}
            </p>
          </div>
          <EventCalendar
            date={state.date}
            view={view}
            mobile={mobile}
            filters={filters}
            onDateChange={(date) => update({ ...state, date })}
            onViewChange={(view) => update({ ...state, view })}
            onEventSelect={setSelectedId}
            onReset={reset}
          />
          <p className="calendar-footnote">
            All dates and times use America/New_York. All examples are
            fictional; no live event feeds are connected.
          </p>
        </div>
      </div>
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          majors={majors}
          organizations={organizations}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
