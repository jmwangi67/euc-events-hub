/** Fictional dates and memberships for layout/model testing, never official schedules. */
import { organizationClusterSchema } from "../../lib/domain/models";
import { externalEventSchema } from "../../lib/domain/external-events";
export const organizationClusters = organizationClusterSchema.array().parse([
  {
    id: "example-makers",
    name: "Example Makers Network",
    description: "Example project and technical organizations.",
  },
  {
    id: "example-careers",
    name: "Example Career Alliance",
    description: "Example professional-development coordination.",
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
    title: "Example Homecoming weekend",
    category: "homecoming",
    scope: "psu-wide",
    analysis: "broad-context",
    analysisReason:
      "Explicitly designated example university-wide commitment; participation varies.",
    startDate: "2026-10-23",
    endDate: "2026-10-26",
  },
  {
    ...base,
    id: "scenario-football",
    title: "Example Penn State football game",
    category: "football",
    scope: "psu-wide",
    analysis: "broad-context",
    analysisReason:
      "Explicitly designated example university-wide commitment; participation varies.",
    startDate: "2026-10-24",
    endDate: "2026-10-25",
    timeKnown: true,
    start: "2026-10-24T15:30:00-04:00",
    end: "2026-10-24T19:00:00-04:00",
  },
  {
    ...base,
    id: "scenario-thon",
    title: "Example THON planning scenario",
    category: "thon",
    scope: "psu-wide",
    analysis: "broad-context",
    analysisReason:
      "Explicitly designated example university-wide commitment; participation varies.",
    startDate: "2026-10-30",
    endDate: "2026-11-02",
  },
  {
    ...base,
    id: "scenario-concert",
    title: "Example major concert",
    category: "concert",
    startDate: "2026-10-21",
    endDate: "2026-10-22",
  },
  {
    ...base,
    id: "scenario-local",
    title: "Example State College festival",
    category: "state-college",
    startDate: "2026-10-25",
    endDate: "2026-10-27",
  },
  {
    ...base,
    id: "scenario-election",
    title: "Example major election scenario",
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
    title: "Example Super Bowl scenario",
    category: "super-bowl",
    analysis: "broad-context",
    analysisReason:
      "Curated major national scenario with plausible scheduling implications, not guaranteed participation.",
    scope: "national",
    geography: "United States (scenario)",
    startDate: "2026-10-25",
    endDate: "2026-10-26",
  },
  {
    ...base,
    id: "scenario-targeted-concert",
    title: "Example major Local concert",
    category: "concert",
    analysis: "audience-targeted",
    analysisReason:
      "Fictional Local music commitment explicitly offered to the listed engineering audience; presence does not imply universal participation.",
    targetMajorIds: ["bme", "che", "me"],
    impactPolicy: "major-local-music",
    policyRationale:
      "Example scenario explicitly designated as a major Local concert to demonstrate the provisional two-hour attendance-impact window, not a verified schedule.",
    startDate: "2026-10-21",
    endDate: "2026-10-22",
    timeKnown: true,
    start: "2026-10-21T19:00:00-04:00",
    end: "2026-10-21T22:00:00-04:00",
  },
  {
    ...base,
    id: "scenario-targeted-festival",
    title: "Example major Local music festival",
    category: "festival",
    analysis: "audience-targeted",
    analysisReason:
      "Fictional festival explicitly targets the listed majors and Example Makers Network; participation remains unknown.",
    targetMajorIds: ["bme", "che", "me"],
    targetClusterIds: ["example-makers"],
    impactPolicy: "major-local-music",
    policyRationale:
      "Example major Local festival with documented fictional hours demonstrates a cross-midnight two-hour buffer; it is not an official event.",
    startDate: "2026-10-24",
    endDate: "2026-10-26",
    timeKnown: true,
    start: "2026-10-24T14:00:00-04:00",
    end: "2026-10-25T01:00:00-04:00",
  },
  {
    ...base,
    id: "scenario-academic-break",
    title: "Example academic break — not official dates",
    category: "academic-break",
    scope: "psu-wide",
    analysis: "broad-context",
    analysisReason:
      "Explicitly classified fictional university-wide break for development; dates are not an official Penn State academic calendar.",
    impactPolicy: "academic-break",
    policyRationale:
      "Fictional academic-break record demonstrates early-departure cautions on the preceding two days. A reliable published academic-calendar source is not integrated.",
    startDate: "2026-11-02",
    endDate: "2026-11-07",
  },
  {
    ...base,
    id: "scenario-psu-kickoff",
    title: "Example PSU-wide Homecoming kickoff",
    category: "homecoming",
    scope: "psu-wide",
    analysis: "broad-context",
    analysisReason:
      "Explicitly designated fictional PSU-wide kickoff for crowded-calendar visual testing; participation varies.",
    startDate: "2026-10-21",
    endDate: "2026-10-22",
    timeKnown: true,
    start: "2026-10-21T17:00:00-04:00",
    end: "2026-10-21T19:00:00-04:00",
  },
  {
    ...base,
    id: "scenario-national-forum",
    title: "Example National civic commitment",
    category: "election",
    scope: "national",
    geography: "United States (fictional scenario)",
    analysis: "broad-context",
    analysisReason:
      "Curated fictional major National civic commitment for visual testing; no attendance rate or universal participation is implied.",
    startDate: "2026-10-21",
    endDate: "2026-10-22",
    timeKnown: true,
    start: "2026-10-21T17:30:00-04:00",
    end: "2026-10-21T19:30:00-04:00",
  },
]);
