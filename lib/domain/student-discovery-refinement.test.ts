import { describe, expect, it } from "vitest";
import { events, organizations } from "../../data/fixtures";
import { getEvents } from "../data/fixtures";
import { registeredHosts } from "../../data/fixtures/hosts";
import { eventCategorySchema, eventSchema } from "./models";
import {
  departmentHosted,
  eventHosts,
  hostNames,
  hostingIdentity,
  studentOrganizations,
} from "./hosting";
import {
  clearDiscoveryFilters,
  discoveryFilters,
  parseCalendarState,
  serializeCalendarState,
} from "./calendar-state";
import {
  getOrganizationClusters,
  getWeeklyPlanningContext,
} from "../data/weekly-planning";
import { analyzeNonExamScheduling } from "./non-exam-scheduling";
import { analyzePlanningProposal } from "./proposal-analysis";
import { plannerControlCount } from "./planner-control-summary";
import { ALL_LEVELS } from "./planning-audience";
const base = events.find((event) => event.id === "example-industry")!;
const registryOptions = {
  majorIds: ["bme", "che", "me"],
  organizationIds: studentOrganizations(organizations).map((org) => org.id),
  clusterIds: getOrganizationClusters().map((cluster) => cluster.id),
};
const parse = (query: string) =>
  parseCalendarState(new URLSearchParams(query), "2026-10-19", registryOptions);
const find = (query: string) =>
  getEvents({
    start: "2026-10-19",
    end: "2026-10-28",
    filters: discoveryFilters(parse(query)),
  }).map((event) => event.id);

describe("six-category migration and subtype integrity", () => {
  it("has exactly six public categories and retains every preexisting fixture ID", () => {
    expect(eventCategorySchema.options).toHaveLength(6);
    for (const id of [
      "example-welcome",
      "example-process-lab",
      "example-industry",
      "example-design-meeting",
      "example-open-topic",
      "example-design-days",
      "example-night-build",
      "example-open-studio",
      "example-gbm",
      "example-social",
      "example-visual-all-day",
      "example-visual-panel",
      "example-visual-workshop",
      "example-visual-night",
    ])
      expect(events.some((event) => event.id === id)).toBe(true);
  });
  it.each(["corporate-recruiting", "career-fair", "networking"])(
    "migrates %s without losing its subtype, source or timestamps",
    (subtype) => {
      const record = eventSchema.parse({
        ...base,
        category: subtype,
        subtype: undefined,
      });
      expect(record.category).toBe("career-networking");
      expect(record.subtype).toBe(subtype);
      expect(record.legacyCategory).toBe(subtype);
      expect(record.source).toEqual(base.source);
      expect([record.id, record.start, record.end]).toEqual([
        base.id,
        base.start,
        base.end,
      ]);
    },
  );
  it.each(["research", "student-organization"])(
    "retains ambiguous %s as a source-backed unresolved record",
    (category) => {
      const record = eventSchema.parse({
        ...base,
        category,
        subtype: undefined,
      });
      expect(record.category).toBeNull();
      expect(record.legacyCategory).toBe(category);
      expect(record.categoryMappingNote).toContain("requires review");
      expect(
        getEvents({ start: "2026-10-21", end: "2026-10-22" }, [record]),
      ).toEqual([record]);
    },
  );
  it("requires reconciliation when a legacy career fair claims a contradictory subtype", () => {
    expect(
      eventSchema.safeParse({
        ...base,
        category: "career-fair",
        subtype: "networking",
      }).success,
    ).toBe(false);
  });
  it("makes purpose-aware fixture decisions explicit, including educational research", () => {
    expect(
      events.find((event) => event.id === "example-welcome")?.category,
    ).toBe("social-recreational");
    expect(
      events.find((event) => event.id === "example-design-meeting")?.category,
    ).toBe("general-body-meeting");
    expect(
      events.find((event) => event.id === "example-night-build")?.category,
    ).toBe("technical-workshop");
    expect(
      events.find((event) => event.id === "discovery-matse"),
    ).toMatchObject({
      category: "technical-workshop",
      subtype: "research-seminar",
      legacyCategory: "research",
    });
    expect(
      eventSchema.safeParse({
        ...base,
        category: "competition",
        subtype: "career-fair",
      }).success,
    ).toBe(false);
  });
  it("retains fair midnight-to-exact-finish behavior after migration, independently of its title", () => {
    const fair = eventSchema.parse({
      ...base,
      category: "career-fair",
      subtype: undefined,
      title: "A renamed gathering",
      start: "2026-10-21T13:00:00-04:00",
      end: "2026-10-21T16:00:00-04:00",
    });
    const analyze = (event: typeof fair) =>
      analyzeNonExamScheduling(
        { events: [event], organizations, externalEvents: [] },
        { majorIds: ["bme"] },
        { start: "2026-10-21T04:00:00Z", end: "2026-10-22T04:00:00Z" },
      );
    expect(analyze(fair).constraints[0].windows[0]).toMatchObject({
      start: "2026-10-21T04:00:00.000Z",
      end: "2026-10-21T20:00:00.000Z",
      kind: "policy",
    });
    expect(
      analyze({ ...fair, subtype: "networking" }).constraints[0].windows[0]
        .start,
    ).toBe("2026-10-21T17:00:00.000Z");
    expect(analyze(fair).timeSegments.at(-1)?.maximumConcurrent).toBe(0);
  });
});

