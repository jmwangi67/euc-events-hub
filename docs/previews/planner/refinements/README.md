# PR #5 final refinement previews and validation

Current owner-approved refinement scope, based on reviewed commit `23f81a3`. Synthetic October 2026 fixtures only; every THON, Homecoming, football, election, concert and exam date is fictional. Default captures use CHE, all academic levels, no selected clusters. The BME+CHE image uses both majors, upperclassmen and a fictional October 27, 17:00–18:00 proposal.

## Planner views

- [Desktop Month with aligned eighth-column summaries](desktop-month.png)
- [Desktop 2 Weeks — two Sunday–Saturday date rows](desktop-two-weeks.png)
- [Desktop 1 Week — hourly grid and overall-unavailable state](desktop-one-week.png)
- [Desktop Day — hourly grid and proposal context](desktop-day.png)
- [Desktop List — no numerical chart](desktop-list.png)
- [Experimental preparation enabled, default display layers](experimental-preparation.png)
- [Experimental preparation with display layers hidden; values unchanged](experimental-hidden-layers.png)
- [Joint BME+CHE proposal: separate subgroup contributors](bme-che-proposal.png)
- [Weekly summary details](weekly-details-desktop.png)
- [Default visibility controls](visibility-defaults.png) / [hidden external controls](visibility-hidden.png) / [calendar with external layers hidden](external-hidden-calendar.png)

## Responsive previews

- [320px calendar and weekly controls](calendar-320.png)
- [375px calendar and weekly controls](calendar-375.png) / [full mobile planner](mobile-planner-375.png)
- [430px calendar and weekly controls](calendar-430.png)
- [768px calendar and weekly controls](calendar-768.png) / [full tablet planner](tablet-planner-768.png)
- [1024px narrow desktop](calendar-1024.png)
- [1280px intermediate desktop](calendar-1280.png)
- [1440px desktop](calendar-1440.png)
- [200%-equivalent reflow](reflow-200.png): 720×550 CSS viewport at device scale 2, equivalent to the reflow of a 1440×1100 desktop at 200%. Native browser-chrome zoom was not manually operated.

## Validation

- Installation: `npm ci --cache /tmp/euc-npm-cache` passed; application dependencies/lockfile unchanged.
- `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`: passed.
- `npm test`: **190 passed, 13 files** (all 156 prior cases plus 34 refinement cases).
- `NEXT_TELEMETRY_DISABLED=1 npm run build`: passed, `/` and `/planner` remain dynamic routes.
- `CI=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`: **63 passed** (all 48 prior workflows plus 15 refinement workflows).
- `git diff --check`: passed.
- Local screenshots/tests use system Chromium 154 and a non-Eastern browser timezone. The authoritative remote CI result using bundled Chromium and the updated Ubuntu/action pins is linked in PR #5.

## Visual review and limitations

All listed viewport widths, five desktop views, default/optional factors, visibility controls, dialogs and subgroup explanations were rendered and visually inspected. Browser checks cover five/six-row month alignment, two-week year boundaries, resize/filter alignment, native week controls, focus restoration, empty summaries and page/dialog overflow.

No remaining page-level horizontal overflow, detached date-group headers or misaligned weekly rows were observed. Compact summaries are accessible above the event list and now follow the current date after sample loading. Empty weeks are concise. Native selector text is shortened without losing full date-range accessible labels. Date-grid exam cards omit repeated metadata; complete timing/source/uncertainty information remains available through accessible names and details.

**Known presentation tradeoff:** short overlapping hourly slots may require internal vertical scrolling for long titles/metadata; complete clock labels, accessible names, Day/List and event details remain available. Compact full-page captures are long because they retain the proposal, explanation and chronological data. No formal accessibility certification is claimed. Owner visual approval and another independent Claude review remain pending.
