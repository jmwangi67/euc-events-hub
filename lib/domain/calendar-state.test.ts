import { describe, expect, it } from "vitest";
import { getEvents, getMajors, getOrganizations } from "../data/fixtures";
import {
  clearDiscoveryFilters,
  discoveryFilters,
  parseCalendarState,
  serializeCalendarState,
} from "./calendar-state";
const options = {
  majorIds: getMajors().map((major) => major.id),
  organizationIds: getOrganizations().map((org) => org.id),
};
const parse = (query = "") =>
  parseCalendarState(new URLSearchParams(query), "2026-10-19", options);
const query = (state: ReturnType<typeof parse>) =>
  getEvents({
    start: "2026-10-19",
    end: "2026-10-28",
    filters: discoveryFilters(state),
  });
const ids = (search = "") => query(parse(search)).map((event) => event.id);
describe("student discovery and shareable state", () => {
  it("defaults to published All Events, including unclassified programming", () => {
    expect(ids()).toContain("example-open-studio");
    expect(ids()).not.toContain("example-open-topic");
    expect(query(parse()).every((event) => event.status === "published")).toBe(
      true,
    );
  });
  it("recommends explicit cross-major and inherited audiences with college-wide events", () => {
    const result = ids("mode=recommended&majors=bme");
    expect(result).toEqual([
      "example-welcome",
      "example-industry",
      "example-gbm",
      "example-social",
      "example-design-meeting",
      "example-design-days",
      "example-night-build",
    ]);
    expect(result).not.toContain("example-open-studio");
    expect(result).not.toContain("example-process-lab");
  });
  it("matches any of multiple selected majors", () => {
    expect(ids("mode=recommended&majors=bme,che")).toContain(
      "example-process-lab",
    );
    expect(ids("mode=recommended")).toEqual(["example-welcome", "example-gbm"]);
  });
  it("keeps majors and host filters independent and combines category filters", () => {
    expect(
      ids(
        "mode=recommended&majors=bme&organizations=example-process&categories=corporate-recruiting",
      ),
    ).toEqual(["example-industry"]);
    expect(
      ids("mode=recommended&majors=me&organizations=example-process"),
    ).toEqual([]);
    expect(ids("categories=corporate-recruiting,technical-workshop")).toEqual([
      "example-process-lab",
      "example-industry",
    ]);
  });
  it("searches titles and descriptions without case or surrounding whitespace sensitivity", () => {
    expect(ids("q=%20BIOPROCESS%20")).toEqual(["example-industry"]);
    expect(ids("q=exchanging%20project%20ideas")).toEqual([
      "example-open-studio",
    ]);
    expect(ids("q=not-a-real-event")).toEqual([]);
    expect(ids("q=%20%20")).toEqual(ids());
  });
  it("combines search with publication, category, and audience constraints", () => {
    expect(ids("q=Topic%20to%20be%20announced")).toEqual([]);
    expect(
      ids("mode=recommended&majors=che&categories=technical-workshop&q=lab"),
    ).toEqual(["example-process-lab"]);
  });
  it("clears filters after empty results while preserving the calendar context", () => {
    const state = parse(
      "date=2026-10-21&view=listMonth&mode=recommended&majors=me&organizations=example-process&categories=research&q=no-match",
    );
    expect(query(state)).toEqual([]);
    const reset = clearDiscoveryFilters(state);
    expect(reset.date).toBe(state.date);
    expect(reset.view).toBe(state.view);
    expect(query(reset).length).toBeGreaterThan(0);
    expect(reset).toEqual({
      date: "2026-10-21",
      view: "listMonth",
      mode: "all",
      majorIds: [],
      organizationIds: [],
      categories: [],
      search: "",
    });
  });
  it("round-trips valid URL filters and selected date/view", () => {
    const state = parse(
      "date=2026-10-22&view=timeGridWeek&mode=recommended&majors=bme,che&organizations=example-design&categories=networking,competition&q=design%20%26%20ideas",
    );
    expect(parse(serializeCalendarState(state))).toEqual(state);
  });
  it("ignores unknown URL options and invalid dates rather than crashing", () => {
    const state = parse(
      "date=2026-02-30&view=planner&mode=admin&majors=unknown,bme,bme&organizations=private&categories=bad",
    );
    expect(state.date).toBe("2026-10-19");
    expect(state.view).toBeUndefined();
    expect(state.mode).toBe("all");
    expect(state.majorIds).toEqual(["bme"]);
    expect(state.organizationIds).toEqual([]);
    expect(state.categories).toEqual([]);
    expect(parse(`q=${"a".repeat(250)}`).search).toHaveLength(200);
  });
});
