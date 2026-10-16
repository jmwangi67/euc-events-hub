import { events, exams, organizations, majors } from "../../data/fixtures";
import { dateOnlySchema } from "../domain/models";
import type { Event, EventCategory } from "../domain/models";
import { isEventRelevant } from "../domain/relevance";
import type { MajorSelection } from "../domain/relevance";
import { addCalendarDays, easternDayStart } from "../time/eastern";

export type DateWindow = { start: string; end: string };
export type EventFilters = {
  audience?: MajorSelection;
  organizationIds?: readonly string[];
  categories?: readonly EventCategory[];
  search?: string;
};

/** Public query windows are Eastern date-only boundaries [start, end). */
function parseWindow(window: DateWindow): { start: number; end: number } {
  dateOnlySchema.parse(window.start);
  dateOnlySchema.parse(window.end);
  if (window.end <= window.start)
    throw new RangeError("Window end must follow start.");
  return {
    start: Date.parse(easternDayStart(window.start)),
    end: Date.parse(easternDayStart(window.end)),
  };
}
function eventInterval(event: Event): { start: number; end: number } {
  return {
    start: Date.parse(
      event.allDay ? easternDayStart(event.start) : event.start,
    ),
    end: Date.parse(event.allDay ? easternDayStart(event.end) : event.end),
  };
}
function overlaps(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return a.start < b.end && a.end > b.start;
}
/** Published-only public queries; optional local fixtures keep tests isolated. */
export function getEvents(
  { start, end, filters = {} }: DateWindow & { filters?: EventFilters },
  eventFixtures: readonly Event[] = events,
): Event[] {
  const window = parseWindow({ start, end });
  const search = filters.search?.trim().toLowerCase() ?? "";
  return structuredClone(
    eventFixtures
      .filter(
        (event) =>
          event.status === "published" &&
          overlaps(eventInterval(event), window) &&
          isEventRelevant(
            event,
            filters.audience ?? { mode: "all" },
            organizations,
          ) &&
          (!filters.organizationIds?.length ||
            filters.organizationIds.some((id) =>
              event.hostOrganizationIds.includes(id),
            )) &&
          (!filters.categories?.length ||
            filters.categories.includes(event.category)) &&
          (!search ||
            `${event.title} ${event.description ?? ""}`
              .toLowerCase()
              .includes(search)),
      )
      .sort(
        (a, b) =>
          eventInterval(a).start - eventInterval(b).start ||
          a.id.localeCompare(b.id),
      ),
  );
}
export function getEventById(
  id: string,
  eventFixtures: readonly Event[] = events,
): Event | undefined {
  const event = eventFixtures.find(
    (event) => event.id === id && event.status === "published",
  );
  return event ? structuredClone(event) : undefined;
}
export function getMajors() {
  return structuredClone(majors);
}
export function getOrganizations() {
  return structuredClone(organizations);
}
export function getExams({
  start,
  end,
  termId,
}: DateWindow & { termId?: string }) {
  const window = parseWindow({ start, end });
  return structuredClone(
    exams
      .filter((exam) => {
        const interval = exam.timeKnown
          ? { start: Date.parse(exam.start), end: Date.parse(exam.end) }
          : {
              start: Date.parse(easternDayStart(exam.date)),
              end: Date.parse(easternDayStart(addCalendarDays(exam.date, 1))),
            };
        return (
          (!termId || exam.termId === termId) && overlaps(interval, window)
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
  );
}
