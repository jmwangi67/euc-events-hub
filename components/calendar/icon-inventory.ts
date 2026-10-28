/** Every current semantic selection, including deliberate neutral fallbacks. */
export const ICON_INVENTORY: {
  label: string;
  meaning: string;
  where: string;
  props: Record<string, unknown>;
  fallback?: boolean;
}[] = [
  ...[
    [
      "career-networking",
      "Career & Networking",
      "Employer, recruiting and networking events",
    ],
    [
      "professional-development",
      "Professional Development",
      "General professional development (neutral fallback)",
    ],
    [
      "technical-workshop",
      "Technical Workshops",
      "Hands-on engineering workshops",
    ],
    ["general-body-meeting", "General Body Meetings", "Organization meetings"],
    ["competition", "Competitions", "Engineering competitions"],
    [
      "social-recreational",
      "Social & Recreational",
      "Social and recreational activities",
    ],
  ].map(([eventType, label, meaning]) => ({
    label,
    meaning,
    where: "Student and planner cards/details",
    props: { eventType },
  })),
  ...["career-fair", "corporate-recruiting", "networking"].map((subtype) => ({
    label: subtype,
    meaning: "Explicit career subtype; shared briefcase",
    where: "Student and planner",
    props: { eventType: "career-networking", subtype },
  })),
  {
    label: "Research",
    meaning: "Explicit research-seminar subtype; laboratory flask",
    where: "Student and planner cards/details",
    props: { subtype: "research-seminar" },
  },
  {
    label: "Academic exam",
    meaning: "Exam sheet and pencil; regular course examination",
    where: "Planner and academic review",
    props: { kind: "exam" },
  },
  ...[
    ["concert", "Concert / music", "Music performance"],
    ["festival", "Music festival", "Explicitly classified music festival"],
    ["football", "Football / sports", "Sporting commitment"],
    ["super-bowl", "Super Bowl", "National sporting scenario"],
    ["homecoming", "Homecoming", "University-wide celebration / commitment"],
    ["academic-break", "Academic break", "University-wide date-wide context"],
    ["election", "Election", "National civic commitment (neutral calendar)"],
    [
      "state-college",
      "Local context",
      "Local special event (neutral calendar)",
    ],
  ].map(([category, label, meaning]) => ({
    label,
    meaning,
    where: "Planner external cards and event details",
    props: { externalEvent: { category } },
  })),
  {
    label: "THON",
    meaning: "Owner-supplied four-diamond identity; explicit subtype only",
    where: "Both calendars when subtype is recorded",
    props: { subtype: "thon" },
  },
  {
    label: "THON generic fallback",
    meaning: "Generic community icon if branded mark is disabled",
    where: "Both calendars; branding replacement fallback",
    props: { subtype: "thon" },
    fallback: true,
  },
  {
    label: "Unspecified / local proposal",
    meaning: "Neutral calendar; no title inference",
    where: "Both calendars, plus planner proposal",
    props: {},
  },
];
