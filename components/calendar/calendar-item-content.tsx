import { EventTypeIcon } from "./event-type-icon";
import { HostingBadge } from "./hosting-badge";
import { externalScopeLabel } from "../../lib/domain/source-labels";
import type { EventApi, EventContentArg } from "@fullcalendar/core";
export function CalendarItemContent({
  info,
  mobile,
  itemLabel,
  selectItem,
}: {
  info: EventContentArg;
  mobile: boolean;
  itemLabel: (event: EventApi) => string;
  selectItem: (event: EventApi) => void;
  planner: boolean;
}) {
  const p = info.event.extendedProps;
  if (p.kind === "density") return null;
  const grid = info.view.type.startsWith("dayGrid");
  const external = p.kind === "external" ? p.externalEvent : null;
  const times = p.segmentTime
    ? [p.segmentTime, p.segmentNote]
    : (p.listTimes as string[]).map((label) =>
        label === "Next day" && !info.isStart ? "From prev day" : label,
      );
  const identity = external ? externalScopeLabel(external.scope) : null;
  const clocks = (
    <>
      {times.filter(Boolean).map((part: string, i: number) => (
        <span
          className={`time-part ${i === 0 ? "clock-range" : "time-note"}`}
          key={i}
        >
          {part}
        </span>
      ))}
    </>
  );
  const hosts = !p.kind && (
    <span className="host-identity">
      <HostingBadge identity={p.hostingIdentity} />
      {p.hosts && (
        <span className="event-hosts">
          <span className="hosts-full">{p.hosts}</span>
          <span className="hosts-compact" aria-hidden="true">
            {p.compactHosts}
          </span>
        </span>
      )}
    </span>
  );
  const title = (
    <span className="event-title">
      <span className="event-title-icon">
        <EventTypeIcon props={p} large={!grid} />
      </span>
      <span className="event-title-text">{info.event.title}</span>
    </span>
  );
  const content = (
    <span
      className={`calendar-event-content ${grid && p.compactGrid ? "compact-card" : ""} ${mobile ? "mobile-list-content" : ""}`}
    >
      {mobile ? title : null}
      {!(grid && external?.dateWide && !external.timeKnown) && (
        <span
          className={
            info.view.type.startsWith("list")
              ? "list-event-times"
              : "event-time"
          }
        >
          {clocks}
        </span>
      )}
      {!mobile ? title : null}
      {identity && <span className="compact-identity">{identity}</span>}
      <span className="event-category">
        {p.category}
        {!p.kind && " · Example Event"}
      </span>
      {hosts}
      {p.reviewDates && <span className="event-location">{p.reviewDates}</span>}
      {p.location && <span className="event-location">{p.location}</span>}
    </span>
  );
  return info.view.type.startsWith("list") ? (
    <button
      type="button"
      className={`list-event-trigger ${mobile ? "mobile-list-event" : ""}`}
      data-calendar-event-id={info.event.id}
      data-canonical-event-id={p.canonicalEventId ?? info.event.id}
      aria-label={itemLabel(info.event)}
      onClick={(e) => {
        e.stopPropagation();
        selectItem(info.event);
      }}
    >
      {content}
    </button>
  ) : (
    content
  );
}
