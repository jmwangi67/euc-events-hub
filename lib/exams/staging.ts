import { z } from "zod";
import {
  academicLevelSchema,
  dateOnlySchema,
  instantSchema,
} from "../domain/models";
import { addCalendarDays, easternDate, easternDayStart } from "../time/eastern";

const text = z.string().trim().min(1).max(4000);
const zone = z.literal("America/New_York");
const dates = z.array(dateOnlySchema).max(366);
export const sourceConfirmationSchema = z.enum([
  "confirmed",
  "reported-unverified",
  "requested-unapproved",
  "conflicting",
]);
export const examPublicationSchema = z.enum([
  "private-staging",
  "draft",
  "pending-review",
  "approved-for-planner",
  "approved-for-public",
  "archived",
]);
export const examTimingSchema = z
  .discriminatedUnion("kind", [
    z
      .object({
        kind: z.literal("timed"),
        timeZone: zone,
        start: instantSchema,
        end: instantSchema,
        basis: z.enum(["explicit", "source-default"]),
        basisNote: text.nullable().default(null),
      })
      .strict(),
    z
      .object({
        kind: z.literal("date-only"),
        timeZone: zone,
        date: dateOnlySchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("date-options"),
        timeZone: zone,
        reportedDates: dates.min(1),
        additionalPossibleDates: dates.default([]),
      })
      .strict(),
    z
      .object({
        kind: z.literal("date-window"),
        timeZone: zone,
        startDate: dateOnlySchema,
        endDateExclusive: dateOnlySchema,
        additionalPossibleDates: dates.default([]),
      })
      .strict(),
  ])
  .superRefine((timing, ctx) => {
    if (timing.kind === "timed") {
      if (Date.parse(timing.end) <= Date.parse(timing.start))
        ctx.addIssue({
          code: "custom",
          path: ["end"],
          message: "End must follow start.",
        });
      if (timing.basis === "source-default" && !timing.basisNote)
        ctx.addIssue({
          code: "custom",
          path: ["basisNote"],
          message:
            "Explain the source-wide default; it is not course-specific verification.",
        });
    }
    if (timing.kind === "date-window") {
      const days =
        (Date.parse(timing.endDateExclusive) - Date.parse(timing.startDate)) /
        86400000;
      if (!(days > 0 && days <= 366))
        ctx.addIssue({
          code: "custom",
          path: ["endDateExclusive"],
          message:
            "A testing window must span 1–366 calendar dates, with an exclusive end.",
        });
    }
    if (timing.kind === "date-options" || timing.kind === "date-window") {
      const reported =
        timing.kind === "date-options" ? timing.reportedDates : [];
      const possible = timing.additionalPossibleDates;
      if (
        new Set(reported).size !== reported.length ||
        new Set(possible).size !== possible.length
      )
        ctx.addIssue({
          code: "custom",
          message: "Date options must not contain duplicates.",
        });
      if (
        possible.some((date) =>
          timing.kind === "date-options"
            ? reported.includes(date)
            : date >= timing.startDate && date < timing.endDateExclusive,
        )
      )
        ctx.addIssue({
          code: "custom",
          path: ["additionalPossibleDates"],
          message:
            "Additional possible dates must be distinct from reported dates.",
        });
    }
  });
export const examSourceSchema = z
  .object({
    id: text,
    label: text,
    checksum: z
      .string()
      .regex(/^[a-fA-F0-9]{64}$/)
      .nullable()
      .default(null),
    independentlyVerified: z.boolean(),
    permissions: z
      .object({ planner: z.boolean(), public: z.boolean() })
      .strict(),
    notes: z.array(text).default([]),
  })
  .strict();
export const examClaimSchema = z
  .object({
    courseId: text,
    termId: text,
    designation: text.nullable().default(null),
    sections: z.array(text).nullable().default(null),
    audience: z
      .object({
        reviewed: z.boolean(),
        majorIds: z.array(text),
        academicLevels: z.array(academicLevelSchema),
      })
      .strict(),
    timing: examTimingSchema,
    sourceId: text,
    importBatchId: text,
    sourceReference: text,
    sourceSection: text.nullable().default(null),
    sourceStatus: sourceConfirmationSchema,
    publicationStatus: examPublicationSchema,
    notes: z.array(text).default([]),
  })
  .strict();
export const stagedExamDatasetSchema = z
  .object({
    schemaVersion: z.literal(1),
    datasetId: text,
    termId: text,
    timeZone: zone,
    sources: z.array(examSourceSchema).min(1).max(1000),
    exams: z
      .array(
        z
          .object({
            id: text,
            claims: z.array(examClaimSchema).min(1).max(1000),
          })
          .strict(),
      )
      .max(10000),
    sourceNotes: z.array(text).default([]),
  })
  .strict()
  .superRefine((dataset, ctx) => {
    const ids = dataset.sources.map((source) => source.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        path: ["sources"],
        message:
          "Source IDs must be unique; reconcile conflicting source metadata.",
      });
    dataset.exams.forEach((exam, i) =>
      exam.claims.forEach((claim, j) => {
        if (!ids.includes(claim.sourceId))
          ctx.addIssue({
            code: "custom",
            path: ["exams", i, "claims", j, "sourceId"],
            message: "Source ID is not registered in this dataset.",
          });
        if (claim.termId !== dataset.termId)
          ctx.addIssue({
            code: "custom",
            path: ["exams", i, "claims", j, "termId"],
            message: "Claim term must match the dataset term.",
          });
      }),
    );
  });
export type ExamTiming = z.infer<typeof examTimingSchema>;
export type ExamClaim = z.infer<typeof examClaimSchema>;
export type StagedExamDataset = z.infer<typeof stagedExamDatasetSchema>;
export type StagedExam = StagedExamDataset["exams"][number];

