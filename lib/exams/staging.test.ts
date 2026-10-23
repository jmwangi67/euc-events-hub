import { describe, expect, it } from "vitest";
import { syntheticExamImport } from "../../data/fixtures/exam-import";
import {
  importExamJson,
  importPrivateSourcePackage,
  importSourceCsv,
  parseExamCsv,
} from "./import";
import {
  examHasConflict,
  mergeExamDatasets,
  normalizeExamDataset,
  queryStagedExams,
  type ExamClaim,
} from "./staging";
import { preparationEligibility, toReviewedCanonicalExams } from "./canonical";
import { stagedExamCalendarItems } from "../../components/calendar/staged-exam-events";
import {
  combinedExamPreparation,
  examPreparation,
} from "../domain/exam-pressure";
import { analyzePlanningProposal } from "../domain/proposal-analysis";

// Genuinely invented structural cases, not a redaction or copy of source records.
function inventedPackage() {
  return {
    dataset_id: "invented-bulk",
    source: {
      filename: "Invented test source",
      sha256: "a".repeat(64),
      timezone: "America/New_York",
      independently_verified: false,
      publication_authorized: false,
      notes: ["Invented data only"],
    },
    exam_occurrences: Array.from({ length: 84 }, (_, i) => ({
      record_id: `invented-${i}`,
      term_id: "invented-term-2032",
      course_id: `DEMO-SUBJECT-${i % 32}`,
      source_exam_label: "",
      source_section: i < 70 ? "evening_timetable" : "course_testing_window",
      date_options: i < 70 ? ["2032-03-09"] : ["2032-03-09", "2032-03-10"],
      additional_possible_dates: i === 83 ? ["2032-03-12"] : [],
      time_kind: i < 70 ? "evening_schedule_default" : "unknown",
      start_time_et: i < 70 ? "17:10" : null,
      end_time_et: i < 70 ? "18:20" : null,
      time_basis:
        i < 70 ? "Invented source-wide default, not course verification" : null,
      source_confirmation:
        i >= 70 && i < 74 ? "requested_unapproved" : "reported_unverified",
      publication_status: "private_staging",
      section_scope: null,
      relevant_major_ids: null,
      typical_academic_levels: null,
      source_reference: `Invented row ${i}`,
      notes: ["Invented note, with a comma"],
    })),
    other_source_notes: [
      {
        kind: "invented-context",
        explanation: "Not an individual examination",
      },
    ],
  };
}
function reviewed() {
  const dataset = syntheticExamImport();
  dataset.exams = [dataset.exams.find((exam) => exam.id === "invented-exact")!];
  dataset.sources[0].independentlyVerified = true;
  dataset.sources[0].permissions.planner = true;
  const claim = dataset.exams[0].claims[0];
  claim.sourceStatus = "confirmed";
  claim.publicationStatus = "approved-for-planner";
  claim.audience = {
    reviewed: true,
    majorIds: ["bme"],
    academicLevels: ["third"],
  };
  claim.timing = {
    kind: "timed",
    timeZone: "America/New_York",
    start: "2032-03-16T09:00:00-04:00",
    end: "2032-03-16T10:00:00-04:00",
    basis: "explicit",
    basisNote: null,
  };
  return dataset;
}

