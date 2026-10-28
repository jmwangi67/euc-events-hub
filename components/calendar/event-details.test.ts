import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { events, majors, organizations } from "../../data/fixtures";
import { EventDetails } from "./event-details";

describe("source-backed event details", () => {
  it("shows category, academic audience, eligibility and available links", () => {
    const event = events.find((record) => record.id === "example-social")!;
    const html = renderToStaticMarkup(
      createElement(EventDetails, {
        event,
        majors,
        organizations,
        onClose: () => undefined,
      }),
    );
    expect(html).toContain("Social &amp; Recreational");
    expect(html).toContain("Academic-year audience");
    expect(html).toContain("First year, Second year, Third year");
    expect(html).toContain(event.audienceEligibility);
    expect(html).toContain(event.description);
    expect(html).toContain(event.registrationUrl);
    expect(html).toContain(event.virtualMeetingUrl);
    expect(html).toContain('target="_blank" rel="noreferrer"');
    expect(html).toContain("Demo data — not verified");
    expect(html).not.toContain("synthetic");
  });

  it("does not fabricate optional facts or a published status", () => {
    const event = events.find((record) => record.id === "example-open-topic")!;
    const html = renderToStaticMarkup(
      createElement(EventDetails, {
        event,
        majors,
        organizations,
        onClose: () => undefined,
      }),
    );
    expect(html).toContain("Location not provided");
    expect(html).toContain("No description has been provided.");
    expect(html).toContain("Tentative");
    expect(html).not.toContain("Status: published");
    expect(html).not.toContain("Registration information");
    expect(html).not.toContain("Open virtual meeting");
    expect(html).not.toContain("Academic-year audience");
  });
});
