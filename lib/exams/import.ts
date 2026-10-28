import { z } from "zod";
import { dateOnlySchema } from "../domain/models";
import { resolveEasternLocal } from "../time/eastern-local";
import {
  normalizeExamDataset,
  type ExamClaim,
  type ExamTiming,
} from "./staging";

const nonempty = z.string().trim().min(1);
const rawRecordSchema = z
  .object({
    record_id: nonempty,
    term_id: nonempty,
    course_id: nonempty,
    source_exam_label: z.string().nullable(),
    source_section: z.string().nullable().optional(),
    date_options: z.array(dateOnlySchema).min(1),
    additional_possible_dates: z.array(dateOnlySchema),
    time_kind: z.enum(["unknown", "evening_schedule_default", "exact"]),
    start_time_et: z.string().nullable(),
    end_time_et: z.string().nullable(),
    time_basis: z.string().nullable().optional(),
    source_confirmation: z.enum([
      "confirmed",
      "reported_unverified",
      "requested_unapproved",
      "conflicting",
    ]),
    publication_status: z.literal("private_staging"),
    section_scope: z.array(nonempty).nullable().optional(),
    relevant_major_ids: z.array(nonempty).nullable().optional(),
    typical_academic_levels: z.array(nonempty).nullable().optional(),
    source_reference: nonempty,
    notes: z.array(nonempty),
  })
  .strict()
  .superRefine((record, ctx) => {
    if (
      new Set(record.date_options).size !== record.date_options.length ||
      new Set(record.additional_possible_dates).size !==
        record.additional_possible_dates.length ||
      record.additional_possible_dates.some((date) =>
        record.date_options.includes(date),
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["date_options"],
        message:
          "Reported and possible date options must be unique and disjoint.",
      });
    if (
      record.time_kind === "unknown" &&
      (record.start_time_et || record.end_time_et)
    )
      ctx.addIssue({
        code: "custom",
        path: ["time_kind"],
        message: "Unknown hours must not contain clocks.",
      });
    if (
      record.time_kind !== "unknown" &&
      (record.date_options.length !== 1 ||
        record.additional_possible_dates.length ||
        !record.start_time_et ||
        !record.end_time_et)
    )
      ctx.addIssue({
        code: "custom",
        path: ["time_kind"],
        message: "A timed source row needs exactly one date and both clocks.",
      });
  });
const privatePackageSchema = z.object({
  dataset_id: nonempty,
  source: z.object({
    filename: nonempty,
    sha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
    timezone: z.literal("America/New_York"),
    independently_verified: z.literal(false),
    publication_authorized: z.literal(false),
    notes: z.array(nonempty),
  }),
  exam_occurrences: z.array(rawRecordSchema).min(1),
  other_source_notes: z.array(z.record(z.string(), z.unknown())).optional(),
});
function sourceTiming(
  record: z.infer<typeof rawRecordSchema>,
  row: number,
): ExamTiming {
  if (record.time_kind === "unknown")
    return record.date_options.length === 1 &&
      !record.additional_possible_dates.length
      ? {
          kind: "date-only",
          timeZone: "America/New_York",
          date: record.date_options[0],
        }
      : {
          kind: "date-options",
          timeZone: "America/New_York",
          reportedDates: record.date_options,
          additionalPossibleDates: record.additional_possible_dates,
        };
  try {
    const start = resolveEasternLocal(
      record.date_options[0],
      record.start_time_et!,
    );
    const end = resolveEasternLocal(
      record.date_options[0],
      record.end_time_et!,
    );
    if (Date.parse(end) <= Date.parse(start))
      throw new Error(
        "End must follow start; use version 1 explicit instants for overnight exams.",
      );
    return {
      kind: "timed",
      timeZone: "America/New_York",
      start,
      end,
      basis: record.time_kind === "exact" ? "explicit" : "source-default",
      basisNote:
        record.time_basis ??
        (record.time_kind === "evening_schedule_default"
          ? "Source-wide default hours supplied by the import row; not independently verified per course."
          : null),
    };
  } catch (error) {
    throw new Error(
      `exam_occurrences.${row}.timing: ${error instanceof Error ? error.message : "Invalid Eastern clocks."}`,
    );
  }
}
/** Compatibility adapter for the supplied private, unversioned source package. No course/date constants. */
export function importPrivateSourcePackage(input: unknown) {
  const parsed = privatePackageSchema.parse(input);
  const sourceId = `source:${parsed.source.sha256}`;
  const termId = parsed.exam_occurrences[0].term_id;
  return normalizeExamDataset({
    schemaVersion: 1,
    datasetId: parsed.dataset_id,
    termId,
    timeZone: parsed.source.timezone,
    sources: [
      {
        id: sourceId,
        label: parsed.source.filename,
        checksum: parsed.source.sha256,
        independentlyVerified: false,
        permissions: { planner: false, public: false },
        notes: parsed.source.notes,
      },
    ],
    sourceNotes: (parsed.other_source_notes ?? []).map((note) =>
      JSON.stringify(note),
    ),
    exams: parsed.exam_occurrences.map((record, i) => ({
      id: record.record_id,
      claims: [
        {
          courseId: record.course_id,
          termId: record.term_id,
          designation: record.source_exam_label || null,
          sections: record.section_scope ?? null,
          // Source columns are not a reviewed audience mapping, even if populated.
          audience: {
            reviewed: false,
            majorIds: record.relevant_major_ids ?? [],
            academicLevels: record.typical_academic_levels ?? [],
          },
          timing: sourceTiming(record, i),
          sourceId,
          importBatchId: parsed.dataset_id,
          sourceReference: record.source_reference,
          sourceSection: record.source_section ?? null,
          sourceStatus: record.source_confirmation.replaceAll(
            "_",
            "-",
          ) as ExamClaim["sourceStatus"],
          publicationStatus: "private-staging",
          notes: record.notes,
        },
      ],
    })),
  });
}

