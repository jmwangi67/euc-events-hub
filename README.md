# EUC Events Hub

A student-led foundation for engineering event discovery and organization planning at Penn State. Milestone 1B adds a public student calendar on the Milestone 1A fixture-backed foundation. Public/production events, exams and example student organizations are fictional and visibly labeled Example or Demo. Publicly sourced institutional host identities do not verify any event or imply official Penn State programming. The current PR also adds the Milestone 1C local organization planner and Milestone 2A.0 offline academic exam staging with a separately enabled private local review.

## Local development

Use Node.js 22.13 or newer (Node 22 LTS is used in CI) and npm. No credentials, database, or external service account are required. The optional browser-test executable variable is described below.

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

`npm run typecheck` generates Next.js route types before checking TypeScript, including on a clean checkout. `npm run test:watch` runs interactive unit tests; `npm run format` formats application and configuration files without rewriting the preserved architecture documentation. GitHub Actions runs clean installation, formatting, lint, type checking, unit tests, and production build on pull requests to main and pushes to main. It also runs the focused Chromium suite after building.

## Student calendar

The home page supports month, week, day, and chronological list views; previous/next/today navigation; a date jump; and published-only event details. Below 1024px, the default is a chronological month list with an optional day view. Below 1024px, filters collapse behind a labeled control showing the active-filter count. On desktop the sidebar stays visible. Majors, Organizations, and Event categories expand independently and retain selections. The count includes selected majors, student organizations, documented student-host memberships, categories, University Events and nonempty search. Selecting a major immediately narrows results; host/category/cluster restrictions remain independent. Mobile chronological lists share a weekday and full-month date header per day without repeating the year within a single-year range (cross-year displayed ranges include years). Date headers use 16px semibold text and 16px separation between day groups across mobile and tablet. Each day has a unified light blue-gray surface (#E8EFF7), including its header and the spaces between cards, with 8px inner padding. Individual public event items use their category surface and border, a 4px radius, and the preserved 12px/14px padding. The header-to-first-card gap is 4px; same-day cards have 8px gaps. The neutral page background remains visible in the 16px gap between days. They show 15px semibold titles, 14px medium-weight times, and 12px muted category/host information. Overnight rows use Next day or From prev day cues; event details retain full dates. All displayed dates, times, week boundaries, and navigation use `America/New_York`, independently of the browser time zone.

Use All Events to clear major restrictions and browse published events, including unclassified examples. Selected majors immediately apply college-wide, explicit and valid inherited relevance, without requiring a mode switch. Organization, documented host-membership cluster and category selections narrow results independently; search matches event titles and descriptions, ignoring case and surrounding whitespace. Clear filters returns to All Events and clears major, host, cluster, category, and search selections while preserving date and view.

Dates, selected view, discovery mode, majors, organizations, categories, and search are reflected in shareable URL parameters. For example:

```text
/?date=2026-10-19&view=listMonth&mode=recommended&majors=bme,che
/?date=2026-10-19&view=dayGridMonth&organizations=example-process&categories=career-networking
```

The calendar opens on the current Eastern date. “View sample dates” navigates to October 19, 2026, where the fixed example fixtures are available. The published unclassified open-studio example is separate from the preserved tentative fixture, which never appears in public results. Native event dialogs support Escape, focus containment, focus restoration, and missing-detail messages. No unavailable location, description, or registration details are invented.

Organization choices and community memberships contain explicitly classified student organizations only. University departments, colleges, schools and administrative units remain in the host registry for event cards, paw badges, full-name details and scheduling analysis. Discover their events through major relevance or **University Events** (`university=1`), which combines with other active restrictions. Clear filters also resets this checkbox. The planner's proposed-event organization selector is student-only; **Show University Events** controls university-hosted/co-hosted published cards while leaving eligible scheduling constraints and density inputs unchanged. The existing published-events master switch must also be on. PSU-wide external commitments retain their separate display control. See the [clarification preview gallery](docs/previews/planner/organization-membership/README.md).

## Planned Milestone 2A: Admin-managed exam datasets

The next academic-data workstream will allow authorized EUC admins to import, review, correct and publish term-based exam records without changing application code. [Milestone 2A plan](docs/milestones/2A-ACADEMIC-EXAM-ADMINISTRATION.md) documents the staged data contract, review workflow, source-confirmation semantics, testing and security prerequisites. Production admin editing depends on future database and authentication foundations.

**Do not commit real source-derived exam schedules to the public fixture directory.** Keep authorized local staging files under gitignored `data/local/`. The current calendar still uses fictional exams and does not automatically ingest local files; testing source-based multi-day eTesting windows requires a subsequent import/schema implementation and publication-rights review.

## Browser verification

A small Playwright suite exercises complete student discovery workflows against a production build. It uses a Los Angeles browser time zone to verify Eastern display and reviews 320, 375, 430, 768, and 1440px layouts, including native dialogs and keyboard behavior.

```sh
npm run build
npx playwright install chromium
npm run test:browser
```

To use an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path. The test runner starts the local production server automatically and writes screenshots to gitignored `work/` and failure artifacts to `test-results/`. Only Chromium is configured; this does not constitute formal WCAG certification or cross-browser validation.

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

FullCalendar's React, core, day-grid, time-grid, list, and Luxon 3 connector packages are pinned together at **6.1.22**, with **Luxon 3.7.2** for named-zone calculations. This matched stable standard-plugin line supports the existing React 19 foundation and `America/New_York` without UTC coercion or fixed offsets. No premium plugin is installed. **@playwright/test 1.64.1** is a development dependency for the completed student workflows. Existing foundation dependency pins and documented vulnerability findings are retained.

## Structure

- `app/`: Next.js App Router layout, student discovery page, and semantic Tailwind tokens.
- `components/calendar/`: FullCalendar adapter, event mapping, student discovery composition, and accessible details.
- `components/filters/`: Independent mode, major, organization, and category controls.
- `components/`: Shared site header used by the application shell.
- `lib/domain/`: Zod models, pure intended-audience relevance, category labels, and validated shareable calendar state.
- `lib/data/`: Simple synchronous fixture-backed queries, detached return values, and public status filtering.
- `lib/time/`: Eastern Time display and IANA-aware calendar boundaries.
- `data/fixtures/`: Validated fictional majors, organizations, events, and exams. Exams remain unused by the public calendar.
- `tests/`: Focused Chromium discovery, navigation, dialog, and responsive tests.
- `data/local/`: Gitignored private local data; never place real datasets in fixtures.
- `docs/`: Preserved product specification, architecture, design system, and decisions. Next.js agent-rule generation is disabled to keep the repository-owned `AGENTS.md` unchanged.

## Domain and query conventions

Each event is one occurrence; optional `seriesId` groups occurrences without expanding recurrence. Timed events use offset-bearing ISO timestamps; all-day events use `YYYY-MM-DD` values with exclusive end dates. Unknown-time exams contain a date and no fabricated timestamps. Known-time exams require a positive interval and a date matching their Eastern start date. Optional information stays absent when unknown. Source attribution and verification state distinguish synthetic samples from verified data.

`getEvents({ start, end, filters? })` and `getExams({ start, end, termId? })` accept **Eastern date-only windows**, inclusive start and exclusive end. Overlap queries include multi-day and midnight-crossing records even when they begin before the window. Invalid or empty windows throw. `getEventById(id)` returns `undefined` for missing records. Both public event queries (`getEvents` and `getEventById`) return only published events; All Events means all published events regardless of major classification, not all publication states. Tentative, draft, and canceled events are omitted from public results. Those statuses remain supported by the event schema, and the existing tentative fixture is preserved. Tentative-event access belongs to a future authorized organization planner; no planner access or status override is exposed in Milestone 1A.

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

Recommended views include college-wide events, explicit target matches, and the union of documented host audiences for inherited events. Explicit audiences take precedence over host classifications. Published unclassified events remain available in All Events. An empty recommended selection includes only college-wide programming. Optional organization and category filters further narrow display queries. Planner analysis is separate from these public discovery queries. Event queries accept an optional readonly event-fixture array for isolated tests; production callers use the default fixtures. Tests supply local boundary/status records rather than mutating the shared exports.

The calendar label is **All Times Eastern (ET)**. Timed labels use `America/New_York` without repeating zone abbreviations. Same-period ranges share AM/PM (5:00–6:00 PM); different periods retain both (11:30 AM–12:30 PM). Compact overnight cards show Next day (or From prev day on continuation rows); details retain full dates for overnight and multi-day events. Repeated fall-hour ranges include elapsed minutes when wall clocks alone would be ambiguous. All-day labels preserve their dates and exclusive ends. Calendar boundaries continue to use IANA rules rather than fixed offsets; a Sunday-start week is the initial convention.

## Scope and limitations

This application supplies fixture-backed student discovery and a local organization-planner prototype. There is no persistence, authentication, live ingestion, newsletter delivery, production hosting, numerical overall scoring, or priority allocation. Fixture IDs, break dates and academic audience mappings are fictional development examples. A versioned offline JSON/CSV exam import and separate development-only private review are available under Milestone 2A.0; production uploads and publication remain deferred. Calendar cancellation behavior and production ownership remain future decisions. Exam overlays are planner-only; live calendar imports and officer accounts remain deferred. The shell is not a claim of formal WCAG compliance or university endorsement.

### Development dependency review (October 15, 2026)

Rechecked with `npm audit --json`, `npm audit --omit=dev --json`, `npm outdated --json`, and registry dependency/peer manifests. The full audit still reports five high-severity entries from one underlying advisory, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), along this development-only dependency chain:

