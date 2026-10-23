import { normalizeExamDataset } from "../../lib/exams/staging";
/** Entirely invented test records. No course, date, ID or text is copied from the private source. */
export function syntheticExamImport() {
  const claim = {
    courseId: "DEMO-LAB-A",
    termId: "invented-term-2032",
    designation: "Invented assessment",
    sections: null,
    audience: { reviewed: false, majorIds: [], academicLevels: [] },
    sourceId: "invented-source",
    importBatchId: "invented-batch",
    sourceReference: "Invented test reference",
    sourceStatus: "reported-unverified",
    publicationStatus: "private-staging",
    notes: ["Invented synthetic scenario only."],
  };
  return normalizeExamDataset({
    schemaVersion: 1,
    datasetId: "invented-review-dataset",
    termId: "invented-term-2032",
    timeZone: "America/New_York",
    sources: [
      {
        id: "invented-source",
        label: "Invented synthetic source; not an official schedule",
        independentlyVerified: false,
        permissions: { planner: false, public: false },
        notes: [],
      },
    ],
    exams: [
      {
        id: "invented-window",
        claims: [
          {
            ...claim,
            timing: {
              kind: "date-options",
              timeZone: "America/New_York",
              reportedDates: ["2032-03-09", "2032-03-10"],
              additionalPossibleDates: ["2032-03-12"],
            },
          },
        ],
      },
      {
        id: "invented-request",
        claims: [
          {
            ...claim,
            courseId: "DEMO-LAB-B",
            sourceStatus: "requested-unapproved",
            timing: {
              kind: "date-window",
              timeZone: "America/New_York",
              startDate: "2032-03-11",
              endDateExclusive: "2032-03-13",
              additionalPossibleDates: [],
            },
          },
        ],
      },
      {
        id: "invented-default",
        claims: [
          {
            ...claim,
            courseId: "DEMO-LAB-C",
            timing: {
              kind: "timed",
              timeZone: "America/New_York",
              start: "2032-03-09T17:10:00-05:00",
              end: "2032-03-09T18:20:00-05:00",
              basis: "source-default",
              basisNote:
                "Invented timetable default, not individual time verification.",
            },
          },
        ],
      },
      {
        id: "invented-exact",
        claims: [
          {
            ...claim,
            courseId: "DEMO-LAB-D",
            timing: {
              kind: "timed",
              timeZone: "America/New_York",
              start: "2032-03-10T12:10:00-05:00",
              end: "2032-03-10T13:00:00-05:00",
              basis: "explicit",
              basisNote: null,
            },
          },
        ],
      },
    ],
    sourceNotes: [
      "All records are invented; this is a separate explicit browser-test dataset.",
    ],
  }).dataset;
}
