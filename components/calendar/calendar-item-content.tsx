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
}) {
  if (
    info.event.extendedProps.kind === "external" &&
    info.view.type.startsWith("dayGrid") &&
    info.event.extendedProps.externalEvent.scope !== "campus-local"
  )
    return (
      <span className="external-indicator">
        <span aria-hidden="true">◆</span>{" "}
        {info.event.title.replace(/^Synthetic /, "")}
        <span className="sr-only">
          {" "}
          · Synthetic scenario · See weekly summary
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
      ? `Academic exam${!info.event.extendedProps.exam.relevantMajorIds.length ? " · Audience unknown" : ""} · ${info.event.extendedProps.exam.source.verification}`
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
      <span className="event-title">
        {info.event.title.replace(/^Synthetic example: /, "")}
      </span>
      <span className="event-category">
        {categoryLabel}
        {!info.event.extendedProps.kind && " · Example"}
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
          <span className="event-title">
            {info.event.title.replace(/^Synthetic example: /, "")}
          </span>
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
