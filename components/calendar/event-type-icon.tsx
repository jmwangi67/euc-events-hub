import { eventIconType } from "./planner-presentation";
const paths: Record<string, string> = {
  exam: "m2 9 10-5 10 5-10 5L2 9m4 2v6q6 5 12 0v-6m4-2v8",
  music: "M9 18V5l11-2v13M9 6l11-2M9 18a3 3 0 1 1-3-3h3m11 1a3 3 0 1 1-3-3h3",
  trophy:
    "M7 3h10v6a5 5 0 0 1-10 0V3m0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 2v6m-5 1h10",
  briefcase: "M3 7h18v14H3V7m5 0V3h8v4M3 12q9 5 18 0m-9 0v4",
  tools: "m14 6 4 4-9 10-5-5L14 6m0 0V2l4 3 4 1-4 4",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-3a4 4 0 0 0-3-4M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0m4-4a4 4 0 0 1 0 8",
  celebration: "m3 21 5-14 9 9-14 5m9-17 2-2m3 9 4-1M15 6l3 2 3-3",
  calendar: "M3 5h18v16H3V5m4-3v6m10-6v6M3 11h18",
};
export function EventTypeIcon({ props }: { props: Record<string, unknown> }) {
  const type = eventIconType(props);
  return (
    <svg
      className="event-type-icon"
      data-event-icon={type}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[type]} />
    </svg>
  );
}