```text
eslint-config-next 16.4.1
  → @next/eslint-plugin-next 16.4.1
    → fast-glob 3.3.1
      → micromatch 4.0.8
        → braces 3.0.3
```

A non-breaking `eslint-config-next` 16.4.2 patch is available, but its Next.js lint plugin still pins `fast-glob` 3.3.1. Even `fast-glob` 3.3.3 (latest) still depends on `micromatch` ^4.0.8, whose latest release remains 4.0.8 and depends on `braces` ^3.0.3. The latest published `braces` is still 3.0.3, which is affected. Thus no compatible update currently resolves this advisory. The available Vitest 5.0.5 patch is outside the affected dependency chain. Dependency versions and the lockfile are retained; no forced upgrades or overrides were applied. The audit's proposed `eslint-config-next` 14.2.35 downgrade would change major versions and is not an appropriate automatic fix for this Next.js 16 foundation.

The impact is potential stack-exhaustion denial of service when development tooling processes maliciously deeply nested glob patterns, potentially failing a local lint run or CI. This code is not in the production runtime, and the production-only audit reports zero vulnerabilities. ESLint 9.39.5 remains the latest 9.x release and is past upstream support; ESLint 10 is outside the declared peer ranges of the current React, accessibility, and import plugins. Recheck upstream tooling releases for a compatible fix; the unresolved development-tooling risk remains documented rather than being hidden by an incompatible upgrade.

