"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Major, Organization } from "../../lib/domain/models";
import { getOrganizationClusters } from "../../lib/data/weekly-planning";
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
import { DiscoveryGuide } from "../filters/discovery-guide";
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
  const clusters = useMemo(() => getOrganizationClusters(), []);
  const [state, setState] = useState(initialState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mobile = useCompactCalendar();
  const view =
    mobile && state.view !== "timeGridDay"
      ? "listMonth"
      : (state.view ?? "dayGridMonth");
  const filters = useMemo(() => discoveryFilters(state), [state]);
  const selectedEvent = selectedId ? getEventById(selectedId) : undefined;
  const update = useCallback((next: DiscoveryState, replace = false) => {
    setState(next);
    window.history[replace ? "replaceState" : "pushState"](
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
            clusterIds: clusters.map((cluster) => cluster.id),
          },
        ),
      );
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [majors, organizations, clusters]);
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
      <div className="page-heading student-welcome">
        <div>
          <p className="eyebrow">Student calendar</p>
          <h1>Hey, find your next event here!</h1>
          <p className="welcome-context">
            Discover engineering events happening on campus, hosted by faculty,
            staff, and students just like you. Whether you’re looking to build
            your skills, meet people, explore opportunities, or just have fun,
            there’s something worth checking out.
          </p>
          <p className="welcome-desktop-help">
            Filter by your major, student organization cluster, or event
            category to find what interests you. Combine filters to narrow
            things down—or search event titles and descriptions if you already
            know what you’re looking for.
          </p>
          <p className="welcome-mobile-help">
            Discover engineering events hosted by faculty, staff and students.
            Filter by major, organization, community or activity—or search
            titles and descriptions.
          </p>
        </div>
      </div>
      <DiscoveryGuide clusters={clusters} organizations={organizations} />
      <div className="discovery-layout">
        <DiscoveryFilters
          state={state}
          majors={majors}
          organizations={organizations}
          clusters={clusters}
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
              onChange={(e) =>
                update({ ...state, search: e.target.value }, true)
              }
            />
            <p className="field-help">
              {!state.majorIds.length
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
