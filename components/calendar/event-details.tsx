"use client";
import { useEffect, useRef } from "react";
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
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
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
  useEffect(() => {
    const element = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    element.showModal();
    heading.current?.focus();
    return () => {
      element.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="event-dialog"
      aria-labelledby="event-detail-title"
      aria-describedby={
        event.source.verification === "synthetic"
          ? "event-example-note"
          : undefined
      }
      onKeyDown={(key) => {
        if (key.key !== "Tab") return;
        const controls = Array.from(
          key.currentTarget.querySelectorAll<HTMLElement>(
            "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
          ),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) return;
        if (!controls.includes(document.activeElement as HTMLElement)) {
          key.preventDefault();
          (key.shiftKey ? last : first).focus();
        } else if (key.shiftKey && document.activeElement === first) {
          key.preventDefault();
          last.focus();
        } else if (!key.shiftKey && document.activeElement === last) {
          key.preventDefault();
          first.focus();
        }
      }}
      onClose={onClose}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const box = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < box.left ||
          e.clientX > box.right ||
          e.clientY < box.top ||
          e.clientY > box.bottom
        )
          e.currentTarget.close();
      }}
    >
      <div className="dialog-top">
        <span className="eyebrow">Event details</span>
        <button
          className="control"
          onClick={() => dialog.current?.close()}
          aria-label="Close event details"
        >
          Close ×
        </button>
      </div>
      <h2 id="event-detail-title" ref={heading} tabIndex={-1}>
        {event.title}
      </h2>
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
    </dialog>
  );
}
