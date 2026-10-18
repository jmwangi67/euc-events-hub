import type { EventApi, EventContentArg } from "@fullcalendar/core";
import {
  externalScopeLabel,
  verificationLabel,
} from "../../lib/domain/source-labels";
const compactTitle = (title: string) =>
  title.replace(/^(?:Synthetic example: |Example Event: )/, "");
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
}) {
  if (info.event.extendedProps.kind === "density") return null;
  if (
    info.event.extendedProps.kind === "external" &&
    info.view.type.startsWith("dayGrid")
  )
    return (
      <span className="external-indicator">
        <span aria-hidden="true">◆</span>{" "}
        {info.event.title.replace(/^(?:Synthetic |Example )/, "")}
        <span className="event-scope-label">
          {externalScopeLabel(info.event.extendedProps.externalEvent.scope)} ·
          Example Event
        </span>
        <span className="sr-only">
          {" "}
          · {info.event.extendedProps.timeLabel} · See weekly summary
        </span>
      </span>
    );
  const cardTimes = (info.event.extendedProps.listTimes as string[]).map(
    (label) =>
      label === "Next day" && !info.isStart ? "From prev day" : label,
  );
  const categoryLabel =
    info.event.extendedProps.kind === "exam" &&
    info.view.type.startsWith("dayGrid")
      ? `Academic Exam${!info.event.extendedProps.exam.relevantMajorIds.length ? " · Audience unknown" : ""} · ${verificationLabel(info.event.extendedProps.exam.source.verification)}`
      : info.event.extendedProps.category;
  const content = (
    <span className="calendar-event-content">
      <span className="event-time">
        {cardTimes.map((part, index) => (
          <span className="time-part" key={index}>
            {part}
          </span>
        ))}
      </span>
      <span className="event-title">{compactTitle(info.event.title)}</span>
      <span className="event-category">
        {categoryLabel}
        {!info.event.extendedProps.kind && " · Engineering · Example Event"}
      </span>
    </span>
  );
  return info.view.type.startsWith("list") ? (
    <button
      type="button"
      className={`list-event-trigger ${mobile ? "mobile-list-event" : ""}`}
      data-calendar-event-id={info.event.id}
      aria-label={itemLabel(info.event)}
      onClick={(click) => {
        click.stopPropagation();
        selectItem(info.event);
      }}
    >
      {mobile ? (
        <span className="mobile-list-content">
          <span className="event-title">{compactTitle(info.event.title)}</span>
          <span className="list-event-times" aria-hidden="true">
            {cardTimes.map((part, index) => {
              const isNote = /Next day|From prev day|^\+\d+ days$/.test(part);
              return (
                <span
                  className={`time-part ${isNote ? "time-note" : ""}`}
                  key={index}
                >
                  {isNote ? `(${part})` : part}
                </span>
              );
            })}
          </span>
          <span className="event-category">
            {info.event.extendedProps.category}
            {!info.event.extendedProps.kind && " · Engineering · Example Event"}
            {info.event.extendedProps.hosts &&
              ` · ${info.event.extendedProps.hosts}`}
          </span>
        </span>
      ) : (
        <>
          <span className="list-event-times" aria-hidden="true">
            {cardTimes.map((time, index) => (
              <span key={time + index}>
                <span className="time-part">{time}</span>
              </span>
            ))}
          </span>
          {content}
        </>
      )}
    </button>
  ) : (
    content
  );
}