## Preview screenshots

Rendered synthetic examples at [desktop width](docs/previews/student-calendar-desktop.png) and [mobile width](docs/previews/student-calendar-mobile.png). These are local test captures, not a hosted deployment.

A synthetic year-end visual-review scenario is available at `/?date=2026-12-31&view=listMonth`: an all-day event on December 30 precedes three timed events on December 31 with distinct hosts, categories, and ranges. The final event crosses into January 1, 2027. Browser tests inspect these groups at 320, 375, 430, and 768px and verify the January continuation and full-date details. These are fictional fixtures; existing October examples remain unchanged.

## Milestone 1C: organization planner prototype

Open `/planner` from the primary navigation. The student calendar remains at `/`. Select an example organization; its documented majors initialize the independent planning audience. Organizations with no default audience require an explicit major selection. Use **Load sample scenario**, then **Analyze proposal**, to compare the sample October 21 workshop against a cross-major published event and an exam whose time is unknown.

The proposal is local React state only: it is not saved, submitted, approved, or published. Reloading or leaving the route clears it. Editing the proposal or audience clears the preceding analysis. Dates and clocks are entered in `America/New_York`; nonexistent spring clocks are rejected, and repeated fall clocks require a first/second occurrence for each ambiguous endpoint. Choose the following end date for overnight proposals. Input resolution uses IANA rules, producing unambiguous UTC instants without fixed Eastern offsets.

