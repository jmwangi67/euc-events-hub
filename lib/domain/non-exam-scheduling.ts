import type { ExternalEvent } from "./external-events";
import type { AcademicLevel, Event, Organization } from "./models";
import { dateOnlySchema, instantSchema } from "./models";
import {
  audienceCells,
  eventAudienceMatch,
  type PlanningAudience,
} from "./planning-audience";
import { externalEligibility } from "./scheduling-eligibility";
import { addCalendarDays, easternDate, easternDayStart } from "../time/eastern";

/** Policy priorities are provisional ordering, never a pressure/attendance score. */
export type NonExamPolicies = {
  thon: {
    leadUpDays: number;
    adjacentAvoidDays: number;
    maximumPolicyImportance: number;
    leadUpRelativeImportance: number;
  };
  majorLocalMusic: { beforeHours: number; afterHours: number };
  academicBreak: { departureDays: number };
};
export const DEFAULT_NON_EXAM_POLICIES: Readonly<NonExamPolicies> = {
  thon: {
    leadUpDays: 7,
    adjacentAvoidDays: 1,
    maximumPolicyImportance: 1,
    leadUpRelativeImportance: 0.5,
  },
  majorLocalMusic: { beforeHours: 2, afterHours: 2 },
  academicBreak: { departureDays: 2 },
};
export type NonExamContext = {
  events: readonly Event[];
  externalEvents: readonly ExternalEvent[];
  organizations: readonly Organization[];
};
export type NonExamRange = { start: string; end: string };
export type NonExamGuidance =
  "avoid-scheduling" | "scheduling-caution" | "review-conflicts";
export type NonExamDensityBand = "none" | "one" | "two" | "three-plus";
export type NonExamEventType =
  "engineering" | "psu-wide" | "national" | "local";
export type NonExamWindow = {
  kind: "actual" | "policy";
  startDate: string;
  endDate: string;
  /** Only real event instants or explicit policy boundaries produce timed shading. */
  start?: string;
  end?: string;
  guidance: NonExamGuidance;
  label: string;
  reason: string;
  internalPolicyImportance?: number;
  overridesWeakerCautions?: boolean;
  /** The source alternative's timing and audience remain associated. */
  affectedCellIds?: string[];
  eventType?: NonExamEventType;
  source?: Event["source"];
};
export type NonExamConstraint = {
  id: string;
  eventId: string;
  title: string;
  eventType: NonExamEventType;
  eventTypes: NonExamEventType[];
  category: Event["category"] | ExternalEvent["category"];
  sources: Event["source"][];
  affectedCellIds: string[];
  eligible: boolean;
  contextOnly: boolean;
  timing: "known" | "all-day" | "date-uncertain" | "source-conflict";
  windows: NonExamWindow[];
  reason: string;
  alternatives: readonly (Event | ExternalEvent)[];
};
export type NonExamCaution = {
  id: string;
  eventId: string;
  title: string;
  guidance: NonExamGuidance;
  label: string;
  reason: string;
  contextOnly: boolean;
  timingUncertain: boolean;
  sources: Event["source"][];
  affectedCellIds: string[];
};
type Cell = ReturnType<typeof audienceCells>[number];
export type NonExamDensityCell = {
  id: string;
  majorId: string;
  academicLevel: AcademicLevel;
  count: number;
  commitmentIds: string[];
};
export type NonExamDensitySegment = NonExamRange & {
  maximumConcurrent: number;
  band: NonExamDensityBand;
  cells: NonExamDensityCell[];
};
export type NonExamDay = {
  date: string;
  maximumConcurrent: number;
  band: NonExamDensityBand;
  cells: {
    id: string;
    majorId: string;
    academicLevel: AcademicLevel;
    maximumConcurrent: number;
    commitmentIds: string[];
  }[];
  primaryCaution: NonExamCaution | null;
  cautions: NonExamCaution[];
  constraints: NonExamConstraint[];
  eligibleCommitments: number;
  contextOnlyCommitments: number;
  timingUncertainties: number;
  allDayCommitments: number;
};
export type NonExamSchedulingAnalysis = {
  score: null;
  overall: { status: "awaiting-methodology-review"; score: null };
  constraints: NonExamConstraint[];
  days: NonExamDay[];
  timeSegments: NonExamDensitySegment[];
};
const overlap = (a: NonExamRange, b: NonExamRange) =>
  Date.parse(a.start) < Date.parse(b.end) &&
  Date.parse(b.start) < Date.parse(a.end);
