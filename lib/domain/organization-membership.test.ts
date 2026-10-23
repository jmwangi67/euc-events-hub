import { describe, expect, it } from "vitest";
import {
  getEvents,
  getOrganizations,
  getStudentOrganizations,
} from "../data/fixtures";
import {
  getOrganizationClusters,
  getWeeklyPlanningContext,
} from "../data/weekly-planning";
import { getProposalIntelligenceContext } from "../data/planner";
import {
  hasUniversityHost,
  hostingIdentity,
  studentOrganizations,
} from "./hosting";
import { organizationSchema } from "./models";
import {
  clearDiscoveryFilters,
  discoveryFilters,
  parseCalendarState,
  serializeCalendarState,
} from "./calendar-state";
import { analyzePlanningProposal } from "./proposal-analysis";
import {
  loadCalendarItems,
  loadCalendarScheduling,
} from "../../components/calendar/calendar-source";
import type { PlanningCalendarOptions } from "../../components/calendar/calendar-types";

const hosts = getOrganizations();
const range = { start: "2026-11-16", end: "2026-11-20" };
const options = {
  majorIds: ["bme", "che", "me"],
  organizationIds: getStudentOrganizations().map((org) => org.id),
  clusterIds: getOrganizationClusters().map((cluster) => cluster.id),
};
const parse = (query = "") =>
  parseCalendarState(new URLSearchParams(query), range.start, options);
const query = (search = "") =>
  getEvents({ ...range, filters: discoveryFilters(parse(search)) });
const ids = (search = "") => query(search).map((event) => event.id);

