import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  readCalendar,
  readEvent,
  readPlanningContext,
  loadReferenceData,
} from "./queries";
import { queryResponse } from "./http";
import {
  getEvents,
  getEventById,
  getExams,
  getMajors,
  getOrganizations,
} from "../../data/fixtures";
import {
  getWeeklyPlanningContext,
  getExternalEvents,
  getOrganizationClusters,
} from "../../data/weekly-planning";
import { getProposalIntelligenceContext } from "../../data/planner";
import { calendarQuerySchema, planningQuerySchema } from "../../data/contracts";
import { analyzePlanningProposal } from "../../domain/proposal-analysis";

const window = { start: "2026-10-19", end: "2026-10-28" };
describe("async fixture boundary parity", () => {
  it("returns the complete detached reference registry including empty-safe arrays", async () => {
    expect(await loadReferenceData()).toEqual({
      majors: getMajors(),
      organizations: getOrganizations(),
      clusters: getOrganizationClusters(),
    });
  });
  it.each([
    {},
    { audience: { mode: "recommended" as const, majorIds: ["bme", "che"] } },
    {
      organizationIds: ["example-process"],
      categories: ["career-networking" as const],
    },
    { clusterIds: ["engineering-design"], search: "workshop" },
    { universityOnly: true },
  ])("preserves public discovery %j", async (filters) => {
    const result = await readCalendar({ window, filters });
    expect(result.events).toEqual(getEvents({ ...window, filters }));
    expect(result.exams).toEqual([]);
    expect(result.externalEvents).toEqual([]);
  });
  it.each(["example-welcome", "example-open-topic", "unknown"])(
    "matches published-only lookup %s",
    async (id) => {
      expect(await readEvent({ id })).toEqual({
        event: getEventById(id) ?? null,
      });
    },
  );
  it("planner display queries ignore discovery restrictions and retain range-only overlays", async () => {
    expect(
      await readCalendar({
        window,
        planning: true,
        filters: { search: "not a match" },
      }),
    ).toEqual({
      events: getEvents(window),
      exams: getExams(window),
      externalEvents: getExternalEvents(window),
      organizations: getOrganizations(),
    });
  });
  it.each([
    window,
    { start: "2026-10-24", end: "2026-10-25" },
    { start: "2026-03-08", end: "2026-03-09" },
    { start: "2026-11-01", end: "2026-11-02" },
  ])(
    "preserves complete weekly windows/lookaround/lookahead %j",
    async (window) => {
      expect(await readPlanningContext({ kind: "weekly", window })).toEqual(
        getWeeklyPlanningContext(window),
      );
    },
  );
  it("preserves exact overnight proposal intelligence and numerical results", async () => {
    const proposal = {
      title: "Invented overnight",
      start: "2026-10-24T23:00:00-04:00",
      end: "2026-10-25T00:00:00-04:00",
      majorIds: ["bme", "che"],
    };
    const expected = {
      ...getProposalIntelligenceContext(proposal),
      organizations: getOrganizations(),
    };
    const actual = await readPlanningContext({
      kind: "proposal",
      range: { start: proposal.start, end: proposal.end },
    });
    expect(actual).toEqual(expected);
    expect(analyzePlanningProposal(proposal, actual)).toEqual(
      analyzePlanningProposal(proposal, expected),
    );
  });
});
describe("read-only request validation", () => {
  const request = (body: unknown) =>
    new Request("http://localhost/api/data/calendar", {
      method: "POST",
      body: JSON.stringify(body),
    });
  it.each([
    {},
    { window: { start: "bad", end: "2026-10-20" } },
    { window: { start: "2026-10-20", end: "2026-10-19" } },
    { window, path: "data/local/exams/private.json" },
    { window, filters: { includeDrafts: true } },
  ])("rejects invalid/unknown inputs %j", async (input) => {
    expect(
      (await queryResponse(request(input), calendarQuerySchema, readCalendar))
        .status,
    ).toBe(400);
  });
  it("rejects malformed JSON", async () => {
    expect(
      (
        await queryResponse(
          new Request("http://localhost", { method: "POST", body: "{" }),
          calendarQuerySchema,
          readCalendar,
        )
      ).status,
    ).toBe(400);
  });
  it("forbids display filters and private dataset selection on analysis requests", () => {
    expect(
      planningQuerySchema.safeParse({ kind: "weekly", window, filters: {} })
        .success,
    ).toBe(false);
    expect(
      planningQuerySchema.safeParse({
        kind: "weekly",
        window,
        datasetPath: "private",
      }).success,
    ).toBe(false);
  });
  it("rejects oversized weekly expansion instead of truncating analytical records", () => {
    expect(
      planningQuerySchema.safeParse({
        kind: "weekly",
        window: { start: "0001-01-01", end: "9999-12-31" },
      }).success,
    ).toBe(false);
  });
  it("returns uncached data and sanitizes internal failures", async () => {
    const ok = await queryResponse(
      request({ window }),
      calendarQuerySchema,
      readCalendar,
    );
    expect(ok.headers.get("cache-control")).toBe("no-store");
    expect((await ok.json()).events).toEqual(getEvents(window));
    const failed = await queryResponse(
      request({ window }),
      calendarQuerySchema,
      async () => {
        throw new Error("PRIVATE_SOURCE_MARKER");
      },
    );
    expect(failed.status).toBe(500);
    expect(await failed.text()).not.toContain("PRIVATE_SOURCE_MARKER");
  });
});