/** RFC 4180-style quoted fields/newlines; malformed tables fail atomically. */
export function parseExamCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  const content = input.replace(/^\uFEFF/, "");
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (quoted) {
      if (char === '"' && content[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
        closed = true;
      } else cell += char;
    } else if (char === '"') {
      if (cell || closed)
        throw new Error(`CSV row ${rows.length + 1}: misplaced quote.`);
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
      closed = false;
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && content[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      closed = false;
    } else {
      if (closed)
        throw new Error(
          `CSV row ${rows.length + 1}: text after closing quote.`,
        );
      cell += char;
    }
  }
  if (quoted) throw new Error("CSV: unterminated quoted field.");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  const header = rows.shift();
  if (
    !header?.length ||
    header.some((name) => !name) ||
    new Set(header).size !== header.length
  )
    throw new Error("CSV needs unique nonempty column names.");
  return rows.map((values, index) => {
    if (values.length !== header.length)
      throw new Error(`CSV row ${index + 2}: wrong field count.`);
    return Object.fromEntries(header.map((key, i) => [key, values[i]]));
  });
}
export function importSourceCsv(
  input: string,
  metadata: { datasetId: string; sourceLabel: string; checksum: string },
) {
  const split = (value: string | undefined) =>
    (value ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean);
  const rows = parseExamCsv(input);
  const required = [
    "record_id",
    "term_id",
    "course_id",
    "source_exam_label",
    "date_options",
    "additional_possible_dates",
    "time_kind",
    "start_time_et",
    "end_time_et",
    "source_confirmation",
    "publication_status",
    "source_reference",
    "notes",
  ];
  if (!rows.length || required.some((key) => !(key in rows[0])))
    throw new Error("CSV is missing required exam staging columns.");
  return importPrivateSourcePackage({
    dataset_id: metadata.datasetId,
    source: {
      filename: metadata.sourceLabel,
      sha256: metadata.checksum,
      timezone: "America/New_York",
      independently_verified: false,
      publication_authorized: false,
      notes: [
        "CSV source claims require review; no publication rights are inferred.",
      ],
    },
    exam_occurrences: rows.map((row) => ({
      ...row,
      date_options: split(row.date_options),
      additional_possible_dates: split(row.additional_possible_dates),
      start_time_et: row.start_time_et || null,
      end_time_et: row.end_time_et || null,
      notes: split(row.notes),
    })),
  });
}
export function importExamJson(input: unknown) {
  return input && typeof input === "object" && "schemaVersion" in input
    ? normalizeExamDataset(input)
    : importPrivateSourcePackage(input);
}
