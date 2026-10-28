import { describe, expect, it } from "vitest";
import { events } from "../../data/fixtures";
import { externalEvents } from "../../data/fixtures/planning-context";
import {
  analyzeNonExamScheduling,
  policySourceWindow,
} from "../domain/non-exam-scheduling";
import {
  externalEventSchema,
  type ExternalEvent,
} from "../domain/external-events";
import type { Event } from "../domain/models";
import { resolveEasternLocal } from "../time/eastern-local";
import { addCalendarDays, easternDayStart } from "../time/eastern";
import { getEvents } from "./fixtures";
import {
  getExternalEvents,
  getNonExamAnalysisRecords,
} from "./weekly-planning";

const window = { start: "2026-10-24", end: "2026-10-25" };
const exactRange = {
  start: easternDayStart(window.start),
  end: easternDayStart(window.end),
};
const audience = { majorIds: ["bme"], academicLevels: ["first"] as const };
const at = (date: string, clock: string) => resolveEasternLocal(date, clock);
function engineering(date: string, major = "bme"): Event {
  return {
    ...events[0],
    id: "same-event",
    title: "Example disputed engineering event",
    allDay: false,
    start: at(date, "10:00"),
    end: at(date, "11:00"),
    targeting: "explicit",
    targetMajorIds: [major],
    collegeWide: false,
    status: "published",
  };
}
function external(date: string, major = "bme"): ExternalEvent {
  return externalEventSchema.parse({
    ...externalEvents.find((event) => event.category === "concert")!,
    id: "same-external",
    title: "Example disputed Local event",
    timeKnown: true,
    start: at(date, "19:00"),
    end: at(date, "22:00"),
    startDate: date,
    endDate: addCalendarDays(date, 1),
    analysis: "audience-targeted",
    analysisReason: "Explicit fictional audience mapping.",
    targetMajorIds: [major],
  });
}

