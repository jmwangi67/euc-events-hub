import type { CalendarView } from "./calendar-state";
import { calendarWeeks } from "./weekly-planning";
import { addCalendarDays } from "../time/eastern";
export type PlannerCalendarView = CalendarView | "dayGridTwoWeeks";
export const PLANNER_VIEWS: [PlannerCalendarView, string][] = [
  ["dayGridMonth", "Month"],
  ["dayGridTwoWeeks", "2 Weeks"],
  ["timeGridWeek", "1 Week"],
  ["timeGridDay", "Day"],
  ["listMonth", "List"],
];
export function plannerTwoWeekRange(date: string) {
  const start = calendarWeeks(date, addCalendarDays(date, 1))[0].start;
  return { start, end: addCalendarDays(start, 14) };
}