describe("versioned staging and source import", () => {
  it("normalizes an invented 84-record structural case without losing options or inventing eligibility", () => {
    const result = importPrivateSourcePackage(inventedPackage());
    expect(result.summary).toMatchObject({
      occurrences: 84,
      courses: 32,
      reportedDateOptions: 98,
      additionalPossibleDates: 1,
      requestedUnapproved: 4,
      sourceDefaultHours: 70,
      untimed: 14,
      conflictingOccurrences: 0,
      unknownSections: 84,
      unreviewedAudiences: 84,
    });
    expect(toReviewedCanonicalExams(result.dataset)).toEqual([]);
    expect(
      result.dataset.exams.every(
        (exam) => exam.claims[0].publicationStatus === "private-staging",
      ),
    ).toBe(true);
    expect(result.dataset.exams[0].claims[0].designation).toBeNull();
    expect(result.dataset.sourceNotes).toHaveLength(1);
  });
  it("imports equivalent invented CSV structural records, quoted notes, and unknown mappings", () => {
    const raw = inventedPackage();
    const fields = [
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
    ] as const;
    const quote = (value: unknown) =>
      `"${String(Array.isArray(value) ? value.join(";") : (value ?? "")).replaceAll('"', '""')}"`;
    const csv =
      fields.join(",") +
      "\r\n" +
      raw.exam_occurrences
        .map((row) => fields.map((field) => quote(row[field])).join(","))
        .join("\r\n");
    const imported = importSourceCsv(csv, {
      datasetId: "invented-csv",
      sourceLabel: "Invented CSV",
      checksum: "b".repeat(64),
    });
    expect(imported.summary).toMatchObject({
      occurrences: 84,
      reportedDateOptions: 98,
      additionalPossibleDates: 1,
      unreviewedAudiences: 84,
    });
    expect(imported.dataset.exams[0].claims[0].notes).toEqual([
      "Invented note, with a comma",
    ]);
  });
  it("preserves quoted CSV newlines and escapes", () =>
    expect(parseExamCsv('a,b\r\n"one\nline","quoted ""text"""')).toEqual([
      { a: "one\nline", b: 'quoted "text"' },
    ]));
  it.each(["a,a\n1,2", "a,b\n1", 'a,b\n"unterminated,2', 'a,b\n"x"garbage,2'])(
    "rejects malformed CSV atomically",
    (csv) => expect(() => parseExamCsv(csv)).toThrow(),
  );
  it("rejects missing required CSV columns", () =>
    expect(() =>
      importSourceCsv("a\n1", {
        datasetId: "x",
        sourceLabel: "Invented",
        checksum: "a".repeat(64),
      }),
    ).toThrow(/required/));
  it("rejects malformed records without returning a partial import", () => {
    const raw = inventedPackage();
    raw.exam_occurrences[83].date_options = ["2032-02-30"];
    expect(() => importPrivateSourcePackage(raw)).toThrow();
    expect(() => importExamJson({ schemaVersion: 2 })).toThrow();
  });
  it("rejects mixed terms and unregistered source references", () => {
    const dataset = syntheticExamImport();
    dataset.exams[0].claims[0].termId = "another-term";
    expect(() => normalizeExamDataset(dataset)).toThrow();
    dataset.exams[0].claims[0].termId = dataset.termId;
    dataset.exams[0].claims[0].sourceId = "not-registered";
    expect(() => normalizeExamDataset(dataset)).toThrow();
  });
  it("keeps reimports idempotent, canonical IDs stable, and duplicate diagnostics explicit", () => {
    const dataset = syntheticExamImport();
    const repeated = mergeExamDatasets(dataset, dataset);
    expect(repeated.dataset).toEqual(dataset);
    expect(repeated.summary.duplicateOccurrences).toBe(4);
    expect(repeated.summary.duplicateClaims).toBe(4);
    expect(normalizeExamDataset(repeated.dataset).dataset).toEqual(dataset);
  });
  it("does not overwrite conflicting metadata or another term", () => {
    const first = syntheticExamImport(),
      second = syntheticExamImport();
    second.sources[0].permissions.public = true;
    expect(() => mergeExamDatasets(first, second)).toThrow(/source ID/);
    second.termId = "other-term";
    expect(() => mergeExamDatasets(first, second)).toThrow(/terms/);
  });
});