Conflict analysis lives in `lib/domain/planning.ts`. It uses inclusive-start/exclusive-end interval intersection; back-to-back intervals do not overlap. Relevant published events include college-wide programming, explicit cross-major audiences, and inherited host audiences. All-day and multi-day events use Eastern midnight boundaries. Tentative, canceled, draft, and unclassified non-college-wide events are not assumed public planning constraints. There are no privileged accounts or tentative-event access overrides in this prototype.

Known-time exams produce interval-overlap results; unknown-time exams produce date-level warnings only, including when a proposal crosses midnight. Unknown-time overlays occupy a date-level calendar row labeled **Time unknown**, with no invented clock times. Exam details and explanations retain course sections, relevant majors, source labels/links, verification states, and uncertainty. Exam coverage and course-to-major mappings are incomplete and are not enrollment or attendance predictions. “No conflicts found in the available sample data” is not a guarantee that a date is free.

`lib/data/planner.ts` fetches the complete proposal date window. Calendar visibility checkboxes and date navigation never change that analysis input. `EventCalendar` remains the only FullCalendar adapter, adding academic exam overlays and an explicitly local proposal alongside published events. Shared dialog and responsive-calendar utilities preserve the student calendar's keyboard dismissal and focus-restoration behavior. Academic, warning, and proposal styles use semantic CSS tokens in the existing light theme, ready for a later theme palette; no dark-mode switch or persistence is implemented.

No new dependencies, live sources, backend, authentication, storage, overall scores, priority allocation, email, or deployment are included. The optional static priority-star example is omitted to keep this prototype focused on explicit conflicts. Planner screenshots cover 320, 375, 430, 768, and 1440px in `docs/previews/planner/`.

### Weekly planning intelligence (PR #5)

Planner desktop views are **Month | 2 Weeks | 1 Week | Day | List**. Month and 2 Weeks use date grids with an aligned weekly summary after Saturday. Only 1 Week and Day are hourly. Compact lists retain shared blue-gray date groups and white bordered event rows, with a week selector/summary above the list and concise empty weeks. Public `/` behavior remains unchanged.

Majors, academic levels and curated many-to-many organization clusters are independent selections. Cluster relevance requires explicit event targeting; host membership never implies it. Preparation combines applicable exams independently per major × academic-level cell, never across disjoint students. Common canonical exams deduplicate. Missing audience mappings add no numerical contribution and appear as source-labeled cautions. Unknown typical academic levels retain a configurable candidate strength; out-of-sequence students are not excluded.

Explicitly classified PSU-wide and major national commitments are broad context with participation uncertainty. Nearby local events are context-only unless an explicit selected-audience relationship qualifies them. Independent default-visible display layers never narrow weekly/proposal analysis. Factual counts, contextual records, direct known-time intervals, unknown-hour cautions and preparation estimates are distinct.

Week/Day lead with **Overall scheduling pressure unavailable — awaiting methodology review**. The overall score remains `null`. An opt-in exposes experimental preparation using the Saturday-anchored candidate `10 × weight × exp(−0.30 × remainingEasternDays^1.35)`, zero from the actual exam start. Daily 10 PM references and exact maximum bounds replace midnight-only estimates. Proposal start and interval maxima include exact left limits and cutoffs. Next-week exams can generate this Saturday's preparation without being counted as exams this week. UI values are rounded relative units, never percentages, enrollment shares or a finalized overall score.

[ADR 003](docs/decisions/003-weekly-planning-intelligence.md) records corrected eligibility, audience cells, parameters, sensitivity, interval mathematics, DST, examples and limitations. [Review reconciliation](docs/reviews/PR5_REVIEW_RECONCILIATION.md) maps every owner-provided Claude finding to its resolution. The [updated Claude handoff](docs/reviews/PR5_CLAUDE_HANDOFF.md) prepares a follow-up independent pass. [Earlier refinement screenshots](docs/previews/planner/refinements/README.md) cover all views, compact summaries, intermediate desktops and 200%-equivalent reflow.

