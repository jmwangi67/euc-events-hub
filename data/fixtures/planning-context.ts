/** Fictional dates and memberships for layout/model testing, never official schedules. */
import { organizationClusterSchema } from "../../lib/domain/models";
import { externalEventSchema } from "../../lib/domain/external-events";
export const organizationClusters = organizationClusterSchema.array().parse([
  {
    id: "example-makers",
    name: "Example Makers Network",
    description: "Synthetic project and technical organizations.",
  },
  {
    id: "example-careers",
    name: "Example Career Alliance",
    description: "Synthetic professional-development coordination.",
  },
]);
const source = {
  label: "Fictional weekly planning scenario — dates are not real schedules",
  verification: "synthetic" as const,
};
const base = {
  timeKnown: false as const,
  scope: "campus-local" as const,
  geography: "University Park / State College (scenario)",
  audience:
    "Potential commitment across engineering majors and academic levels",
  source,
};
export const externalEvents = externalEventSchema.array().parse([
  {
    ...base,
    id: "scenario-homecoming",
    title: "Synthetic Homecoming weekend",
    category: "homecoming",
    scope: "psu-wide",
    analysis: "broad-context",
    analysisReason:
      "Explicitly designated synthetic university-wide commitment; participation varies.",
    startDate: "2026-10-23",
    endDate: "2026-10-26",
  },
  {
    ...base,
    id: "scenario-football",
    title: "Synthetic Penn State football game",
    category: "football",
    scope: "psu-wide",
    analysis: "broad-context",
    analysisReason:
      "Explicitly designated synthetic university-wide commitment; participation varies.",
    startDate: "2026-10-24",
    endDate: "2026-10-25",
    timeKnown: true,
    start: "2026-10-24T15:30:00-04:00",
    end: "2026-10-24T19:00:00-04:00",
  },
  {
    ...base,
    id: "scenario-thon",
    title: "Synthetic THON planning scenario",
    category: "thon",
    scope: "psu-wide",
    analysis: "broad-context",
    analysisReason:
      "Explicitly designated synthetic university-wide commitment; participation varies.",
    startDate: "2026-10-30",
    endDate: "2026-11-02",
  },
  {
    ...base,
    id: "scenario-concert",
    title: "Synthetic major concert",
    category: "concert",
    startDate: "2026-10-21",
    endDate: "2026-10-22",
  },
  {
    ...base,
    id: "scenario-local",
    title: "Synthetic State College festival",
    category: "state-college",
    startDate: "2026-10-25",
    endDate: "2026-10-27",
  },
  {
    ...base,
    id: "scenario-election",
    title: "Synthetic major election scenario",
    category: "election",
    analysis: "broad-context",
    analysisReason:
      "Curated major national scenario with plausible scheduling implications, not guaranteed participation.",
    scope: "national",
    geography: "United States (scenario)",
    startDate: "2026-10-20",
    endDate: "2026-10-21",
  },
  {
    ...base,
    id: "scenario-super-bowl",
    title: "Synthetic Super Bowl scenario",
    category: "super-bowl",
    analysis: "broad-context",
    analysisReason:
      "Curated major national scenario with plausible scheduling implications, not guaranteed participation.",
    scope: "national",
    geography: "United States (scenario)",
    startDate: "2026-10-25",
    endDate: "2026-10-26",
  },
]);
