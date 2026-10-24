// Compile the existing TypeScript stack for offline CLI use; no additional runtime dependency.
import ts from "typescript";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL(".", import.meta.url));
mkdirSync(path.join(root, "work"), { recursive: true });
const output = mkdtempSync(path.join(root, "work/exam-tools-"));
try {
  writeFileSync(path.join(output, "package.json"), '{"type":"commonjs"}');
  const program = ts.createProgram([path.join(root, "lib/exams/cli.ts")], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
    outDir: output,
    rootDir: root,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    console.error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (f) => f,
        getCurrentDirectory: () => root,
        getNewLine: () => "\n",
      }),
    );
    process.exitCode = 1;
  } else {
    program.emit();
    const entry = path.join(output, "lib/exams/cli.js");
    const wrapper = path.join(output, "run.cjs");
    writeFileSync(
      wrapper,
      `const cli = require(${JSON.stringify(entry)}); cli.main(process.argv.slice(2)).catch(error => { cli.reportImportError(error); process.exitCode = 1; });`,
    );
    process.exitCode =
      spawnSync(process.execPath, [wrapper, ...process.argv.slice(2)], {
        cwd: root,
        stdio: "inherit",
      }).status ?? 1;
  }
} finally {
  rmSync(output, { recursive: true, force: true });
}
