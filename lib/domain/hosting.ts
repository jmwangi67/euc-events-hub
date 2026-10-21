import type { Event, Organization } from "./models";
export type HostingIdentity = "psu-hosted" | "co-hosted" | null;
/** Unresolved hosts suppress institutional claims; names and scope never classify. */
export function hostingIdentity(
  event: Pick<Event, "hostOrganizationIds">,
  registry: readonly Organization[],
): HostingIdentity {
  const hosts = event.hostOrganizationIds.map((id) =>
    registry.find((host) => host.id === id),
  );
  if (
    !hosts.length ||
    hosts.some((host) => !host || !host.hostType || host.hostType === "unknown")
  )
    return null;
  const university = hosts.some(
    (host) =>
      host!.hostType === "university-unit" && host!.institutionId === "psu",
  );
  if (!university) return null;
  if (
    hosts.some(
      (host) =>
        host!.hostType === "university-unit" && host!.institutionId !== "psu",
    )
  )
    return null;
  return hosts.some((host) => host!.hostType === "student-organization")
    ? "co-hosted"
    : "psu-hosted";
}
export function eventHosts(
  event: Pick<Event, "hostOrganizationIds">,
  registry: readonly Organization[],
) {
  return event.hostOrganizationIds.map(
    (id) =>
      registry.find((host) => host.id === id) ?? {
        id,
        name: "Host details not provided",
        defaultMajorIds: [],
        networkIds: [],
      },
  );
}
export function hostNames(hosts: readonly Organization[], compact = false) {
  return hosts
    .map((host) =>
      compact ? (host.compactName ?? host.shortName ?? host.name) : host.name,
    )
    .join(" + ");
}
export function departmentHosted(
  event: Pick<Event, "hostOrganizationIds">,
  registry: readonly Organization[],
) {
  return (
    hostingIdentity(event, registry) === "psu-hosted" &&
    eventHosts(event, registry).some((host) => host.unitType === "department")
  );
}
