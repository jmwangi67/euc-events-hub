type OrderedEvent = {
  start: Date | number;
  end: Date | number | null;
  allDay: boolean;
  title: string;
  id?: string;
  publicId?: string;
};
/** Date-wide multi-day spans first, single-date untimed items second, clocks last.
 * Within each group: start, longer duration, title, stable ID. Strict ordering
 * prevents FullCalendar's space compaction from promoting shorter segments. */
export function plannerEventOrder(first: unknown, second: unknown) {
  // FullCalendar supplies normalized segment comparison objects, not EventApi.
  const a = first as OrderedEvent,
    b = second as OrderedEvent;
  const span = (e: OrderedEvent) =>
    e.end
      ? Date.parse(new Date(+e.end).toISOString().slice(0, 10)) -
        Date.parse(new Date(+e.start).toISOString().slice(0, 10))
      : 0;
  const rank = (e: OrderedEvent) =>
    e.allDay ? (span(e) > 86400000 ? 0 : 1) : 2;
  return (
    rank(a) - rank(b) ||
    +a.start - +b.start ||
    +(b.end ?? b.start) - +b.start - (+(a.end ?? a.start) - +a.start) ||
    a.title.localeCompare(b.title) ||
    (a.publicId ?? a.id ?? "").localeCompare(b.publicId ?? b.id ?? "")
  );
}
export function eventIconType(props: Record<string, unknown>) {
  if (props.kind === "exam" || props.kind === "exam-review") return "exam";
  const external = props.externalEvent as { category?: string } | undefined;
  const type = external?.category ?? props.eventType;
  const icons: Record<string, string> = {
    concert: "music",
    festival: "music",
    football: "trophy",
    "super-bowl": "trophy",
    "career-networking": "briefcase",
    "technical-workshop": "tools",
    competition: "trophy",
    "general-body-meeting": "users",
    "social-recreational": "celebration",
    homecoming: "calendar",
    thon: "users",
  };
  return typeof type === "string" ? (icons[type] ?? "calendar") : "calendar";
}
