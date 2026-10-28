import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizationPlanner } from "../../components/planner/organization-planner";
import { StudentCalendar } from "../../components/calendar/student-calendar";
import { parseCalendarState } from "../domain/calendar-state";
import { referenceDataSchema } from "./contracts";

describe("client/server data separation", () => {
  it("no client entrypoint transitively imports fixture providers or server-only modules", () => {
    const root = process.cwd();
    const files: string[] = [];
    function walk(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (/\.tsx?$/.test(file) && !file.endsWith(".test.ts"))
          files.push(file);
      }
    }
    for (const dir of ["app", "components", "lib"]) walk(path.join(root, dir));
    const visited = new Set<string>();
    function visit(file: string) {
      if (visited.has(file)) return;
      visited.add(file);
      const relative = path.relative(root, file).replaceAll(path.sep, "/");
      expect(relative).not.toMatch(
        /^(data\/fixtures|lib\/server\/|lib\/data\/(fixtures|weekly-planning|planner|test-helpers))/,
      );
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      for (const node of source.statements) {
        if (
          !(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) ||
          !node.moduleSpecifier ||
          !ts.isStringLiteral(node.moduleSpecifier)
        )
          continue;
        if (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly)
          continue;
        if (ts.isExportDeclaration(node) && node.isTypeOnly) continue;
        const specifier = node.moduleSpecifier.text;
        expect(specifier).not.toBe("server-only");
        if (!specifier.startsWith(".")) continue;
        const base = path.resolve(path.dirname(file), specifier);
        const target = [
          base + ".ts",
          base + ".tsx",
          path.join(base, "index.ts"),
          path.join(base, "index.tsx"),
        ].find(existsSync);
        if (target) visit(target);
      }
    }
    for (const file of files)
      if (/^["']use client["'];/.test(readFileSync(file, "utf8"))) visit(file);
    expect(visited.size).toBeGreaterThan(20);
  });
  it("renders controlled empty-reference states without inventing organizations", () => {
    const references = referenceDataSchema.parse({
      majors: [],
      organizations: [],
      clusters: [],
    });
    expect(
      renderToStaticMarkup(
        createElement(OrganizationPlanner, {
          ...references,
          initialDate: "2026-10-19",
        }),
      ),
    ).toContain("Planner unavailable");
    const state = parseCalendarState(new URLSearchParams(), "2026-10-19", {
      majorIds: [],
      organizationIds: [],
      clusterIds: [],
    });
    expect(
      renderToStaticMarkup(
        createElement(StudentCalendar, { ...references, initialState: state }),
      ),
    ).toContain("Student calendar");
  });
});
