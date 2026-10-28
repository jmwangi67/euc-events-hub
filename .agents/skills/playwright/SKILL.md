---
name: playwright
description: Route EUC browser verification to its existing Playwright regression suites or optional exploratory CLI inspection; preserve the locked project tools and test coverage.
---

# EUC browser verification

Use the project's installed, locked `@playwright/test` and npm scripts for regression testing. Read `playwright.config.ts`, `playwright.exam-preview.config.ts`, `package.json` and `.github/workflows/ci.yml`. A request to verify a change authorizes running the existing suites; it does not require the user to ask separately for test files.

From the repository root:

```bash
npm run test:browser
npm run test:exam-preview
```

The production suite expects an existing production build. Both configurations manage their own servers and use synthetic preview data. Keep their Eastern-time assertions, keyboard/focus coverage, and private-data safeguards. Do not substitute a CLI screenshot for required regression tests or weaken tests to match an implementation.

## Exploratory inspection

Use an available browser connector or the optional `playwright-cli` skill for ad hoc snapshots, screenshots and interactive debugging. This is a separate capability from the test runner. Read its reference only when needed; it does not add another testing framework.

Skill discovery performs no installation. Check the actual host for the locked test package, browser executable and necessary runtime libraries. If a required tool is missing, report the limitation. Installing an optional CLI or browser requires a concrete task need and authorization that covers that installation. Select and verify an exact executable/package version before any authorized provisioning; do not use an unversioned package runner or `@latest`.

The Bash wrapper runs an already installed executable and cannot download the CLI. Before using it, inspect the selected executable's `--version` output and set `PLAYWRIGHT_CLI_EXPECTED_VERSION` to that exact reviewed output. `PLAYWRIGHT_CLI_BIN` can select an existing executable by path; otherwise it uses `playwright-cli` on PATH. The wrapper rejects a missing executable, missing version expectation or mismatch before running a browser command.

```bash
export PWCLI="$PWD/.agents/skills/playwright/scripts/playwright_cli.sh"
# Set PLAYWRIGHT_CLI_EXPECTED_VERSION to the previously reviewed --version output.
bash "$PWCLI" --help
```

Resolve the wrapper relative to this `SKILL.md` when launched from another directory. On hosts without Bash, use the existing project npm scripts or an available browser connector; do not install Bash solely to follow an example.

Keep exploratory artifacts under gitignored `work/playwright/`. Use only synthetic records, snapshot before using element references, and refresh references after navigation or rerendering. Compare with a real baseline before claiming visual regression coverage. Scope browser/session cleanup to the session created for this task.

## References

- [Exploratory CLI reference](references/cli.md)
- [Exploratory workflows](references/workflows.md)
- [Detailed CLI skill](../playwright-cli/SKILL.md)

Detailed upstream command examples are reference material. The EUC regression-test and installation rules above apply to every example.