describe("complete non-exam identities for analytical queries", () => {
  it("preserves range-only public results while analysis retains all published source alternatives", () => {
    const current = engineering("2026-10-24");
    const later = engineering("2026-10-28", "che");
    const draft = { ...later, status: "draft" as const };
    const fixtures = [current, later, draft];
    expect(getEvents(window, fixtures)).toEqual([current]);
    const analysis = getEvents(
      { ...window, includeIdentityAlternatives: true },
      fixtures,
    );
    expect(analysis).toEqual([current, later]);
    analysis[0].title = "Detached mutation";
    expect(fixtures[0].title).toBe(current.title);
    expect(getEvents(window, fixtures)).toEqual([current]);
  });
  it("retains complete timing/audience identity before non-exam density and relevance analysis", () => {
    const fixtures = [
      engineering("2026-10-24"),
      engineering("2026-10-28", "che"),
    ];
    const queried = getEvents(
      { ...window, includeIdentityAlternatives: true },
      fixtures,
    );
    const result = analyzeNonExamScheduling(
      { events: queried, externalEvents: [], organizations: [] },
      audience,
      exactRange,
    );
    expect(result.constraints).toHaveLength(1);
    expect(result.constraints[0].timing).toBe("source-conflict");
    expect(result.constraints[0].alternatives).toHaveLength(2);
    expect(result.days[0].maximumConcurrent).toBe(0);
    const negative = analyzeNonExamScheduling(
      { events: queried, externalEvents: [], organizations: [] },
      { ...audience, majorIds: ["che"] },
      exactRange,
    );
    expect(negative.constraints).toEqual([]);
  });
  it("does not expand unmatched identities or expose unpublished-only records", () => {
    const fixtures = [
      engineering("2026-10-28"),
      { ...engineering("2026-10-24"), status: "tentative" as const },
    ];
    expect(
      getEvents({ ...window, includeIdentityAlternatives: true }, fixtures),
    ).toEqual([]);
  });
  it("keeps external display ranges unchanged while analytical queries preserve remote alternatives", () => {
    const first = external("2026-10-24");
    const other = external("2026-10-28", "che");
    const fixtures = [first, other];
    expect(getExternalEvents(window, fixtures)).toEqual([first]);
    const analysis = getExternalEvents(
      { ...window, includeIdentityAlternatives: true },
      fixtures,
    );
    expect(analysis).toEqual(fixtures);
    analysis[0].title = "Detached external mutation";
    expect(fixtures[0].title).toBe(first.title);
    const result = analyzeNonExamScheduling(
      {
        events: [],
        externalEvents: getExternalEvents(
          { ...window, includeIdentityAlternatives: true },
          fixtures,
        ),
        organizations: [],
      },
      audience,
      exactRange,
    );
    expect(result.constraints[0].timing).toBe("source-conflict");
    expect(result.constraints[0].alternatives).toHaveLength(2);
    expect(result.days[0].maximumConcurrent).toBe(0);
  });
  it("uses policy lookaround to gate identities, then retains all alternatives for uncertainty", () => {
    const first = externalEventSchema.parse({
      ...external("2026-10-24"),
      id: "thon-policy",
      title: "Example disputed THON",
      category: "thon",
      scope: "psu-wide",
      analysis: "broad-context",
      timeKnown: false,
      start: undefined,
      end: undefined,
      startDate: "2026-10-30",
      endDate: "2026-10-31",
    });
    const remote = externalEventSchema.parse({
      ...first,
      startDate: "2026-12-01",
      endDate: "2026-12-02",
    });
    const fixtures = [first, remote];
    expect(getExternalEvents(window, fixtures)).toEqual([]);
    const queried = getExternalEvents(
      { ...policySourceWindow(window), includeIdentityAlternatives: true },
      fixtures,
    );
    expect(queried).toEqual(fixtures);
    const result = analyzeNonExamScheduling(
      { events: [], externalEvents: queried, organizations: [] },
      audience,
      exactRange,
    );
    expect(result.constraints[0].timing).toBe("source-conflict");
    expect(result.constraints[0].alternatives).toHaveLength(2);
    expect(result.days[0].maximumConcurrent).toBe(0);
  });
  it("does not expand external IDs whose source windows never match", () => {
    expect(
      getExternalEvents({ ...window, includeIdentityAlternatives: true }, [
        external("2026-10-28"),
      ]),
    ).toEqual([]);
  });
  it("retains same-ID remote source alternatives across engineering and external collections", () => {
    const event = engineering("2026-10-24");
    const remote = { ...external("2026-10-28", "che"), id: event.id };
    const records = getNonExamAnalysisRecords(window, [event], [remote]);
    expect(records.events).toEqual([event]);
    expect(records.externalEvents).toEqual([remote]);
    const result = analyzeNonExamScheduling(
      { ...records, organizations: [] },
      audience,
      exactRange,
    );
    expect(result.constraints[0].timing).toBe("source-conflict");
    expect(result.constraints[0].alternatives).toHaveLength(2);
    expect(result.days[0].maximumConcurrent).toBe(0);
    expect(getEvents(window, [event])).toEqual([event]);
    expect(getExternalEvents(window, [remote])).toEqual([]);
  });
  it("expands an external matched ID to published engineering alternatives, not draft or unrelated identities", () => {
    const externalRecord = external("2026-10-24");
    const alternative = { ...engineering("2026-10-28"), id: externalRecord.id };
    const draft = { ...alternative, status: "draft" as const };
    const unrelated = { ...alternative, id: "other" };
    expect(
      getNonExamAnalysisRecords(
        window,
        [alternative, draft, unrelated],
        [externalRecord],
      ),
    ).toEqual({ events: [alternative], externalEvents: [externalRecord] });
  });
  it("keeps exclusive-end behavior for analytical source matching and validates query windows", () => {
    const first = {
      ...engineering("2026-10-23"),
      start: at("2026-10-23", "23:00"),
      end: at("2026-10-24", "00:00"),
    };
    expect(
      getEvents({ ...window, includeIdentityAlternatives: true }, [first]),
    ).toEqual([]);
    expect(() =>
      getExternalEvents({ start: window.end, end: window.start }, []),
    ).toThrow();
  });
});
