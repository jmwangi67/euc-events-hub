import { dateOnlySchema, eventCategorySchema } from "./models";
import type { EventFilters } from "../data/fixtures";

export const CALENDAR_VIEWS = [
  "dayGridMonth",
  "timeGridWeek",
  "timeGridDay",
  "listMonth",
] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];
export type DiscoveryState = {
  date: string;
  view?: CalendarView;
  mode: "all" | "recommended";
  majorIds: string[];
  organizationIds: string[];
  categories: import("./models").EventCategory[];
  search: string;
};
export const clearDiscoveryFilters = (
  state: DiscoveryState,
): DiscoveryState => ({
  ...state,
  mode: "all",
  majorIds: [],
  organizationIds: [],
  categories: [],
  search: "",
});

export function parseCalendarState(
  params: URLSearchParams,
  today: string,
  options: { majorIds: string[]; organizationIds: string[] },
): DiscoveryState {
  const values = (key: string, allowed: readonly string[]) =>
    [...new Set((params.get(key) ?? "").split(","))].filter((value) =>
      allowed.includes(value),
    );
  const view = params.get("view");
  return {
    date: dateOnlySchema.safeParse(params.get("date")).success
      ? params.get("date")!
      : today,
    view: CALENDAR_VIEWS.includes(view as CalendarView)
      ? (view as CalendarView)
      : undefined,
    mode: params.get("mode") === "recommended" ? "recommended" : "all",
    majorIds: values("majors", options.majorIds),
    organizationIds: values("organizations", options.organizationIds),
    categories: values(
      "categories",
      eventCategorySchema.options,
    ) as DiscoveryState["categories"],
    search: (params.get("q") ?? "").slice(0, 200),
  };
}
export function serializeCalendarState(state: DiscoveryState): string {
  const params = new URLSearchParams({ date: state.date });
  if (state.view) params.set("view", state.view);
  if (state.mode !== "all") params.set("mode", state.mode);
  if (state.majorIds.length) params.set("majors", state.majorIds.join(","));
  if (state.organizationIds.length)
    params.set("organizations", state.organizationIds.join(","));
  if (state.categories.length)
    params.set("categories", state.categories.join(","));
  if (state.search) params.set("q", state.search);
  return params.toString();
}
export function discoveryFilters(state: DiscoveryState): EventFilters {
  return {
    audience:
      state.mode === "all"
        ? { mode: "all" }
        : { mode: "recommended", majorIds: state.majorIds },
    organizationIds: state.organizationIds,
    categories: state.categories,
    search: state.search,
  };
}