**Future enhancement: Smart Scheduling Recommendations** remains documentation only. No date recommendations, numerical overall score, production services, persistence, paid plugins, dependency upgrades or theme toggle are implemented. The CI runner/action changes are limited to the owner's requested compatibility review.

### Master refinement: independent indicators and provisional guidance

**Exam Preparation** uses academic exams only. Its existing mathematics, canonical-source resolution and independent major × academic-year calculations are unchanged. An opt-in displays experimental relative ranges: solid navy to the lower bound, diagonal stripes for uncertainty up to the upper bound, then an unfilled remainder. Equivalent subgroup results are grouped for presentation only; complete cells, mathematical references, source assumptions and optional 10 PM contributions remain under **Advanced methodology & sources**. Stripes are uncertainty, never probability. Meaningful unknown-hour and contradictory-source warnings remain visible.

**Other Scheduling Constraints** accepts only non-exam records. Its numerical score, like the overall scheduling-pressure score, remains `null` and visibly unavailable pending methodology review. It shows audience-relevant commitments, context-only records, exact overlaps and provisional policy cautions with human-readable events, sources and timing. All-day and unknown-hour records are listed separately; no hourly density is invented for them.

**Show scheduling density** is off by default and affects presentation only. Month and 2 Weeks shade date cells; 1 Week and Day shade known-time intervals behind cards; List/mobile provide factual labels. Bands are **0, 1, 2, 3+ maximum simultaneous known-time non-exam commitments within any selected major × academic-year cell**. Independent cells are never pooled. These factual bands are neither attendance estimates nor low/moderate/high pressure thresholds. Explicit cluster/audience targeting and context-only exclusions apply even when ordinary display layers are hidden. Source uncertainty never becomes a fabricated timestamp.

Provisional configurable policies in `lib/domain/non-exam-scheduling.ts` are:

- THON: seven calendar days of lead-up caution, with internal relative importance one-half its maximum policy importance; the full previous day, event days and following day show **Avoid scheduling — THON**, overriding the lead-up caution.
- Explicitly classified major Local concerts/festivals: two elapsed hours before and after the documented interval. Context-only records remain outside analytical density.
- Documented academic breaks: two preceding Eastern calendar days warn about possible early departures; fictional sample dates are not an official academic calendar.
- Relevant career fairs: Eastern midnight until the exact documented finish; no extension afterward.
- Ordinary engineering/organization events: actual intervals only, with no extra buffers.

Cautions survive a disabled heatmap. Higher-priority guidance is concise by default, with all reasons/sources available. Source lookaround retrieves records whose policy windows can affect the visible/proposal range, including future THON. The policies do not prohibit creating a proposal, assert universal participation, or activate numerical scoring.

Event scope has a separate legend and semantic palette: blue PSU-wide, amber National, green Local, and white/slate ordinary engineering. These card colors stay fixed above density shading. This earlier taxonomy is superseded by the six-category discovery refinement below. Existing event dialogs show only available source-backed audience, eligibility, hosting, location, registration and verification information. **Focus this week in calendar** moves focus to the matching week without switching views.

