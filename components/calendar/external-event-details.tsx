import type { ExternalEvent } from "../../lib/domain/external-events";
import { EXTERNAL_CATEGORIES } from "../../lib/domain/external-events";
import { DetailsDialog } from "./details-dialog";
import { EventTypeIcon } from "./event-type-icon";
import {
  externalScopeLabel,
  sourceLabel,
  verificationLabel,
} from "../../lib/domain/source-labels";
import {
  formatAllDayDate,
  addCalendarDays,
  formatEventTime,
} from "../../lib/time/eastern";
import { externalTimingLabel } from "./planner-events";
export function ExternalEventDetails({
  event,
  triggerId,
  onClose,
}: {
  event: ExternalEvent;
  triggerId: string;
  onClose: () => void;
}) {
  return (
    <DetailsDialog
      triggerId={triggerId}
      title={event.title}
      titleId="external-event-title"
      label="External event details"
      onClose={onClose}
    >
      <p className="example-note">
        Fictional demonstration scenario, not a real or independently verified
        schedule.
      </p>
      <p>
        <EventTypeIcon props={{ externalEvent: event }} large />
        {EXTERNAL_CATEGORIES[event.category]} ·{" "}
        {externalScopeLabel(event.scope)}
      </p>
      <dl className="event-facts">
        <div>
          <dt>Date and time</dt>
          <dd>
            {event.timeKnown
              ? formatEventTime({
                  allDay: false,
                  start: event.start,
                  end: event.end,
                })
              : `${formatAllDayDate(event.startDate)} – ${formatAllDayDate(addCalendarDays(event.endDate, -1))}`}
          </dd>
        </div>
        <div>
          <dt>Time precision</dt>
          <dd>
            {externalTimingLabel(event)}
            {!event.timeKnown &&
              (event.dateWide
                ? " — Date-wide commitment; individual hours are not supplied. This does not establish continuous 24-hour attendance."
                : " — Time unknown; no hours or all-day attendance are assumed.")}
          </dd>
        </div>
        <div>
          <dt>Applicability</dt>
          <dd>
            {event.audience}
            <br />
            {event.analysisReason}
          </dd>
        </div>
        <div>
          <dt>Location / geography</dt>
          <dd>{event.geography}</dd>
        </div>
        <div>
          <dt>Scheduling explanation</dt>
          <dd>
            {event.analysis === "context-only"
              ? "Context only; excluded from analytical scheduling density."
              : "Eligibility follows documented scope and audience; participation is not guaranteed."}{" "}
            {event.policyRationale}
          </dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>
            {sourceLabel(event.source)} ·{" "}
            {verificationLabel(event.source.verification)}
            {event.source.url && (
              <>
                <br />
                <a href={event.source.url} target="_blank" rel="noreferrer">
                  Source (new tab)
                </a>
              </>
            )}
          </dd>
        </div>
      </dl>
    </DetailsDialog>
  );
}