export function reportedDates(timing: ExamTiming): string[] {
  if (timing.kind === "timed") return [easternDate(timing.start)];
  if (timing.kind === "date-only") return [timing.date];
  if (timing.kind === "date-options") return [...timing.reportedDates];
  const result: string[] = [];
  for (
    let date = timing.startDate;
    date < timing.endDateExclusive;
    date = addCalendarDays(date, 1)
  )
    result.push(date);
  return result;
}
export function possibleDates(timing: ExamTiming) {
  return "additionalPossibleDates" in timing
    ? timing.additionalPossibleDates
    : [];
}
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${JSON.stringify(key)}:${stableJson(val)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export function examHasConflict(exam: StagedExam) {
  return (
    exam.claims.some((claim) => claim.sourceStatus === "conflicting") ||
    new Set(
      exam.claims.map((claim) =>
        stableJson({
          courseId: claim.courseId,
          termId: claim.termId,
          timing:
            claim.timing.kind === "timed"
              ? {
                  kind: "timed",
                  start: Date.parse(claim.timing.start),
                  end: Date.parse(claim.timing.end),
                  basis: claim.timing.basis,
                }
              : {
                  ...claim.timing,
                  ...("reportedDates" in claim.timing
                    ? { reportedDates: [...claim.timing.reportedDates].sort() }
                    : {}),
                  ...("additionalPossibleDates" in claim.timing
                    ? {
                        additionalPossibleDates: [
                          ...claim.timing.additionalPossibleDates,
                        ].sort(),
                      }
                    : {}),
                },
        }),
      ),
    ).size > 1
  );
}
export function mergeExamDatasets(
  existing: StagedExamDataset,
  incoming: StagedExamDataset,
) {
  if (existing.termId !== incoming.termId)
    throw new Error("Cannot merge different academic terms.");
  const sources = new Map(
    existing.sources.map((source) => [source.id, source]),
  );
  for (const source of incoming.sources) {
    if (
      sources.has(source.id) &&
      stableJson(sources.get(source.id)) !== stableJson(source)
    )
      throw new Error(
        "A source ID has conflicting metadata; reconcile it before import.",
      );
    sources.set(source.id, source);
  }
  return normalizeExamDataset({
    ...existing,
    sources: [...sources.values()],
    exams: [...existing.exams, ...incoming.exams],
    sourceNotes: [
      ...new Set([...existing.sourceNotes, ...incoming.sourceNotes]),
    ],
  });
}

/** Validate atomically, reconcile exact repeats, and retain all conflicting source claims. */
export function normalizeExamDataset(input: unknown) {
  const parsed = stagedExamDatasetSchema.parse(input);
  const groups = new Map<string, Map<string, ExamClaim>>();
  let duplicateClaims = 0;
  for (const exam of parsed.exams) {
    const group = groups.get(exam.id) ?? new Map<string, ExamClaim>();
    for (const claim of exam.claims) {
      const key = stableJson(claim);
      if (group.has(key)) duplicateClaims++;
      group.set(key, claim);
    }
    groups.set(exam.id, group);
  }
  const dataset: StagedExamDataset = {
    ...parsed,
    sources: [...parsed.sources].sort((a, b) => a.id.localeCompare(b.id)),
    exams: [...groups]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, claims]) => ({
        id,
        claims: [...claims]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, claim]) => claim),
      })),
  };
  return {
    dataset,
    summary: {
      occurrences: dataset.exams.length,
      claims: dataset.exams.reduce((n, e) => n + e.claims.length, 0),
      duplicateOccurrences: parsed.exams.length - dataset.exams.length,
      duplicateClaims,
      conflictingOccurrences: dataset.exams.filter(examHasConflict).length,
      courses: new Set(
        dataset.exams.flatMap((e) => e.claims.map((c) => c.courseId)),
      ).size,
      reportedDateOptions: dataset.exams.reduce(
        (n, e) =>
          n + new Set(e.claims.flatMap((c) => reportedDates(c.timing))).size,
        0,
      ),
      additionalPossibleDates: dataset.exams.reduce(
        (n, e) =>
          n + new Set(e.claims.flatMap((c) => possibleDates(c.timing))).size,
        0,
      ),
      unknownSections: dataset.exams.filter((e) =>
        e.claims.some((c) => !c.sections?.length),
      ).length,
      unreviewedAudiences: dataset.exams.filter((e) =>
        e.claims.some(
          (c) => !c.audience.reviewed || !c.audience.majorIds.length,
        ),
      ).length,
      requestedUnapproved: dataset.exams.filter((e) =>
        e.claims.some((c) => c.sourceStatus === "requested-unapproved"),
      ).length,
      sourceDefaultHours: dataset.exams.filter((e) =>
        e.claims.some(
          (c) =>
            c.timing.kind === "timed" && c.timing.basis === "source-default",
        ),
      ).length,
      untimed: dataset.exams.filter((e) =>
        e.claims.some((c) => c.timing.kind !== "timed"),
      ).length,
    },
  };
}
/** One canonical occurrence per result, including intersections with possible-only dates. */
export function queryStagedExams(
  dataset: StagedExamDataset,
  start: string,
  end: string,
) {
  dateOnlySchema.parse(start);
  dateOnlySchema.parse(end);
  if (end <= start) throw new RangeError("Window end must follow start.");
  return dataset.exams.filter((exam) =>
    exam.claims.some(({ timing }) =>
      timing.kind === "timed"
        ? Date.parse(timing.start) < Date.parse(easternDayStart(end)) &&
          Date.parse(timing.end) > Date.parse(easternDayStart(start))
        : [...reportedDates(timing), ...possibleDates(timing)].some(
            (date) => date >= start && date < end,
          ),
    ),
  );
}