See [ADR 004](docs/decisions/004-independent-scheduling-indicators.md), [design tokens](docs/DESIGN_SYSTEM.md#17-pr-5-scope-density-and-independent-indicators), and the [master refinement gallery and validation report](docs/previews/planner/master-refinement/README.md). Activating a future numerical non-exam score requires owner approval of calibrated event importance, normalization, handling of audience uncertainty and missing data, and validation against credible evidence. None is approved by this prototype.

### Student discovery, host identity and planner layout refinement

The public calendar now uses exactly six event categories: **Career & Networking, Professional Development, Technical Workshops, General Body Meetings, Competitions, Social & Recreational**. Its category palette and charcoal text are separate from planner scope colors. Typed career-fair/recruiting/networking subtypes retain their distinctions and scheduling behavior. Legacy Research/Student organization records need purpose-aware classification; unresolved records are retained and visibly flagged, never guessed or dropped.

A compact welcome introduces working title/description search and major/organization/cluster/category filters. **Explore event types & student communities** is closed by default and explains the actual category and cluster definitions. Multiple values within a dimension use OR; active dimensions use AND. Student clusters match documented host membership; planner targeting still requires explicit event cluster metadata. URL state, reset, reload and back/forward retain these selections.

The existing organization registry now holds structured host classifications, verified institutional names, parent units, identity sources and proposed compact UI labels. University-only hosts use one original generic blue SVG paw in a white **PSU Hosted** badge. University plus student organizations use two smaller paws and **Co-hosted**. Student-only or unresolved hosting has no PSU badge. Full names and department-hosted metadata remain in details; compact cards use registered labels such as CoE, BME Dept. and MatSE Dept. These are UI labels, not a blanket claim of official abbreviations. MatSE belongs to Earth and Mineral Sciences; ABE retains its joint affiliation. Registry identity verification does not verify any fictional event. No official university paw mark is reproduced.

The planner's secondary sidebar is removed. **Filters & Audience** groups proposal-host selection, analytical majors/years/clusters and independent calendar display controls in compact native dropdowns. Closing it preserves selections and shows a scope/restriction summary and count. The local proposal remains separately collapsible, with all validation and repeated-time controls preserved. The full-width calendar retains all five layouts, inline Month/2 Weeks weekly summaries, density, cautions, dialogs and independent indicators.

See [ADR 005](docs/decisions/005-student-discovery-and-host-identity.md) for migration, authoritative host sources, abbreviation limits and the complete control inventory. [Updated discovery/hosting previews](docs/previews/planner/discovery-hosting/README.md) include category colors, badges, filters, guide, planner layouts, mobile/tablet and color-vision simulations. Owner visual acceptance remains required before merging; PR #5 stays open.

## Milestone 2A.0: local academic exam staging

Use `npm run exams:validate -- --input <private-json-or-csv>` and `npm run exams:import -- --input <private-input> --output <private-json>` with files under gitignored `data/local/exams/`. A version 1 Zod contract retains stable occurrences, source claims, date alternatives, possible-only dates, uncertain clocks, sections, audience review and separate publication rights. Re-import is idempotent; alternatives remain one exam.

The [local import guide](docs/LOCAL_EXAM_IMPORT.md) includes explicit Windows PowerShell commands. Enable `EUC_PRIVATE_EXAM_PREVIEW=1`, select `EUC_EXAM_PREVIEW_DATASET=private`, set `EUC_EXAM_DATASET_PATH` to the local JSON, and bind development to `127.0.0.1`. `/planner` stays fictional; its local link opens the separate `/planner/exam-preview`. This guarded read-only review never publishes records or feeds unreviewed data into numerical analysis. Production denies access even with the flag set. Automated preview tests force the separate invented dataset (`npm run test:exam-preview`).

The supplied private archive was locally validated: 84 canonical occurrences, zero invalid/conflicting records, and zero preparation-eligible records. Source confirmation, authorization and audience mappings remain unreviewed; validation does not make the schedule official. Real records and local diagnostics are excluded from Git and public artifacts. See [ADR 006](docs/decisions/006-local-exam-import-and-review.md), the [milestone completion checklist](docs/milestones/2A-ACADEMIC-EXAM-ADMINISTRATION.md), and [invented screenshots/validation](docs/previews/planner/exam-import/README.md). Database storage, individual admin authentication/authorization, audit history, editable review queues, XLSX uploads and publication remain Milestone 2A.1 dependencies. Owner local testing/review is still required before further development or merge.

### Planner calendar hierarchy and weekly navigation

Planner Month and 2 Weeks now order multi-day date-wide commitments before shorter untimed/date-only cards and chronological timed items. Continuous bars and uncertainty labels are preserved. Density is communicated through the approved purple backgrounds and legend, without date-header count badges. Stronger structural grid lines and one outer frame surround the calendar and integrated summaries. **View 1 Week** navigates to the selected Sunday–Saturday week; **Weekly summary details** remains a separate dialog action. Decorative line icons derive from structured event/exam classifications, independently of scope colors. Existing audience, source, timing and analytical rules are unchanged. See the [visual review and screenshot gallery](docs/previews/planner/calendar-hierarchy/README.md).
