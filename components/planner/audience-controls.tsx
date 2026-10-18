import type {
  AcademicLevel,
  Major,
  Organization,
  OrganizationCluster,
} from "../../lib/domain/models";
import {
  ALL_LEVELS,
  ACADEMIC_LEVELS,
} from "../../lib/domain/planning-audience";
type Selection = {
  majorIds: string[];
  academicLevels: AcademicLevel[];
  clusterIds: string[];
};
const shortcuts: [string, AcademicLevel[]][] = [
  ["Underclassmen", ["first", "second"]],
  ["Upperclassmen", ["third", "fourth", "fifth-plus"]],
  ["All years", ALL_LEVELS],
];
const toggle = <T,>(ids: T[], id: T) =>
  ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
export function AudienceControls({
  majors,
  organization,
  clusters,
  selection,
  onChange,
}: {
  majors: Major[];
  organization: Organization;
  clusters: OrganizationCluster[];
  selection: Selection;
  onChange: (patch: Partial<Selection>) => void;
}) {
  const { majorIds, academicLevels, clusterIds } = selection;
  const audienceLabel = majors
    .filter((major) => majorIds.includes(major.id))
    .map((major) => major.abbreviation)
    .join(", ");
  return (
    <>
      <fieldset
        className="planning-audience"
        aria-describedby="audience-help audience-summary"
      >
        <legend>Planning audience</legend>
        <p className="field-help" id="audience-help">
          {organization.defaultMajorIds.length
            ? "Starts with the organization’s documented majors. Adjust for this proposal."
            : "No default audience is documented. Select the majors you intend to reach before analysis."}
        </p>
        {majors.map((major) => (
          <label className="choice" key={major.id}>
            <input
              type="checkbox"
              checked={majorIds.includes(major.id)}
              onChange={() =>
                onChange({ majorIds: toggle(majorIds, major.id) })
              }
            />
            {major.name} ({major.abbreviation})
          </label>
        ))}
        <p
          id="audience-summary"
          className="audience-summary"
          aria-live="polite"
        >
          Analyzing for:{" "}
          <strong>{audienceLabel || "Select a planning audience"}</strong>
        </p>
      </fieldset>
      <fieldset className="planning-audience academic-levels">
        <legend>Academic levels</legend>
        <div
          className="audience-shortcuts"
          role="group"
          aria-label="Academic level shortcuts"
        >
          {shortcuts.map(([label, levels]) => (
            <button
              key={label}
              type="button"
              className="control"
              aria-pressed={
                academicLevels.length === levels.length &&
                levels.every((level) => academicLevels.includes(level))
              }
              onClick={() => onChange({ academicLevels: [...levels] })}
            >
              {label}
            </button>
          ))}
        </div>
        {ALL_LEVELS.map((level) => (
          <label className="choice" key={level}>
            <input
              type="checkbox"
              checked={academicLevels.includes(level)}
              onChange={() =>
                onChange({ academicLevels: toggle(academicLevels, level) })
              }
            />
            {ACADEMIC_LEVELS[level]}
          </label>
        ))}
        <p className="field-help">
          Majors and levels are independent. Each major × level subgroup is
          analyzed separately; typical sequencing does not exclude
          out-of-sequence students.
        </p>
      </fieldset>
      <fieldset className="planning-audience">
        <legend>Organization clusters</legend>
        {clusters.map((cluster) => (
          <label key={cluster.id} className="choice">
            <input
              type="checkbox"
              checked={clusterIds.includes(cluster.id)}
              onChange={() =>
                onChange({ clusterIds: toggle(clusterIds, cluster.id) })
              }
            />
            {cluster.name}
          </label>
        ))}
        <p className="field-help">
          Example organization memberships. {organization.name} belongs to:{" "}
          {clusters
            .filter((cluster) => organization.clusterIds?.includes(cluster.id))
            .map((cluster) => cluster.name)
            .join(", ") || "none documented"}
          . Only explicit event cluster targeting adds relevance; host
          membership never does. Unspecified cluster targeting remains unknown.
        </p>
      </fieldset>
      <p className="field-help planning-scope" aria-live="polite">
        Current analysis: {audienceLabel || "No majors"} ·{" "}
        {academicLevels.length === ALL_LEVELS.length
          ? "All years"
          : academicLevels.map((level) => ACADEMIC_LEVELS[level]).join(", ") ||
            "No academic levels"}{" "}
        ·{" "}
        {clusters
          .filter((cluster) => clusterIds.includes(cluster.id))
          .map((cluster) => cluster.name)
          .join(", ") || "No clusters selected"}
        .
      </p>
    </>
  );
}
