---
name: euc-architecture
description: Map EUC calendar, planner, exam calculations, and data-access dependencies with local Graphify AST analysis; assess future Supabase boundaries without changing application behavior.
---

# EUC architecture analysis

Read `AGENTS.md`, `docs/ARCHITECTURE.md`, applicable ADRs, and `docs/reviews/GRAPHIFY_ARCHITECTURE.md`. Treat the review as a snapshot; verify current source before relying on its findings.

Use the existing Graphify executable. Check `graphify --help` and the installed version. Do not request, install, or configure a paid LLM API, run semantic extraction, contact a live database, or install optional Graphify extras for this workflow. If the executable is absent, use source inspection until the environment has been checked as described in `docs/CODEX_SKILLS.md`.

Analyze a clean checkout containing tracked application files and no private datasets. Confirm `git ls-files data/local` is empty and `.graphifyignore` excludes that directory. The code-only flag excludes documents and images, but it does not by itself exclude private code or data-shaped source files. Never read or copy private datasets into an analysis staging directory.

For an initial clean analysis, run from the repository root:

```text
graphify . --code-only
graphify cluster-only . --no-label --no-viz
graphify path "components/planner/organization-planner.tsx" "lib/domain/exam-pressure.ts"
graphify path "components/calendar/event-calendar.tsx" "lib/data/fixtures.ts"
graphify diagnose multigraph --max-examples 3
```

Do not reuse a graph from a prior mixed-content run: code-only extraction can merge an existing graph. For repeatable isolated output, choose an unused directory under the gitignored `work/` folder and use `graphify . --code-only --max-workers 2 --out work/<new-run>`. Its graph is `work/<new-run>/graphify-out/graph.json`; supply that path with `--graph` to query/path/explain/diagnose. Use `graphify cluster-only . --graph <path> --no-label --no-viz` for its report. The worker cap is optional for constrained hosts.

Prefer file-path seeds and `imports_from` relationships when names are ambiguous. Separate imports and type dependencies from runtime calls. Confirm important edges in source; AST labels such as `calls` and `dynamic_import` can describe type-level syntax, and `indirect_call` is heuristic even without an LLM. Test imports inflate centrality. Do not equate graph cohesion with code quality or a graph path with proof of data flow.

Trace display loading separately from planning context loading. Verify complete canonical identities, preparation lookahead, audience eligibility, exclusive end bounds, Eastern/DST handling, and the overall `null` score in implementation/tests. Read only synthetic fixtures.

Mark Supabase connections as proposed integration points until an actual adapter exists. Consider synchronous client-side consumers and direct fixture imports before claiming that replacing a single data file is sufficient. Authentication, RLS, publication and review workflows remain future approved work.

Report the analyzed commit/version, corpus, graph counts, token/API cost, concrete paths, false positives, omissions, diagnostics, and actual verification. Keep graph JSON/HTML, manifests, caches and machine-path sidecars untracked. A short source-linked Markdown review is the preferred durable result.
