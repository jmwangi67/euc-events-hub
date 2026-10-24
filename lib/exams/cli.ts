import { readFile, writeFile, rename, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { ZodError } from "zod";
import { importExamJson, importSourceCsv } from "./import";
import { mergeExamDatasets } from "./staging";
import { toReviewedCanonicalExams } from "./canonical";
import { localExamPath } from "./local-files";
import { auditExamBuild } from "./build-audit";
import path from "node:path";

export async function main(args: string[]) {
  const [command, ...flags] = args;
  if (!["import", "validate", "audit-build"].includes(command))
    throw new Error(
      "Use exams:import or exams:validate with --input <private file>.",
    );
  const options: Record<string, string> = {};
  for (let i = 0; i < flags.length; i += 2) {
    if (
      ![
        "--input",
        "--output",
        "--merge",
        "--dataset-id",
        "--source-label",
      ].includes(flags[i]) ||
      !flags[i + 1] ||
      flags[i + 1].startsWith("--")
    )
      throw new Error("Expected a supported --option followed by its value.");
    if (options[flags[i]]) throw new Error("Do not repeat an option.");
    options[flags[i]] = flags[i + 1];
  }
  if (!options["--input"]) throw new Error("--input is required.");
  const input = await localExamPath(options["--input"]);
  if ((await stat(input)).size > 5 * 1024 * 1024)
    throw new Error("Input exceeds the 5 MiB local staging limit.");
  const bytes = await readFile(input);
  let result = input.toLowerCase().endsWith(".csv")
    ? importSourceCsv(bytes.toString("utf8"), {
        datasetId: options["--dataset-id"] ?? "local-csv-import",
        sourceLabel:
          options["--source-label"] ?? "Locally supplied CSV; unverified",
        checksum: createHash("sha256").update(bytes).digest("hex"),
      })
    : importExamJson(JSON.parse(bytes.toString("utf8")));
  if (options["--merge"]) {
    const existing = await localExamPath(options["--merge"]);
    result = mergeExamDatasets(
      importExamJson(JSON.parse(await readFile(existing, "utf8"))).dataset,
      result.dataset,
    );
  }
  if (command === "import") {
    if (!options["--output"])
      throw new Error(
        "Import needs --output under data/local/exams/; validation writes nothing.",
      );
    const output = await localExamPath(options["--output"], true);
    if (
      spawnSync("git", ["check-ignore", "-q", output]).status !== 0 ||
      spawnSync("git", ["ls-files", "--error-unmatch", output], {
        stdio: "ignore",
      }).status === 0
    )
      throw new Error("Output must be ignored and untracked by Git.");
    const temporary = `${output}.pending-${process.pid}`;
    await writeFile(temporary, JSON.stringify(result.dataset, null, 2) + "\n", {
      mode: 0o600,
      flag: "wx",
    });
    await rename(temporary, output);
  }
  const eligible = new Set(
    toReviewedCanonicalExams(result.dataset).map((exam) => exam.id),
  ).size;
  if (command === "audit-build") {
    const audit = await auditExamBuild(result.dataset, path.resolve(".next"));
    console.log(JSON.stringify(audit, null, 2));
    if (audit.violatingFiles)
      throw new Error(
        "Production output contains restricted markers or private file traces; discard the build and investigate.",
      );
    return;
  }
  // Aggregate diagnostics only: no private record IDs, courses, dates or references in logs.
  console.log(
    JSON.stringify(
      {
        valid: true,
        ...result.summary,
        preparationEligibleOccurrences: eligible,
        publicationPerformed: false,
      },
      null,
      2,
    ),
  );
}
export function reportImportError(error: unknown) {
  if (error instanceof ZodError)
    console.error(
      JSON.stringify(
        {
          valid: false,
          issues: error.issues.map((issue) => ({
            path: issue.path.map(String).join("."),
            message: issue.message,
          })),
        },
        null,
        2,
      ),
    );
  else
    console.error(
      error instanceof SyntaxError
        ? "Invalid JSON; no records were imported."
        : error instanceof Error
          ? error.message
          : "Import failed; no records were imported.",
    );
}
