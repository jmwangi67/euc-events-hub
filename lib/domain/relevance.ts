import type { Event, Organization } from "./models";

export type MajorSelection =
  { mode: "all" } | { mode: "recommended"; majorIds: readonly string[] };

/** Intended audience takes precedence over the host's academic classification. */
export function isEventRelevant(
  event: Event,
  selection: MajorSelection,
  organizations: readonly Organization[],
): boolean {
  if (selection.mode === "all" || event.collegeWide) return true;
  if (event.targeting === "unclassified") return false;
  const audience =
    event.targeting === "explicit"
      ? event.targetMajorIds
      : organizations
          .filter((org) => event.hostOrganizationIds.includes(org.id))
          .flatMap((org) => org.defaultMajorIds);
  return selection.majorIds.some((major) => audience.includes(major));
}
