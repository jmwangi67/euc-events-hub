import { expect, it } from "vitest";
import { plannerEventOrder, eventIconType } from "./planner-presentation";
it("orders date-wide spans before single unknown dates and chronological clocks with stable ties", () => {
  const event = (id: string, start: string, end: string, allDay: boolean) => ({
    publicId: id,
    title: id,
    start: Date.parse(start),
    end: Date.parse(end),
    allDay,
  });
  const span = event("span", "2026-10-23", "2026-10-26", true);
  const date = event("date", "2026-10-23", "2026-10-24", true);
  const early = event("early", "2026-10-23T09:00Z", "2026-10-23T10:00Z", false);
  const late = event("late", "2026-10-23T11:00Z", "2026-10-23T12:00Z", false);
  expect([late, date, early, span].sort(plannerEventOrder)).toEqual([
    span,
    date,
    early,
    late,
  ]);
  expect(
    plannerEventOrder(
      { ...date, title: "same", publicId: "a" },
      { ...date, title: "same", publicId: "b" },
    ),
  ).toBeLessThan(0);
});
it.each([
  ["concert", "music"],
  ["festival", "music"],
  ["football", "trophy"],
  ["thon", "users"],
  ["homecoming", "calendar"],
])("maps documented external type %s", (category, icon) =>
  expect(eventIconType({ externalEvent: { category } })).toBe(icon),
);
it.each([
  ["career-networking", "briefcase"],
  ["technical-workshop", "tools"],
  ["competition", "trophy"],
  ["general-body-meeting", "users"],
  ["social-recreational", "celebration"],
])("maps structured category %s", (eventType, icon) =>
  expect(eventIconType({ eventType })).toBe(icon),
);
it("uses exam icons and a neutral fallback without title inference", () => {
  expect(eventIconType({ kind: "exam" })).toBe("exam");
  expect(eventIconType({ kind: "exam-review" })).toBe("exam");
  expect(eventIconType({ title: "Football concert exam" })).toBe("calendar");
});

it("preserves a cross-month unknown-hour occurrence and its exclusive end", async () => {
  const { toExternalCalendarItem } = await import("./planner-events");
  const { externalEvents } =
    await import("../../data/fixtures/planning-context");
  const original = externalEvents.find((event) => !event.timeKnown)!;
  const item = toExternalCalendarItem({
    ...original,
    id: "invented-cross-month-review",
    dateWide: false,
    timeKnown: false,
    start: undefined,
    end: undefined,
    startDate: "2026-10-30",
    endDate: "2026-11-03",
  });
  expect(item).toMatchObject({
    id: "external:invented-cross-month-review",
    start: "2026-10-30",
    end: "2026-11-03",
    allDay: true,
    extendedProps: { listTimes: ["Time TBD"] },
  });
});
