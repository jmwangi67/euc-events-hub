"use client";
import { DetailsDialog } from "./details-dialog";
import { ACADEMIC_LEVELS } from "../../lib/domain/planning-audience";
import type {
  Event,
  Major,
  Organization,
  OrganizationCluster,
} from "../../lib/domain/models";
import { EVENT_CATEGORIES } from "../../lib/domain/event-categories";
import { sourceLabel, verificationLabel } from "../../lib/domain/source-labels";
import { formatEventTime } from "../../lib/time/eastern";

type Props = {
  event: Event;
  majors: Major[];
  organizations: Organization[];
  onClose: () => void;
  planningClusters?: OrganizationCluster[];
};
export function EventDetails({
  event,
  majors,
  organizations,
  onClose,
  planningClusters,
}: Props) {
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
          Example scenario — not a real or verified event. This is not an
          official Penn State schedule.
        </p>
      )}
      <p className="detail-time">{formatEventTime(event)}</p>
      <dl className="event-facts">
        <div>
          <dt>
            {hosts.length > 1 ? "Host organizations" : "Host organization"}
          </dt>
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
          </dd>
        </div>
        {event.audienceEligibility && (
          <div>
            <dt>Audience eligibility</dt>
            <dd>{event.audienceEligibility}</dd>
          </div>
        )}
        {(planningClusters || !!event.targetAcademicLevels?.length) && (
          <div>
            <dt>Academic-year audience</dt>
            <dd>
              {event.targetAcademicLevels?.length
                ? event.targetAcademicLevels
                    .map((level) => ACADEMIC_LEVELS[level])
                    .join(", ")
                : "No documented academic-year restriction."}
            </dd>
          </div>
        )}
        {planningClusters && (
          <>
            <div>
              <dt>Organization-cluster targeting</dt>
              <dd>
                {event.targetClusterIds?.length
                  ? event.targetClusterIds
                      .map(
                        (id) =>
                          planningClusters.find((cluster) => cluster.id === id)
                            ?.name ?? id,
                      )
                      .join(", ")
                  : "Unspecified; host membership does not imply event targeting."}
              </dd>
            </div>
          </>
        )}
        <div>
          <dt>Source</dt>
          <dd>
            {event.source.url ? (
              <a href={event.source.url} rel="noreferrer" target="_blank">
                {sourceLabel(event.source)} (opens a new tab)
              </a>
            ) : (
              sourceLabel(event.source)
            )}
            <span className="field-help">
              Verification: {verificationLabel(event.source.verification)}
            </span>
          </dd>
        </div>
        <div>
          <dt>Record status</dt>
          <dd>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            {event.source.verification === "synthetic" && (
              <span className="field-help">
                Example record status only; this demo has not published an
                actual event.
              </span>
            )}
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
