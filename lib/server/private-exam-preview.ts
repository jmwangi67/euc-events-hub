import "server-only";
import { readFile, stat } from "node:fs/promises";
import { privateExamPreviewAllowed } from "../exams/preview-policy";
import { localExamPath } from "../exams/local-files";
import { importExamJson } from "../exams/import";
import { syntheticExamImport } from "../../data/fixtures/exam-import";

/** Guard BEFORE any private path resolution/read. Never statically import a local dataset. */
export async function loadPrivateExamPreview(headers: {
  get(name: string): string | null;
}) {
  if (!privateExamPreviewAllowed(process.env, headers)) return null;
  if (process.env.EUC_EXAM_PREVIEW_DATASET === "synthetic")
    return { dataset: syntheticExamImport(), synthetic: true };
  if (
    process.env.EUC_EXAM_PREVIEW_DATASET &&
    process.env.EUC_EXAM_PREVIEW_DATASET !== "private"
  )
    throw new Error("Select private or synthetic review data.");
  if (!process.env.EUC_EXAM_DATASET_PATH)
    throw new Error(
      "Set EUC_EXAM_DATASET_PATH to a validated local JSON file.",
    );
  const file = await localExamPath(process.env.EUC_EXAM_DATASET_PATH);
  if ((await stat(/* turbopackIgnore: true */ file)).size > 5 * 1024 * 1024)
    throw new Error("Private staging file exceeds the review size limit.");
  // A guarded development read is never a production file-tracing dependency.
  const result = importExamJson(
    JSON.parse(await readFile(/* turbopackIgnore: true */ file, "utf8")),
  );
  return { dataset: result.dataset, synthetic: false };
}