describe("date alternatives, clocks and canonical uncertainty", () => {
  it("queries an optional third day as one canonical exam and labels it possible in the adapter", () => {
    const dataset = syntheticExamImport();
    const matches = queryStagedExams(dataset, "2032-03-12", "2032-03-13");
    expect(matches.map((exam) => exam.id)).toEqual([
      "invented-request",
      "invented-window",
    ]);
    const window = matches.find((exam) => exam.id === "invented-window")!;
    const items = stagedExamCalendarItems([window], dataset);
    expect(
      new Set(items.map((item) => item.extendedProps!.canonicalExamId)).size,
    ).toBe(1);
    expect(
      items.filter((item) => item.classNames?.includes("exam-possible-date")),
    ).toHaveLength(1);
    expect(
      items.every((item) => item.allDay && !String(item.start).includes("T")),
    ).toBe(true);
    expect(queryStagedExams(dataset, "2032-03-13", "2032-03-14")).toEqual([]);
  });
  it("rejects duplicate/overlapping options and backwards/oversized windows", () => {
    const dataset = syntheticExamImport();
    const claim = dataset.exams[0].claims[0];
    claim.timing = {
      kind: "date-options",
      timeZone: "America/New_York",
      reportedDates: ["2032-03-09", "2032-03-09"],
      additionalPossibleDates: [],
    };
    expect(() => normalizeExamDataset(dataset)).toThrow();
    claim.timing = {
      kind: "date-options",
      timeZone: "America/New_York",
      reportedDates: ["2032-03-09"],
      additionalPossibleDates: ["2032-03-09"],
    };
    expect(() => normalizeExamDataset(dataset)).toThrow();
    claim.timing = {
      kind: "date-window",
      timeZone: "America/New_York",
      startDate: "2032-03-10",
      endDateExclusive: "2032-03-09",
      additionalPossibleDates: [],
    };
    expect(() => normalizeExamDataset(dataset)).toThrow();
  });
  it("preserves all conflicting claims, narrow-range intersections and deterministic ordering", () => {
    const dataset = reviewed();
    const original = structuredClone(dataset.exams[0]);
    const other = structuredClone(original);
    other.claims[0].timing = {
      kind: "date-only",
      timeZone: "America/New_York",
      date: "2032-03-18",
    };
    const result = normalizeExamDataset({
      ...dataset,
      exams: [original, other],
    });
    expect(result.summary.conflictingOccurrences).toBe(1);
    expect(result.dataset.exams[0].claims).toHaveLength(2);
    expect(
      queryStagedExams(result.dataset, "2032-03-18", "2032-03-19"),
    ).toHaveLength(1);
    expect(toReviewedCanonicalExams(result.dataset)).toEqual([]);
    expect(
      normalizeExamDataset({ ...dataset, exams: [other, original] }).dataset,
    ).toEqual(result.dataset);
  });
  it("recognizes equivalent instant claims while preserving original source offsets", () => {
    const dataset = reviewed(),
      claim = structuredClone(dataset.exams[0].claims[0]);
    if (claim.timing.kind !== "timed") throw new Error("fixture");
    claim.timing.start = new Date(claim.timing.start).toISOString();
    claim.timing.end = new Date(claim.timing.end).toISOString();
    claim.sourceReference = "Invented second source reference";
    dataset.exams[0].claims.push(claim);
    expect(examHasConflict(dataset.exams[0])).toBe(false);
    const converted = toReviewedCanonicalExams(dataset);
    expect(converted[0].start).toBe(converted[1].start);
    expect(dataset.exams[0].claims[0].timing).toMatchObject({
      start: "2032-03-16T09:00:00-04:00",
    });
  });
  it("rejects unsupported Eastern clock gaps/folds rather than choosing a late or repeated time", () => {
    const raw = inventedPackage();
    raw.exam_occurrences = raw.exam_occurrences.slice(0, 1);
    const row = raw.exam_occurrences[0];
    row.date_options = ["2028-03-12"];
    row.start_time_et = "02:30";
    expect(() => importPrivateSourcePackage(raw)).toThrow(/does not exist/);
    row.date_options = ["2028-11-05"];
    row.start_time_et = "01:10";
    row.end_time_et = "01:50";
    expect(() => importPrivateSourcePackage(raw)).toThrow(/twice/);
  });
  it("accepts explicit DST/cross-midnight instants and preserves exclusive date-query ends", () => {
    const dataset = reviewed();
    const timing = dataset.exams[0].claims[0].timing;
    if (timing.kind !== "timed") throw new Error("fixture");
    timing.start = "2028-11-05T01:30:00-04:00";
    timing.end = "2028-11-05T01:30:00-05:00";
    expect(normalizeExamDataset(dataset).summary.occurrences).toBe(1);
    expect(Date.parse(timing.end) - Date.parse(timing.start)).toBe(3600000);
    timing.start = "2032-12-31T23:30:00-05:00";
    timing.end = "2033-01-01T00:30:00-05:00";
    expect(queryStagedExams(dataset, "2033-01-01", "2033-01-02")).toHaveLength(
      1,
    );
    expect(queryStagedExams(dataset, "2033-01-02", "2033-01-03")).toHaveLength(
      0,
    );
    timing.end = timing.start;
    expect(() => normalizeExamDataset(dataset)).toThrow();
  });
});

