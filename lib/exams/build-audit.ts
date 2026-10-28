import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { StagedExamDataset } from "./staging";

/** Local aggregate audit; never prints a restricted marker or source record. */
export async function auditExamBuild(
  dataset: StagedExamDataset,
  buildRoot: string,
) {
  const markers = [
    ...new Set([
      ...dataset.exams.map((exam) => exam.id),
      ...dataset.sources.flatMap((source) =>
        source.checksum ? [source.checksum] : [],
      ),
    ]),
  ]
    .filter((value) => value.length >= 8)
    .map((value) => Buffer.from(value));
  let filesScanned = 0;
  const violations: string[] = [];
  async function scan(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await scan(file);
      else if (entry.isFile()) {
        filesScanned++;
        const bytes = await readFile(file);
        if (markers.some((marker) => bytes.includes(marker)))
          violations.push(path.relative(buildRoot, file));
        if (file.endsWith(".nft.json")) {
          const trace = JSON.parse(bytes.toString("utf8")) as {
            files?: string[];
          };
          if (
            trace.files?.some((name) =>
              /(?:^|[/\\])data[/\\]local[/\\]/.test(
                path.resolve(path.dirname(file), name),
              ),
            )
          )
            violations.push(path.relative(buildRoot, file));
        }
      }
    }
  }
  await scan(buildRoot);
  return {
    filesScanned,
    markersChecked: markers.length,
    violatingFiles: new Set(violations).size,
  };
}