describe("structured hosting, not inferred institutional identity", () => {
  it.each([
    [["psu-coe"], "psu-hosted"],
    [["psu-bme"], "psu-hosted"],
    [["psu-matse"], "psu-hosted"],
    [["psu-coe", "psu-bme"], "psu-hosted"],
    [["psu-coe", "psu-bmes"], "co-hosted"],
    [["psu-bme", "psu-bmes"], "co-hosted"],
    [["psu-bmes"], null],
    [["psu-bmes", "psu-swe"], null],
    [["example-host-unclassified"], null],
    [["missing"], null],
    [["psu-coe", "missing"], null],
  ] as const)("classifies host IDs %s as %s", (ids, badge) =>
    expect(
      hostingIdentity({ hostOrganizationIds: [...ids] }, organizations),
    ).toBe(badge),
  );
  it("never infers hosting from a title, department-like name, category or scope", () => {
    const misleading = {
      ...organizations[0],
      id: "misleading",
      name: "Penn State College of Engineering",
      hostType: undefined,
    };
    expect(
      hostingIdentity({ hostOrganizationIds: [misleading.id] }, [misleading]),
    ).toBeNull();
    const titled = {
      ...base,
      title: "Penn State Department event",
      hostOrganizationIds: ["example-process"],
    };
    expect(hostingIdentity(titled, organizations)).toBeNull();
  });
  it("keeps verified full names and proposed compact labels separate, including accurate affiliations", () => {
    const host = (id: string) =>
      registeredHosts.find((item) => item.id === id)!;
    expect(host("psu-matse").parentUnitIds).toEqual(["psu-ems"]);
    expect(host("psu-abe").parentUnitIds).toEqual(["psu-ag", "psu-coe"]);
    expect(host("psu-ime").name).toContain("Harold and Inge Marcus");
    expect(host("psu-nuclear").name).toContain("Ken and Mary Alice Lindquist");
    expect(host("psu-ee").parentUnitIds).toEqual(["psu-eecs"]);
    expect(hostNames([host("psu-coe")])).toBe(
      "Penn State College of Engineering",
    );
    expect(hostNames([host("psu-coe"), host("psu-bmes")], true)).toBe(
      "CoE + BMES",
    );
    for (const [id, compact] of [
      ["psu-bme", "BME Dept."],
      ["psu-matse", "MatSE Dept."],
      ["psu-esm", "ESM Dept."],
      ["psu-che", "ChemE Dept."],
      ["psu-sedi", "SEDI"],
    ])
      expect(hostNames([host(id)], true)).toBe(compact);
    expect(
      hostNames(
        [{ ...host("psu-coe"), shortName: undefined, compactName: undefined }],
        true,
      ),
    ).toBe(host("psu-coe").name);
    expect(
      eventHosts({ hostOrganizationIds: ["missing"] }, organizations)[0].name,
    ).toBe("Host details not provided");
    expect(
      departmentHosted({ hostOrganizationIds: ["psu-bme"] }, organizations),
    ).toBe(true);
    expect(
      departmentHosted(
        { hostOrganizationIds: ["psu-bme", "psu-bmes"] },
        organizations,
      ),
    ).toBe(false);
  });
  it("does not change independent analytical outputs merely by changing hosting presentation metadata", () => {
    const proposal = {
      title: "Example",
      start: "2026-10-21T16:30:00-04:00",
      end: "2026-10-21T17:30:00-04:00",
      majorIds: ["bme", "che"],
    };
    const context = getWeeklyPlanningContext({
      start: "2026-10-18",
      end: "2026-10-25",
    });
    const original = analyzePlanningProposal(proposal, context);
    const relabeled = analyzePlanningProposal(proposal, {
      ...context,
      organizations: organizations.map((org) => ({
        ...org,
        hostType: "university-unit" as const,
        institutionId: "psu",
        shortName: "Display label",
      })),
    });
    expect(relabeled.preparation).toEqual(original.preparation);
    expect(relabeled.nonExam).toEqual(original.nonExam);
    expect(relabeled.overall.score).toBeNull();
  });
});

