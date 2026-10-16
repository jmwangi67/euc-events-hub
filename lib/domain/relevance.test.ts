import { describe, expect, it } from "vitest";
import { events, organizations } from "../../data/fixtures";
import { isEventRelevant } from "./relevance";
const byId = (id: string) => events.find((e) => e.id === id)!;
const relevant = (id: string, majorIds: string[]) =>
  isEventRelevant(byId(id), { mode: "recommended", majorIds }, organizations);
describe("intended major relevance", () => {
  it("includes college-wide programming", () =>
    expect(relevant("example-welcome", ["me"])).toBe(true));
  it("matches explicit audiences and excludes unrelated majors", () => {
    expect(relevant("example-process-lab", ["che"])).toBe(true);
    expect(relevant("example-process-lab", ["bme"])).toBe(false);
  });
  it("includes cross-major industry content despite the host discipline", () =>
    expect(relevant("example-industry", ["bme"])).toBe(true));
  it("inherits the documented host audience", () => {
    expect(relevant("example-design-meeting", ["bme"])).toBe(true);
    expect(relevant("example-design-meeting", ["che"])).toBe(false);
  });
  it("combines audiences across multiple hosts", () =>
    expect(
      isEventRelevant(
        {
          ...byId("example-design-meeting"),
          hostOrganizationIds: ["example-design", "example-process"],
        },
        { mode: "recommended", majorIds: ["che"] },
        organizations,
      ),
    ).toBe(true));
  it("matches any selected major", () =>
    expect(relevant("example-process-lab", ["me", "che"])).toBe(true));
  it("does not infer unclassified events from their hosts", () =>
    expect(relevant("example-open-topic", ["che"])).toBe(false));
  it("includes unclassified events in All Events", () =>
    expect(
      isEventRelevant(
        byId("example-open-topic"),
        { mode: "all" },
        organizations,
      ),
    ).toBe(true));
  it("keeps empty recommended selection distinct from All Events", () => {
    expect(relevant("example-design-meeting", [])).toBe(false);
    expect(relevant("example-welcome", [])).toBe(true);
  });
  it("handles missing inherited hosts without guessing", () =>
    expect(
      isEventRelevant(
        byId("example-design-meeting"),
        { mode: "recommended", majorIds: ["bme"] },
        [],
      ),
    ).toBe(false));
});
