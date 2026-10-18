import { describe, expect, it } from "vitest";
import { externalEventSchema, type ExternalEvent } from "./external-events";
import {
  externalAudienceCells,
  externalEligibility,
} from "./scheduling-eligibility";

function broad(scope: "psu-wide" | "national"): ExternalEvent {
  return externalEventSchema.parse({
    id: "example-restricted-commitment",
    title: "Example documented academic-year commitment",
    category: scope === "psu-wide" ? "homecoming" : "election",
    scope,
    analysis: "broad-context",
    analysisReason:
      "Fictional broad-scope commitment with a documented third-year audience restriction.",
    geography: "Example geography",
    audience: "Third-year engineering students in this example",
    targetAcademicLevels: ["third"],
    timeKnown: false,
    startDate: "2026-10-24",
    endDate: "2026-10-25",
    source: { label: "Example source", verification: "synthetic" },
  });
}

describe("documented external audience eligibility", () => {
  it.each(["psu-wide", "national"] as const)(
    "respects an explicit academic-year restriction for %s broad context",
    (scope) => {
      const record = broad(scope);
      expect(
        externalEligibility(record, {
          majorIds: ["bme"],
          academicLevels: ["first"],
        }).eligible,
      ).toBe(false);
      expect(
        externalEligibility(record, {
          majorIds: ["bme"],
          academicLevels: ["third"],
        }).eligible,
      ).toBe(true);
      expect(externalEligibility(record, { majorIds: ["che"] }).eligible).toBe(
        true,
      );
    },
  );

  it("keeps unrestricted broad context available while respecting an empty year selection", () => {
    const record = { ...broad("psu-wide"), targetAcademicLevels: undefined };
    expect(externalEligibility(record, { majorIds: ["bme"] }).eligible).toBe(
      true,
    );
    expect(
      externalEligibility(record, {
        majorIds: ["bme"],
        academicLevels: [],
      }).eligible,
    ).toBe(false);
    expect(
      externalEligibility(broad("national"), {
        majorIds: ["bme"],
        academicLevels: [],
      }).eligible,
    ).toBe(false);
  });

  it("retains independent affected cells instead of extending a restriction to other years", () => {
    expect(
      externalAudienceCells(broad("psu-wide"), {
        majorIds: ["bme", "che"],
        academicLevels: ["first", "third"],
      }).map((cell) => cell.id),
    ).toEqual(["bme:third", "che:third"]);
  });

  it("requires a selected year for targeted Local records as well as broad records", () => {
    const record = externalEventSchema.parse({
      ...broad("psu-wide"),
      category: "concert",
      scope: "campus-local",
      analysis: "audience-targeted",
      targetMajorIds: ["bme"],
      targetAcademicLevels: undefined,
    });
    expect(
      externalEligibility(record, {
        majorIds: ["bme"],
        academicLevels: [],
      }).eligible,
    ).toBe(false);
    expect(
      externalEligibility(record, {
        majorIds: ["bme"],
        academicLevels: ["first"],
      }).eligible,
    ).toBe(true);
    expect(
      externalEligibility(record, {
        majorIds: ["che"],
        academicLevels: ["first"],
      }).eligible,
    ).toBe(false);
  });

  it("does not promote context-only records when their academic year matches", () => {
    const record = { ...broad("psu-wide"), analysis: "context-only" as const };
    const snapshot = structuredClone(record);
    expect(
      externalEligibility(record, {
        majorIds: ["bme"],
        academicLevels: ["third"],
      }),
    ).toMatchObject({ eligible: false, broadContext: false });
    expect(record).toEqual(snapshot);
  });
});