describe("public filter dimensions and shareable state", () => {
  it("uses majors even without a mode switch and combines organization restrictions with AND", () => {
    expect(find("majors=bme")).toContain("example-industry");
    expect(find("majors=bme")).not.toContain("example-process-lab");
    expect(find("organizations=example-process")).toEqual([
      "example-process-lab",
      "example-industry",
    ]);
    expect(find("majors=bme&organizations=example-process")).toEqual([
      "example-industry",
    ]);
    expect(find("majors=me&organizations=example-process")).toEqual([]);
    expect(find("majors=bme,che&organizations=example-process")).toEqual([
      "example-process-lab",
      "example-industry",
    ]);
    expect(
      find("majors=bme&organizations=example-process,example-design"),
    ).toContain("example-design-meeting");
    expect(
      find(
        "majors=bme&organizations=example-process&categories=career-networking",
      ),
    ).toEqual(["example-industry"]);
  });
  it("uses documented host memberships for discovery clusters with OR within and AND across dimensions", () => {
    const makers = find("clusters=example-makers");
    expect(makers).toContain("example-process-lab"); // No explicit event cluster targeting: still valid discovery.
    expect(makers).not.toContain("example-welcome");
    expect(find("clusters=example-makers,example-careers")).toEqual(find(""));
    expect(
      find(
        "majors=bme&organizations=example-process&clusters=example-makers&categories=career-networking",
      ),
    ).toEqual(["example-industry"]);
    expect(
      find("organizations=example-council&clusters=example-makers"),
    ).toEqual([]);
  });
  it("round trips active clusters and categories, resets every restriction and migrates legacy career URLs", () => {
    const state = parse(
      "majors=bme&organizations=example-process&clusters=example-makers&categories=career-fair,networking&view=listMonth&q=design",
    );
    expect(state.categories).toEqual(["career-networking"]);
    expect(parse(serializeCalendarState(state))).toEqual(state);
    const reset = clearDiscoveryFilters(state);
    expect(reset.clusterIds).toEqual([]);
    expect(reset.majorIds).toEqual([]);
    expect(reset.organizationIds).toEqual([]);
    expect(reset.categories).toEqual([]);
    expect(reset.date).toBe(state.date);
    expect(reset.view).toBe(state.view);
    expect(find("mode=recommended")).toEqual(find(""));
    expect(find("mode=all&majors=bme")).toEqual(find("majors=bme"));
    expect(
      parse("clusters=unknown,example-makers,example-makers").clusterIds,
    ).toEqual(["example-makers"]);
  });
  it("counts analytical selections and display restrictions, excluding proposal host and default all-years", () => {
    expect(
      plannerControlCount(
        { majorIds: ["bme"], academicLevels: ALL_LEVELS, clusterIds: [] },
        [true, true, true, true, true],
        false,
      ),
    ).toBe(1);
    expect(
      plannerControlCount(
        {
          majorIds: ["bme", "che"],
          academicLevels: ["third"],
          clusterIds: ["example-makers"],
        },
        [true, false, true, false, true],
        true,
      ),
    ).toBe(7);
  });
});