describe("reviewed model integration preserves existing mathematics", () => {
  it.each(["private-staging", "draft", "pending-review", "archived"] as const)(
    "keeps %s out of numerical preparation",
    (status) => {
      const dataset = reviewed();
      dataset.exams[0].claims[0].publicationStatus = status;
      expect(toReviewedCanonicalExams(dataset)).toEqual([]);
    },
  );
  it.each([
    "reported-unverified",
    "requested-unapproved",
    "conflicting",
  ] as const)("does not promote %s into exact constraints", (status) => {
    const dataset = reviewed();
    dataset.exams[0].claims[0].sourceStatus = status;
    expect(toReviewedCanonicalExams(dataset)).toEqual([]);
  });
  it("requires independent source/permission/audience review and keeps multi-date/default-hour records review-only", () => {
    for (const edit of [
      (d: ReturnType<typeof reviewed>) => {
        d.sources[0].permissions.planner = false;
      },
      (d: ReturnType<typeof reviewed>) => {
        d.sources[0].independentlyVerified = false;
      },
      (d: ReturnType<typeof reviewed>) => {
        d.exams[0].claims[0].audience.reviewed = false;
      },
      (d: ReturnType<typeof reviewed>) => {
        d.exams[0].claims[0].audience.academicLevels = [];
      },
      (d: ReturnType<typeof reviewed>) => {
        d.exams[0].claims[0].timing = {
          kind: "date-options",
          timeZone: "America/New_York",
          reportedDates: ["2032-03-16", "2032-03-17"],
          additionalPossibleDates: [],
        };
      },
      (d: ReturnType<typeof reviewed>) => {
        const t = d.exams[0].claims[0].timing;
        if (t.kind === "timed") {
          t.basis = "source-default";
          t.basisNote = "Invented default";
        }
      },
    ]) {
      const dataset = reviewed();
      edit(dataset);
      expect(preparationEligibility(dataset.exams[0], dataset).eligible).toBe(
        false,
      );
    }
  });
  it("retains the established numerical reference/cutoff and does not pool audience cells or duplicate exams", () => {
    const dataset = reviewed();
    const other: ExamClaim = {
      ...structuredClone(dataset.exams[0].claims[0]),
      audience: {
        reviewed: true,
        majorIds: ["che"],
        academicLevels: ["first"],
      },
    };
    dataset.exams[0].claims.push(other);
    const exams = toReviewedCanonicalExams(dataset),
      at = "2032-03-15T19:00:00-04:00";
    expect(
      examPreparation(exams[0], at, {
        majorIds: ["bme"],
        academicLevels: ["third"],
      }).value,
    ).toBeCloseTo(8.650970974603, 10);
    expect(
      examPreparation(exams[0], "2032-03-16T09:00:00-04:00", {
        majorIds: ["bme"],
        academicLevels: ["third"],
      }).value,
    ).toBe(0);
    const result = combinedExamPreparation([...exams, ...exams], at, {
      majorIds: ["bme", "che"],
      academicLevels: ["first", "third"],
    });
    expect(result.cells).toHaveLength(4);
    expect(result.cells.every((cell) => cell.contributions.length === 1)).toBe(
      true,
    );
    const analysis = analyzePlanningProposal(
      {
        title: "Invented integration proposal",
        start: at,
        end: "2032-03-15T20:00:00-04:00",
        majorIds: ["bme"],
      },
      { events: [], externalEvents: [], organizations: [], exams },
    );
    expect(analysis.nonExam.constraints).toEqual([]);
    expect(
      analysis.nonExam.timeSegments.every(
        (segment) => segment.maximumConcurrent === 0,
      ),
    ).toBe(true);
    expect(analysis.overall.score).toBeNull();
  });
  it("uses existing unknown-hour bounds for a reviewed single date, never a fabricated point", () => {
    const dataset = reviewed();
    dataset.exams[0].claims[0].timing = {
      kind: "date-only",
      timeZone: "America/New_York",
      date: "2032-03-16",
    };
    const [exam] = toReviewedCanonicalExams(dataset);
    const result = examPreparation(exam, "2032-03-16T12:00:00-04:00", {
      majorIds: ["bme"],
      academicLevels: ["third"],
    });
    expect(result.value).toBeNull();
    expect(result.range).toEqual([0, 10]);
    expect(exam.timeKnown).toBe(false);
  });
});
