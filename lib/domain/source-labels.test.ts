import { describe, expect, it } from "vitest";
import {
  academicExamTitle,
  externalScopeLabel,
  sourceLabel,
  verificationLabel,
} from "./source-labels";

describe("source and scope presentation", () => {
  it("uses plain demo language without changing stored verification", () => {
    const source = {
      label: "Synthetic course calendar fixture",
      verification: "synthetic" as const,
    };
    expect(sourceLabel(source)).toBe("Example course calendar fixture");
    expect(verificationLabel(source.verification)).toBe(
      "Demo data — not verified",
    );
    expect(source).toEqual({
      label: "Synthetic course calendar fixture",
      verification: "synthetic",
    });
  });

  it("preserves non-demo provenance and distinguishes source claims", () => {
    const label = "Synthetic Materials Society published calendar";
    expect(sourceLabel({ label, verification: "unverified" })).toBe(label);
    expect(sourceLabel({ label, verification: "verified" })).toBe(label);
    expect(verificationLabel("unverified")).toBe("Unverified");
    expect(verificationLabel("verified")).toBe("Source marked verified");
  });

  it("labels all scopes while keeping the Local identifier internal", () => {
    expect(externalScopeLabel("campus-local")).toBe("Local");
    expect(externalScopeLabel("psu-wide")).toBe("PSU-wide");
    expect(externalScopeLabel("national")).toBe("National");
    expect(academicExamTitle("EXAMPLE-MATH")).toBe(
      "Academic Exam EXAMPLE-MATH",
    );
  });
});
