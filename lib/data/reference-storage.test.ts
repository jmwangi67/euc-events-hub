import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { majors, organizations } from "../../data/fixtures";
import { registeredHosts } from "../../data/fixtures/hosts";
import { organizationClusters } from "../../data/fixtures/planning-context";
import {
  majorSchema,
  organizationSchema,
  organizationClusterSchema,
  type Organization,
} from "../domain/models";
import manifest from "../../supabase/reference-manifest.json";
import invented from "../../supabase/tests/fixtures/reference-data.json";

// This is a test contract, not an application database adapter. New model
// fields must be represented or explicitly refused before a later read adapter.
const organizationFields = {
  id: ["public_id"],
  name: ["name"],
  description: ["description"],
  classification: ["classification"],
  hostType: ["host_type"],
  institutionId: ["institution_key"],
  unitType: ["unit_type"],
  shortName: ["short_name"],
  compactName: ["compact_name"],
  source: [
    "identity_source_label",
    "identity_source_url",
    "identity_source_verification",
  ],
  defaultMajorIds: ["organization_default_majors"],
  clusterIds: ["organization_cluster_memberships"],
  parentUnitIds: ["organization_parents"],
  networkIds: null,
} satisfies Record<keyof Organization, readonly string[] | null>;

function checkOrganizationContract(
  org: Organization,
  identityIsSynthetic: boolean,
) {
  if (org.networkIds.length) {
    throw new Error("B2b defers nonempty networkIds; refusing to discard them");
  }
  const identifiers = [
    org.id,
    org.institutionId,
    ...org.defaultMajorIds,
    ...(org.clusterIds ?? []),
    ...(org.parentUnitIds ?? []),
  ].filter((value) => value !== undefined);
  if (
    identifiers.some(
      (value) =>
        !value.length ||
        value.length > 200 ||
        value !== value.trim() ||
        /[\u0000-\u001f\u007f]/.test(value),
    )
  ) {
    throw new Error(
      "Identifier does not fit the explicit B2b storage boundary",
    );
  }
  if (
    org.source &&
    (org.source.verification === "synthetic") !== identityIsSynthetic
  ) {
    throw new Error(
      "Identity verification contradicts the explicitly supplied synthetic flag",
    );
  }
}

describe("B2b storage compatibility without an application provider cutover", () => {
  it("keeps exactly the six approved tables and never edits the merged B2a migration", () => {
    expect(manifest.tables).toEqual([
      "majors",
      "organizations",
      "organization_default_majors",
      "organization_clusters",
      "organization_cluster_memberships",
      "organization_parents",
    ]);
    const baseline = readFileSync(
      new URL(
        "../../supabase/migrations/20261031000100_closed_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    ).replaceAll("\r\n", "\n");
    expect(createHash("sha256").update(baseline).digest("hex")).toBe(
      "d37ff7f935b7d8189cdd30b905006a8c52415645de53936562ee284c3fe08543",
    );
  });

  it("accounts for every current optional and required organization field", () => {
    expect(Object.keys(organizationFields).sort()).toEqual(
      Object.keys(organizationSchema.shape).sort(),
    );
    const relations = new Set<string>(manifest.tables);
    const columns = new Set<string>(manifest.columns.organizations);
    for (const mapping of Object.values(organizationFields)) {
      for (const destination of mapping ?? []) {
        expect(columns.has(destination) || relations.has(destination)).toBe(
          true,
        );
      }
    }
    expect(Object.keys(majorSchema.shape).sort()).toEqual([
      "abbreviation",
      "id",
      "name",
    ]);
    expect(Object.keys(organizationClusterSchema.shape).sort()).toEqual([
      "description",
      "id",
      "name",
    ]);
  });

  it("preserves every populated fixture field and stable public ID through serialization", () => {
    const identities = new Set(registeredHosts.map((org) => org.id));
    for (const org of organizations)
      checkOrganizationContract(org, !identities.has(org.id));
    const serialized = JSON.parse(
      JSON.stringify({ majors, organizations, clusters: organizationClusters }),
    );
    expect(majorSchema.array().parse(serialized.majors)).toEqual(majors);
    expect(organizationSchema.array().parse(serialized.organizations)).toEqual(
      organizations,
    );
    expect(
      organizationClusterSchema.array().parse(serialized.clusters),
    ).toEqual(organizationClusters);
    expect(majors.map((major) => major.id)).toEqual(["bme", "che", "me"]);
  });

  it("retains ordered default majors, cluster memberships and two-parent affiliations", () => {
    const majorIds = new Set(majors.map((row) => row.id));
    const organizationIds = new Set(organizations.map((row) => row.id));
    const clusterIds = new Set(organizationClusters.map((row) => row.id));
    for (const org of organizations) {
      expect(org.defaultMajorIds.every((id) => majorIds.has(id))).toBe(true);
      expect(
        (org.parentUnitIds ?? []).every((id) => organizationIds.has(id)),
      ).toBe(true);
      expect((org.clusterIds ?? []).every((id) => clusterIds.has(id))).toBe(
        true,
      );
      if (org.clusterIds?.length)
        expect(org.hostType).toBe("student-organization");
    }
    expect(
      organizations.find((org) => org.id === "example-design")?.defaultMajorIds,
    ).toEqual(["me", "bme"]);
    expect(
      organizations.find((org) => org.id === "example-process")?.clusterIds,
    ).toEqual(["example-makers", "example-careers"]);
    expect(
      registeredHosts.find((org) => org.id === "psu-abe")?.parentUnitIds,
    ).toEqual(["psu-ag", "psu-coe"]);
  });

  it("keeps verified institutional identities separate from synthetic event provenance", () => {
    for (const org of registeredHosts) {
      expect(org.source?.verification).toBe("verified");
      expect(() => checkOrganizationContract(org, false)).not.toThrow();
      expect(() => checkOrganizationContract(org, true)).toThrow(
        "Identity verification contradicts",
      );
    }
  });

  it("fails explicitly for deferred nonempty network data and out-of-bound IDs", () => {
    expect(() =>
      checkOrganizationContract(
        { ...organizations[0], networkIds: ["future-network"] },
        true,
      ),
    ).toThrow("refusing to discard");
    expect(() =>
      checkOrganizationContract(
        { ...organizations[0], id: "x".repeat(201) },
        true,
      ),
    ).toThrow("storage boundary");
  });

  it("uses separate invented database fixtures covering the existing domain variants", () => {
    const parsed = organizationSchema.array().parse(invented.organizations);
    expect(majorSchema.array().parse(invented.majors)).toHaveLength(3);
    expect(
      organizationClusterSchema.array().parse(invented.clusters),
    ).toHaveLength(3);
    for (const org of parsed) checkOrganizationContract(org, true);
    expect(
      parsed.find((org) => org.id === "invented-guild")?.defaultMajorIds,
    ).toHaveLength(2);
    expect(
      parsed.find((org) => org.id === "invented-guild")?.clusterIds,
    ).toHaveLength(2);
    expect(
      parsed.find((org) => org.id === "invented-department")?.parentUnitIds,
    ).toHaveLength(2);
    expect(parsed.some((org) => org.hostType === undefined)).toBe(true);
    expect(parsed.some((org) => org.hostType === "unknown")).toBe(true);
    expect(
      parsed.every(
        (org) => !organizations.some((existing) => existing.id === org.id),
      ),
    ).toBe(true);
  });
});
