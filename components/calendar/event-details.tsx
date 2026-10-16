"use client";
import { DetailsDialog } from "./details-dialog";
import type { Event, Major, Organization } from "../../lib/domain/models";
import { EVENT_CATEGORIES } from "../../lib/domain/event-categories";
import { formatEventTime } from "../../lib/time/eastern";

type Props = {
  event: Event;
  majors: Major[];
  organizations: Organization[];
  onClose: () => void;
};
export function EventDetails({ event, majors, organizations, onClose }: Props) {
  const hosts = organizations.filter((org) =>
    event.hostOrganizationIds.includes(org.id),
  );
  const audienceIds =
    event.targeting === "explicit"
      ? event.targetMajorIds
      : event.targeting === "inherited"
        ? hosts.flatMap((host) => host.defaultMajorIds)
        : [];
  const audience = event.collegeWide
    ? "All engineering majors"
    : event.targeting === "unclassified"
      ? "Audience not yet classified"
      : majors
          .filter((major) => audienceIds.includes(major.id))
          .map((major) => major.name)
          .join(", ") || "Audience not provided";
  return (
    <DetailsDialog
      triggerId={event.id}
      title={event.title}
      titleId="event-detail-title"
      label="Event details"
      describedBy={
        event.source.verification === "synthetic"
          ? "event-example-note"
          : undefined
      }
      onClose={onClose}
    >
      {event.source.verification === "synthetic" && (
        <p className="example-note" id="event-example-note">
          Fictional development example. This is not an official Penn State
          event.
        </p>
      )}
      <p className="detail-time">{formatEventTime(event)}</p>
      <dl className="event-facts">
        <div>
          <dt>Host organization</dt>
          <dd>
            {hosts.map((host) => host.name).join(", ") ||
              "Host details not provided"}
          </dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{EVENT_CATEGORIES[event.category]}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>
            {event.location ||
              (event.virtualMeetingUrl
                ? "Virtual event"
                : "Location not provided")}
          </dd>
        </div>
        <div>
          <dt>Target audience</dt>
          <dd>
            {audience}
            {event.targeting === "inherited" && !event.collegeWide && (
              <span className="field-help">
                Inferred from the host organizations’ documented audience.
              </span>
            )}
            {event.audienceEligibility && <p>{event.audienceEligibility}</p>}
          </dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>
            {event.source.url ? (
              <a href={event.source.url} rel="noreferrer" target="_blank">
                {event.source.label} (opens a new tab)
              </a>
            ) : (
              event.source.label
            )}
            <span className="field-help">
              Verification: {event.source.verification} · Status: published
            </span>
          </dd>
        </div>
      </dl>
      <h3>About this event</h3>
      <p className="detail-description">
        {event.description || "No description has been provided."}
      </p>
      {event.virtualMeetingUrl && (
        <p>
          <a href={event.virtualMeetingUrl} target="_blank" rel="noreferrer">
            Open virtual meeting (new tab)
          </a>
        </p>
      )}
      {event.registrationUrl && (
        <p>
          <a
            className="primary-link"
            href={event.registrationUrl}
            target="_blank"
            rel="noreferrer"
          >
            Registration information (opens a new tab)
          </a>
        </p>
      )}
    </DetailsDialog>
  );
}
