# EUC Events Hub

A student-led foundation for engineering event discovery and organization planning at Penn State. Milestone 1A contains a running development shell and fixture-backed domain logic. All example events, organizations, and exams are fictional, visibly labeled synthetic, and are not official Penn State programming.

## Local development

Use Node.js 22.13 or newer (Node 22 LTS is used in CI) and npm. No credentials, environment variables, database, or external service account are required.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a production-mode local check, run `npm run build` followed by `npm start`.

```sh
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

`npm run typecheck` generates Next.js route types before checking TypeScript, including on a clean checkout. `npm run test:watch` runs interactive unit tests; `npm run format` formats application and configuration files without rewriting the preserved architecture documentation. GitHub Actions runs clean installation, formatting, lint, type checking, unit tests, and production build on pull requests to main and pushes to main.

## Selected versions

Exact dependency versions are pinned in `package.json` and resolved in `package-lock.json`.

| Package                       | Version                         | Choice                                                         |
| ----------------------------- | ------------------------------- | -------------------------------------------------------------- |
| Next.js                       | 16.4.1                          | Stable App Router; React 19 compatibility                      |
| React / React DOM             | 19.3.1                          | Matching stable versions                                       |
| TypeScript                    | 5.9.3                           | Strict mode; established Next.js tooling compatibility         |
| Tailwind CSS / PostCSS plugin | 4.3.3                           | CSS semantic theme tokens                                      |
| Zod                           | 4.6.7                           | Runtime validation and inferred domain types                   |
| Vitest                        | 5.0.4                           | Node-based domain and time tests; Node >=22.12                 |
| ESLint / Next config          | 9.39.5 / 16.4.1                 | Flat config; compatible with the Next.js plugin peer ranges    |
| Prettier                      | 3.9.10                          | Consistent source formatting                                   |
| IBM Plex Sans                 | @fontsource/ibm-plex-sans 5.3.0 | Locally bundled 400/500/600 weights, SIL Open Font License 1.1 |

The font copyright and SIL license are preserved in `public/fonts/IBM-Plex-Sans-LICENSE.txt` and the font package's LICENSE file. Fonts are served locally; builds do not fetch Google Fonts. ESLint 9 is pinned because the current Next.js React, accessibility, and import plugins declare ESLint 9 peer compatibility; revisit the major version when those plugins support ESLint 10. No repository-wide license is introduced because project licensing and stewardship remain pending decisions.

## Structure

- `app/`: Next.js App Router layout, minimal landing page, and semantic Tailwind tokens.
- `components/`: Shared site header used by the application shell.
- `lib/domain/`: Zod models and pure intended-audience relevance logic.
- `lib/data/`: Simple synchronous fixture-backed queries, detached return values, and public status filtering.
- `lib/time/`: Eastern Time display and IANA-aware calendar boundaries.
- `data/fixtures/`: Validated fictional majors, organizations, events, and exams.
- `data/local/`: Gitignored private local data; never place real datasets in fixtures.
- `docs/`: Preserved product specification, architecture, design system, and decisions. Next.js agent-rule generation is disabled to keep the repository-owned `AGENTS.md` unchanged.

## Domain and query conventions

Each event is one occurrence; optional `seriesId` groups occurrences without expanding recurrence. Timed events use offset-bearing ISO timestamps; all-day events use `YYYY-MM-DD` values with exclusive end dates. Unknown-time exams contain a date and no fabricated timestamps. Known-time exams require a positive interval and a date matching their Eastern start date. Optional information stays absent when unknown. Source attribution and verification state distinguish synthetic samples from verified data.

`getEvents({ start, end, filters? })` and `getExams({ start, end, termId? })` accept **Eastern date-only windows**, inclusive start and exclusive end. Overlap queries include multi-day and midnight-crossing records even when they begin before the window. Invalid or empty windows throw. `getEventById(id)` returns `undefined` for missing records. Public event queries include published and tentative events and omit drafts and cancellations; canceled-event presentation is a future calendar decision.

```ts
getEvents({
  start: "2026-10-19",
  end: "2026-10-26",
  filters: { audience: { mode: "recommended", majorIds: ["bme", "che"] } },
});
getEvents({ start: "2026-10-19", end: "2026-10-26" }); // All Events
getExams({
  start: "2026-10-19",
  end: "2026-10-26",
  termId: "example-fall-2026",
});
```

Recommended views include college-wide events, explicit target matches, and the union of documented host audiences for inherited events. Explicit audiences take precedence over host classifications. Unclassified events remain available in All Events. An empty recommended selection includes only college-wide programming. Optional organization and category filters further narrow display queries. No planning analysis exists in this milestone.

All timed labels use `America/New_York`, including EST/EDT. All-day labels preserve their dates. Calendar boundaries use IANA rules rather than fixed offsets; a Sunday-start week is the initial convention. Timed ranges show both dates and zone labels, including midnight crossings.

## Scope and limitations

This milestone supplies a development shell, not a working calendar or planner. There is no persistence, authentication, live ingestion, newsletter delivery, production hosting, scoring, or priority allocation. Fixture IDs and academic audience mappings are development examples. Final source formats, calendar cancellation behavior, and production ownership remain future decisions. The shell is not a claim of formal WCAG compliance or university endorsement.

The current full dependency audit reports five high-severity entries rooted in `braces` (GHSA-vfj7-8cjw-p6xm), pulled in by Next.js lint tooling. They affect development dependencies; the production-only audit reports zero vulnerabilities. No patched `braces` release was available from the registry at implementation time. ESLint 9 is also past upstream support, retained here for declared plugin compatibility. Recheck these tooling dependencies before expanding the application.
