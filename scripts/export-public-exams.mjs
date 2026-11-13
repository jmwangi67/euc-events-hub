import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

// This approval covers one normalized archive. A changed source requires review.
const approvedHash =
  "8ed9f21177ad29dc79596a655b4554bcc9048314f8c4765422beec334272b7b8";
const [input] = process.argv.slice(2);
if (!input)
  throw new Error("Supply the validated Fall 2026 staging.v1.json path.");
const bytes = readFileSync(input);
if (createHash("sha256").update(bytes).digest("hex") !== approvedHash)
  throw new Error("The staging file differs from the reviewed pilot archive.");

const { schemaVersion, termId, timeZone, exams } = JSON.parse(bytes);
const sourceId = "fall-2026-science-schedule";
const datasetId = "fall-2026-public-pilot";
const projection = {
  schemaVersion,
  datasetId,
  termId,
  timeZone,
  sources: [
    {
      id: sourceId,
      label: "Fall 2026 science exam schedule, supplied for the EUC pilot",
      independentlyVerified: false,
      permissions: { public: true, planner: false },
    },
  ],
  exams: exams.map(({ id, claims }) => ({
    id,
    claims: claims.map(
      ({
        courseId,
        termId,
        designation,
        timing,
        sourceStatus,
        sourceSection,
      }) => ({
        courseId,
        termId,
        designation,
        timing,
        sourceStatus,
        sourceId,
        importBatchId: datasetId,
        sourceReference:
          sourceSection === "evening_timetable"
            ? "Evening timetable"
            : "Course testing window",
        publicationStatus: "approved-for-public",
        sections: null,
        audience: { reviewed: false, majorIds: [], academicLevels: [] },
      }),
    ),
  })),
};
writeFileSync(
  new URL("../data/public-calendar/fall-2026-exams.json", import.meta.url),
  JSON.stringify(projection) + "\n",
);