const windowInterval = (window: NonExamWindow): NonExamRange => ({
  start: window.start ?? easternDayStart(window.startDate),
  end: window.end ?? easternDayStart(window.endDate),
});
export function nonExamDensityBand(count: number): NonExamDensityBand {
  return count === 0
    ? "none"
    : count === 1
      ? "one"
      : count === 2
        ? "two"
        : "three-plus";
}
export function nonExamDensityLabel(count: number) {
  return `${count >= 3 ? "3+" : count} simultaneous commitment${count === 1 ? "" : "s"}`;
}
function validatePolicies(policies: NonExamPolicies) {
  const days = [
    policies.thon.leadUpDays,
    policies.thon.adjacentAvoidDays,
    policies.academicBreak.departureDays,
  ];
  const numbers = [
    policies.thon.maximumPolicyImportance,
    policies.majorLocalMusic.beforeHours,
    policies.majorLocalMusic.afterHours,
  ];
  if (
    days.some((n) => !Number.isSafeInteger(n) || n < 0) ||
    numbers.some((n) => !Number.isFinite(n) || n < 0) ||
    !Number.isFinite(policies.thon.leadUpRelativeImportance) ||
    policies.thon.leadUpRelativeImportance < 0 ||
    policies.thon.leadUpRelativeImportance > 1
  )
    throw new RangeError(
      "Scheduling policies require nonnegative finite values; calendar days must be integers and relative importance must be in [0,1].",
    );
}
/** Find original records whose leading/trailing policies can reach this date range. */
export function policySourceWindow(
  range: { start: string; end: string },
  policies: NonExamPolicies = DEFAULT_NON_EXAM_POLICIES,
) {
  dateOnlySchema.parse(range.start);
  dateOnlySchema.parse(range.end);
  if (range.end <= range.start)
    throw new RangeError("Source range end must follow start.");
  validatePolicies(policies);
  const bufferedDays = (hours: number) =>
    hours === 0 ? 0 : Math.ceil(hours / 24) + 1;
  const trailingDays = Math.max(
    policies.thon.adjacentAvoidDays,
    bufferedDays(policies.majorLocalMusic.afterHours),
  );
  const leadingDays = Math.max(
    policies.thon.leadUpDays,
    policies.thon.adjacentAvoidDays,
    policies.academicBreak.departureDays,
    bufferedDays(policies.majorLocalMusic.beforeHours),
  );
  return {
    start: addCalendarDays(range.start, -trailingDays),
    end: addCalendarDays(range.end, leadingDays),
  };
}
function datedWindow(
  startDate: string,
  endDate: string,
  rest: Omit<NonExamWindow, "startDate" | "endDate">,
): NonExamWindow {
  return { startDate, endDate, ...rest };
}
function timedWindow(
  start: string,
  end: string,
  rest: Omit<NonExamWindow, "start" | "end" | "startDate" | "endDate">,
): NonExamWindow {
  return {
    ...rest,
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    startDate: easternDate(start),
    endDate: addCalendarDays(
      easternDate(new Date(Date.parse(end) - 1).toISOString()),
      1,
    ),
  };
}
function externalWindows(
  event: ExternalEvent,
  policies: NonExamPolicies,
): NonExamWindow[] {
  if (event.category === "thon") {
    const {
      leadUpDays,
      adjacentAvoidDays,
      maximumPolicyImportance,
      leadUpRelativeImportance,
    } = policies.thon;
    const avoidStart = addCalendarDays(event.startDate, -adjacentAvoidDays);
    const avoidEnd = addCalendarDays(event.endDate, adjacentAvoidDays);
    const leadStart = addCalendarDays(event.startDate, -leadUpDays);
    return [
      ...(leadStart < avoidStart
        ? [
            datedWindow(leadStart, avoidStart, {
              kind: "policy",
              guidance: "scheduling-caution",
              label: "Scheduling caution — THON preparation week",
              reason: `Provisional ${leadUpDays}-calendar-day preparation policy; the adjacent avoidance window takes precedence. No student attendance proportion is implied.`,
              internalPolicyImportance:
                maximumPolicyImportance * leadUpRelativeImportance,
              start: easternDayStart(leadStart),
              end: easternDayStart(avoidStart),
            }),
          ]
        : []),
      datedWindow(avoidStart, avoidEnd, {
        kind: "policy",
        guidance: "avoid-scheduling",
        label: "Avoid scheduling — THON",
        reason:
          "Provisional policy covers the day before, all THON event dates, and the day after. This is guidance, not a prohibition or universal unavailability.",
        internalPolicyImportance: maximumPolicyImportance,
        overridesWeakerCautions: true,
        start: easternDayStart(avoidStart),
        end: easternDayStart(avoidEnd),
      }),
    ];
  }
  if (event.impactPolicy === "academic-break") {
    return policies.academicBreak.departureDays === 0
      ? []
      : [
          datedWindow(
            addCalendarDays(
              event.startDate,
              -policies.academicBreak.departureDays,
            ),
            event.startDate,
            {
              kind: "policy",
              guidance: "scheduling-caution",
              label: "Scheduling caution — Students may leave early for break",
              reason: `${event.policyRationale} Provisional early-departure assumption, not an overlapping event or documented student attendance.`,
            },
          ),
        ];
  }
  const special = event.impactPolicy === "major-local-music";
  const description = special
    ? {
        kind: "policy" as const,
        guidance: "scheduling-caution" as const,
        label: "Scheduling caution — Major Local music commitment",
        reason: `${event.policyRationale} Provisional ${policies.majorLocalMusic.beforeHours}-hour before/${policies.majorLocalMusic.afterHours}-hour after buffer; participation is not assumed universally.`,
      }
    : {
        kind: "actual" as const,
        guidance: "review-conflicts" as const,
        label: "Review conflicts",
        reason:
          "Recorded non-exam commitment; no additional buffer is assumed.",
      };
  if (!event.timeKnown)
    return [
      datedWindow(event.startDate, event.endDate, {
        ...description,
        reason: `${description.reason} Exact hours are unknown; this is a date-level caution with no timed density.`,
      }),
    ];
  const before = special ? policies.majorLocalMusic.beforeHours * 3600000 : 0;
  const after = special ? policies.majorLocalMusic.afterHours * 3600000 : 0;
  return [
    timedWindow(
      new Date(Date.parse(event.start) - before).toISOString(),
      new Date(Date.parse(event.end) + after).toISOString(),
      description,
    ),
  ];
}
function engineeringWindows(event: Event): NonExamWindow[] {
  const fair = event.subtype === "career-fair";
  const description = {
    kind: fair ? ("policy" as const) : ("actual" as const),
    guidance: fair
      ? ("scheduling-caution" as const)
      : ("review-conflicts" as const),
    label: fair
      ? "Scheduling caution — Relevant career fair"
      : "Review conflicts",
    reason: fair
      ? "Provisional attendance-impact assumption from Eastern midnight on the fair's first date to its documented finish; no post-fair buffer."
      : "Actual scheduled interval for the documented audience; no extra buffer.",
  };
  return [
    timedWindow(
      event.allDay
        ? easternDayStart(event.start)
        : fair
          ? easternDayStart(easternDate(event.start))
          : event.start,
      event.allDay ? easternDayStart(event.end) : event.end,
      description,
    ),
  ];
}
function constraintsFor(
  context: NonExamContext,
  audience: PlanningAudience,
  policies: NonExamPolicies,
) {
  const cells = audienceCells(audience);
  const input = [
    ...context.events
      .filter((event) => event.status === "published")
      .map((event) => ({ event, engineering: true as const })),
    ...context.externalEvents.map((event) => ({
      event,
      engineering: false as const,
    })),
  ];
  const grouped = new Map<string, NonExamConstraint[]>();
  for (const item of input) {
    const event = item.event;
    const affectedCellIds = cells
      .filter((cell) =>
        item.engineering
          ? eventAudienceMatch(
              event as Event,
              cell.audience,
              context.organizations,
            ).relevant
          : externalEligibility(event as ExternalEvent, cell.audience).eligible,
      )
      .map((cell) => cell.id);
    const external = event as ExternalEvent;
    const eventType: NonExamEventType = item.engineering
      ? "engineering"
      : external.scope === "campus-local"
        ? "local"
        : external.scope;
    const windows = (
      item.engineering
        ? engineeringWindows(event as Event)
        : externalWindows(external, policies)
    ).map((window) => ({
      ...window,
      affectedCellIds,
      eventType,
      source: event.source,
    }));
    const id = `non-exam:${event.id}`;
    const constraint: NonExamConstraint = {
      id,
      eventId: event.id,
      title: event.title,
      eventType,
      eventTypes: [eventType],
      category: event.category,
      sources: [event.source],
      affectedCellIds,
      eligible: !!affectedCellIds.length,
      contextOnly: !affectedCellIds.length,
      timing: item.engineering
        ? (event as Event).allDay
          ? "all-day"
          : "known"
        : external.timeKnown
          ? "known"
          : "date-uncertain",
      windows,
      reason: item.engineering
        ? "Documented event major/college-wide or explicit cluster applicability, intersected with academic-level restrictions; host cluster membership does not imply an audience."
        : external.analysisReason,
      alternatives: [event],
    };
    grouped.set(id, [...(grouped.get(id) ?? []), constraint]);
  }
  return [...grouped.values()]
    .map((records) => {
      const alternatives = [...records].sort((a, b) =>
        JSON.stringify(a.alternatives[0]).localeCompare(
          JSON.stringify(b.alternatives[0]),
        ),
      );
      const first = alternatives[0];
      const timingSignature = (item: NonExamConstraint) =>
        JSON.stringify(
          item.windows.map((window) => [
            window.kind,
            window.startDate,
            window.endDate,
            window.start,
            window.end,
            window.guidance,
          ]),
        );
      const conflicting = alternatives.some(
        (alternative) =>
          timingSignature(alternative) !== timingSignature(first),
      );
      const sources = [
        ...new Map(
          alternatives
            .flatMap((item) => item.sources)
            .map((source) => [JSON.stringify(source), source]),
        ).values(),
      ];
      const affectedCellIds = [
        ...new Set(alternatives.flatMap((item) => item.affectedCellIds)),
      ].sort();
      return {
        ...first,
        sources,
        affectedCellIds,
        eligible: !!affectedCellIds.length,
        contextOnly: !affectedCellIds.length,
        alternatives: alternatives.flatMap((item) => item.alternatives),
        eventTypes: [
          ...new Set(alternatives.flatMap((item) => item.eventTypes)),
        ].sort(),
        ...(conflicting
          ? {
              timing: "source-conflict" as const,
              reason: `${first.reason} Conflicting source timing/policy claims are retained as uncertainty and withheld from timed density.`,
              windows: [
                ...new Map(
                  alternatives
                    .flatMap((item) => item.windows)
                    .map((window) => {
                      const uncertain: NonExamWindow = {
                        ...window,
                        guidance: "review-conflicts",
                        label: "Review conflicts — source timing uncertain",
                        reason:
                          "Conflicting source alternatives require reconciliation; no alternative is selected for timed density.",
                      };
                      return [
                        JSON.stringify([
                          window.startDate,
                          window.endDate,
                          window.start,
                          window.end,
                          window.affectedCellIds,
                          window.eventType,
                          window.source,
                        ]),
                        uncertain,
                      ];
                    }),
                ).values(),
              ],
            }
          : {
              windows: [
                ...new Map(
                  alternatives
                    .flatMap((item) => item.windows)
                    .map((window) => [JSON.stringify(window), window]),
                ).values(),
              ],
            }),
      };
    })
    .filter(
      (item) =>
        item.eventTypes.some((kind) => kind !== "engineering") || item.eligible,
    )
    .sort((a, b) => a.id.localeCompare(b.id));
}
function scopedConstraints(
  constraints: NonExamConstraint[],
  range: NonExamRange,
) {
  return constraints
    .map((item) => {
      const windows = item.windows.filter(
        (window) =>
          overlap(windowInterval(window), range) &&
          (item.contextOnly || !!window.affectedCellIds?.length),
      );
      const affectedCellIds = [
        ...new Set(windows.flatMap((window) => window.affectedCellIds ?? [])),
      ].sort();
      return { ...item, windows, affectedCellIds };
    })
    .filter((item) => item.windows.length > 0);
}
function densitySegments(
  constraints: NonExamConstraint[],
  cells: Cell[],
  range: NonExamRange,
): NonExamDensitySegment[] {
  const start = Date.parse(range.start),
    end = Date.parse(range.end);
  // Unknown source hours (including THON) never acquire invented hourly shading.
  // Documented all-day engineering commitments are listed separately, not timed density.
  const timed = constraints
    .filter((item) => item.eligible && item.timing === "known")
    .flatMap((item) =>
      item.windows
        .filter(
          (window) =>
            window.start &&
            window.end &&
            overlap(window as NonExamRange, range),
        )
        .map((window) => ({
          item,
          window: window as NonExamWindow & NonExamRange,
        })),
    );
  const boundaries = [
    ...new Set([
      start,
      end,
      ...timed.flatMap(({ window }) => [
        Math.max(start, Date.parse(window.start)),
        Math.min(end, Date.parse(window.end)),
      ]),
    ]),
  ].sort((a, b) => a - b);
  return boundaries.slice(0, -1).map((instant, index) => {
    const next = boundaries[index + 1];
    const active = timed.filter(
      ({ window }) =>
        Date.parse(window.start) <= instant && Date.parse(window.end) > instant,
    );
    const measured = cells.map((cell) => {
      const commitmentIds = [
        ...new Set(
          active
            .filter(({ item, window }) =>
              (window.affectedCellIds ?? item.affectedCellIds).includes(
                cell.id,
              ),
            )
            .map(({ item }) => item.eventId),
        ),
      ].sort();
      return {
        id: cell.id,
        majorId: cell.majorId,
        academicLevel: cell.academicLevel,
        count: commitmentIds.length,
        commitmentIds,
      };
    });
    const maximumConcurrent = Math.max(
      0,
      ...measured.map((cell) => cell.count),
    );
    return {
      start: new Date(instant).toISOString(),
      end: new Date(next).toISOString(),
      maximumConcurrent,
      band: nonExamDensityBand(maximumConcurrent),
      cells: measured,
    };
  });
}
const priority: Record<NonExamGuidance, number> = {
  "avoid-scheduling": 3,
  "scheduling-caution": 2,
  "review-conflicts": 1,
};
function cautionFor(
  constraint: NonExamConstraint,
  window: NonExamWindow,
): NonExamCaution {
  const contextOnly = constraint.contextOnly;
  return {
    id: constraint.id,
    eventId: constraint.eventId,
    title: constraint.title,
    guidance: contextOnly ? "review-conflicts" : window.guidance,
    label: contextOnly ? `Context only — ${constraint.title}` : window.label,
    reason: `${window.reason} ${constraint.reason}`,
    contextOnly,
    timingUncertain:
      constraint.timing === "date-uncertain" ||
      constraint.timing === "source-conflict",
    sources: constraint.sources,
    affectedCellIds: constraint.affectedCellIds,
  };
}
function daySummary(
  date: string,
  constraints: NonExamConstraint[],
  cells: Cell[],
  analysisRange: NonExamRange,
): NonExamDay {
  const range = {
    start: new Date(
      Math.max(
        Date.parse(easternDayStart(date)),
        Date.parse(analysisRange.start),
      ),
    ).toISOString(),
    end: new Date(
      Math.min(
        Date.parse(easternDayStart(addCalendarDays(date, 1))),
        Date.parse(analysisRange.end),
      ),
    ).toISOString(),
  };
  const relevant = scopedConstraints(constraints, range);
  const segments = densitySegments(relevant, cells, range);
  const measured = cells.map((cell) => {
    const samples = segments.map((segment) =>
      segment.cells.find((item) => item.id === cell.id)!,
    );
    const maximumConcurrent = Math.max(
      0,
      ...samples.map((sample) => sample.count),
    );
    const commitmentIds = [
      ...new Set(
        samples
          .filter((sample) => sample.count === maximumConcurrent)
          .flatMap((sample) => sample.commitmentIds),
      ),
    ].sort();
    return {
      id: cell.id,
      majorId: cell.majorId,
      academicLevel: cell.academicLevel,
      maximumConcurrent,
      commitmentIds,
    };
  });
  const maximumConcurrent = Math.max(
    0,
    ...measured.map((cell) => cell.maximumConcurrent),
  );
  const cautions = relevant
    .flatMap((item) => {
      const applicable = item.windows.filter((window) =>
        overlap(windowInterval(window), range),
      );
      const strongest = applicable.sort(
        (a, b) => priority[b.guidance] - priority[a.guidance],
      )[0];
      // One ordinary known commitment is factual context, not a day-level conflict.
      const factualOverlap = segments.some((segment) =>
        segment.cells.some(
          (cell) =>
            cell.count >= 2 && cell.commitmentIds.includes(item.eventId),
        ),
      );
      return strongest &&
        (strongest.guidance !== "review-conflicts" ||
          item.timing === "date-uncertain" ||
          item.timing === "source-conflict" ||
          item.contextOnly ||
          factualOverlap)
        ? [cautionFor(item, strongest)]
        : [];
    })
    .sort(
      (a, b) =>
        Number(a.contextOnly) - Number(b.contextOnly) ||
        priority[b.guidance] - priority[a.guidance] ||
        a.id.localeCompare(b.id),
    );
  return {
    date,
    maximumConcurrent,
    band: nonExamDensityBand(maximumConcurrent),
    cells: measured,
    primaryCaution: cautions[0] ?? null,
    cautions,
    constraints: relevant,
    eligibleCommitments: relevant.filter((item) => item.eligible).length,
    contextOnlyCommitments: relevant.filter((item) => item.contextOnly).length,
    timingUncertainties: relevant.filter(
      (item) =>
        item.timing === "date-uncertain" || item.timing === "source-conflict",
    ).length,
    allDayCommitments: relevant.filter(
      (item) => item.eligible && item.timing === "all-day",
    ).length,
  };
}
/**
 * Factual non-exam commitments, independent of exam preparation and display filters.
 * Bands mean 0/1/2/3+ simultaneous commitments in the most affected selected cell.
 * Daily summaries intersect the exact [start,end) analysis range; calendar callers
 * pass complete Eastern date boundaries, while proposals retain their exact hours.
 */
export function analyzeNonExamScheduling(
  context: NonExamContext,
  audience: PlanningAudience,
  range: NonExamRange,
  policies: NonExamPolicies = DEFAULT_NON_EXAM_POLICIES,
): NonExamSchedulingAnalysis {
  instantSchema.parse(range.start);
  instantSchema.parse(range.end);
  if (Date.parse(range.end) <= Date.parse(range.start))
    throw new RangeError("Analysis end must follow start.");
  validatePolicies(policies);
  const constraints = constraintsFor(context, audience, policies);
  const cells = audienceCells(audience);
  const lastDate = easternDate(
    new Date(Date.parse(range.end) - 1).toISOString(),
  );
  const days: NonExamDay[] = [];
  for (
    let date = easternDate(range.start);
    date <= lastDate;
    date = addCalendarDays(date, 1)
  )
    days.push(daySummary(date, constraints, cells, range));
  return {
    score: null,
    overall: { status: "awaiting-methodology-review", score: null },
    constraints: scopedConstraints(constraints, range),
    days,
    timeSegments: densitySegments(constraints, cells, range),
  };
}