describe("student organization membership versus university host identity", () => {
  it("provides student-only choices while retaining the complete independent host registry", () => {
    expect(getStudentOrganizations().map((org) => org.id)).toEqual([
      "example-council",
      "example-process",
      "example-design",
      "psu-bmes",
      "psu-swe",
    ]);
    expect(hosts.some((host) => host.id === "psu-bme")).toBe(true);
    expect(hosts.some((host) => host.id === "example-host-unclassified")).toBe(
      true,
    );
    const choices = getStudentOrganizations();
    choices[0].name = "Local test change";
    expect(getStudentOrganizations()[0].name).toBe(
      "Example Engineering Council",
    );
  });

  it("never infers student membership from names or university unit types", () => {
    const university = hosts.find((host) => host.id === "psu-bme")!;
    const unitTypes = [
      "college",
      "department",
      "school",
      "administrative-unit",
      "official-faculty-staff",
    ] as const;
    expect(
      studentOrganizations(
        unitTypes.map((unitType) => ({
          ...university,
          unitType,
          name: "Student organization",
        })),
      ),
    ).toEqual([]);
    expect(
      studentOrganizations([
        { ...university, hostType: "unknown" },
        { ...university, hostType: undefined },
      ]),
    ).toEqual([]);
    expect(
      studentOrganizations([
        {
          ...university,
          hostType: "student-organization",
          unitType: undefined,
        },
      ]),
    ).toHaveLength(1);
  });

  it.each(["university-unit", "unknown", undefined] as const)(
    "rejects student cluster membership for hostType=%s",
    (hostType) => {
      expect(
        organizationSchema.safeParse({
          ...hosts[0],
          hostType,
          clusterIds: ["example-makers"],
        }).success,
      ).toBe(false);
    },
  );

  it("allows documented student cluster membership and university host descriptors separately", () => {
    expect(
      organizationSchema.safeParse({
        ...hosts[0],
        clusterIds: ["example-makers"],
      }).success,
    ).toBe(true);
    const department = hosts.find((host) => host.id === "psu-bme")!;
    expect(organizationSchema.parse(department)).toEqual(department);
    expect(department.clusterIds).toBeUndefined();
  });

  it("keeps department events discoverable by major and University Events, never by a department organization choice", () => {
    expect(ids()).toHaveLength(10);
    expect(ids("majors=bme")).toContain("discovery-bme");
    expect(ids("university=1")).toEqual([
      "discovery-coe",
      "discovery-bme",
      "discovery-matse",
      "discovery-units",
      "discovery-cohost",
      "discovery-dept-cohost",
      "discovery-fair",
    ]);
    expect(ids("university=1&organizations=psu-bmes")).toEqual([
      "discovery-cohost",
      "discovery-dept-cohost",
    ]);
    expect(ids("university=1&categories=technical-workshop")).toEqual([
      "discovery-bme",
      "discovery-matse",
    ]);
    expect(ids("university=1&q=materials")).toEqual(["discovery-matse"]);
    expect(ids("university=1&clusters=example-makers")).toEqual([]);
    expect(
      getEvents({ ...range, filters: { organizationIds: ["psu-bme"] } }),
    ).toEqual([]);
    expect(
      query("university=1").every((event) => event.status === "published"),
    ).toBe(true);
  });

  it("sanitizes stale department organization URLs and round-trips/resets University Events", () => {
    expect(
      parse("organizations=psu-bme,psu-coe,example-host-unclassified,psu-bmes")
        .organizationIds,
    ).toEqual(["psu-bmes"]);
    expect(ids("organizations=psu-bme")).toEqual(ids());
    const state = parse("majors=bme&university=1&organizations=psu-bmes");
    expect(parse(serializeCalendarState(state))).toEqual(state);
    expect(clearDiscoveryFilters(state).universityOnly).toBe(false);
    expect(
      discoveryFilters(clearDiscoveryFilters(state)).organizationIds,
    ).toEqual([]);
  });

  it("distinguishes known university participation from an unresolved badge arrangement", () => {
    const event = { hostOrganizationIds: ["psu-bme", "missing"] };
    expect(hasUniversityHost(event, hosts)).toBe(true);
    expect(hostingIdentity(event, hosts)).toBeNull();
    expect(
      hasUniversityHost(
        { hostOrganizationIds: ["psu-bmes", "psu-swe"] },
        hosts,
      ),
    ).toBe(false);
    expect(
      hasUniversityHost(
        { hostOrganizationIds: ["psu-bme"] },
        hosts.map((host) => ({ ...host, institutionId: undefined })),
      ),
    ).toBe(false);
  });

  it("hides university cards only at the display adapter while eligible constraints remain in analysis", () => {
    const planning: PlanningCalendarOptions = {
      audience: { majorIds: ["bme"] },
      proposal: null,
      showEvents: true,
      showUniversityEvents: true,
      showExams: true,
      showPsuWide: true,
      showCampusLocal: true,
      showNational: true,
      onExamSelect: () => {},
      onProposalSelect: () => {},
    };
    const calendarRange = { startStr: range.start, endStr: range.end };
    expect(
      loadCalendarItems(calendarRange, {}, planning).map((item) => item.id),
    ).toContain("discovery-bme");
    const hidden = loadCalendarItems(
      calendarRange,
      {},
      { ...planning, showUniversityEvents: false },
    );
    expect(hidden.map((item) => item.id)).not.toContain("discovery-bme");
    expect(hidden.map((item) => item.id)).not.toContain("discovery-cohost");
    expect(hidden.map((item) => item.id)).toContain("discovery-student");
    expect(
      loadCalendarItems(
        calendarRange,
        {},
        { ...planning, showEvents: false },
      ).map((item) => item.id),
    ).not.toContain("discovery-bme");

    expect(
      getWeeklyPlanningContext(range).events.map((event) => event.id),
    ).toContain("discovery-bme");
    const density = loadCalendarScheduling(range, planning.audience);
    expect(
      density.days
        .flatMap((day) => day.constraints)
        .some((item) => item.eventId === "discovery-bme" && item.eligible),
    ).toBe(true);
    const proposal = {
      title: "Fictional student proposal",
      start: "2026-11-16T13:15:00-05:00",
      end: "2026-11-16T13:45:00-05:00",
      majorIds: ["bme"],
    };
    const analysis = analyzePlanningProposal(proposal, {
      ...getProposalIntelligenceContext(proposal),
      organizations: hosts,
    });
    expect(
      analysis.conflicts.some(
        (conflict) => conflict.record.id === "discovery-bme",
      ),
    ).toBe(true);
    expect(
      analysis.nonExam.days[0].constraints.some(
        (item) => item.eventId === "discovery-bme" && item.eligible,
      ),
    ).toBe(true);
    expect(analysis.overall.score).toBeNull();
  });
});
