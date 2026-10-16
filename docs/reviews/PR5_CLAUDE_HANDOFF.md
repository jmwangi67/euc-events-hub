# PR #5: Copy-ready independent Claude review handoff

**Status: External Claude review PENDING. No Claude review has been completed or claimed.** No callable Claude tool or installed Claude CLI is available in the implementation environment. This document prepares the requested checkpoint; it does not grant final product, mathematical or merge approval.

Please independently review `jmwangi67/euc-events-hub` PR #5, branch `feat/milestone-1c-organization-planner`. Compare the expansion against the original planner commit `3d817c267594563046c323d1d95e47187992f859` and review the complete PR against main. Do not merge. Report actionable findings with severity, file/line, concrete reproduction, expected behavior and test recommendations. Reconcile findings with the owner before final approval.

## Implementation summary and boundaries

- Existing `/` student calendar preserved; `/planner` adds independent major/academic-level/cluster targeting, significant synthetic campus/local and national commitments, and factual weekly summaries.
- Many-to-many memberships do not imply event targeting. Explicit cluster relevance OR major relevance is intersected with documented event academic levels. Exams retain out-of-sequence and unknown-level uncertainty.
- Seven FullCalendar month day columns stay intact; a planner-only adjacent eighth column is aligned by ResizeObserver. Compact grouped lists retain the blue-gray day sections and white bordered cards, with separate accessible weekly summaries. Planner date headers do not float away when scrolling.
- Default-visible campus/local and national display toggles never narrow proposal conflicts, weekly counts or preparation. Weekly details expose source, verification, time, geography, audience and uncertainty. These dates are fictional scenarios, including THON, Homecoming, football and national names.
- One FullCalendar adapter; pure domain mathematics; range-based fixture access; existing native-dialog focus restoration. No dependencies, persistence, live sources, authentication, theme toggle or infrastructure changes.

## Main files to inspect

- `lib/domain/planning-audience.ts`, `models.ts`, `planning.ts`: audience schemas, typical-level weights, explicit cluster rules and direct conflicts.
- `lib/domain/external-events.ts`, `data/fixtures/planning-context.ts`, `data/fixtures/index.ts`: separate synthetic commitments, memberships, general STEM and upper-level exam examples.
- `lib/domain/exam-pressure.ts`: isolated curve, Saturday onset, lifecycle, DST coordinate, uncertainty bounds and diminishing returns.
- `lib/domain/weekly-planning.ts`, `lib/data/weekly-planning.ts`: complete Sunday–Saturday range fetch, lookahead, counts, canonical identity deduplication, direct intervals and gated overall design.
- `components/calendar/event-calendar.tsx`, `planner-events.ts`: adapter, row alignment, overlays/indicators, current keyboard callbacks after rerender, list date headers and week preview.
- `components/planner/organization-planner.tsx`, `weekly-intelligence.tsx`, `exam-details.tsx`, `app/globals.css`: responsive controls, source explanations, experimental opt-in, semantic tokens and accessible dialogs.
- [ADR 003](../decisions/003-weekly-planning-intelligence.md), PROJECT_SPEC, ARCHITECTURE, AGENTS and README: explicit approved scope reconciliation. Initial Milestone 1C's blanket numerical exclusion now has a narrowly authorized preparation-only exception.

## Mathematical assumptions requiring scrutiny

1. Relative coordinate `x = 1 + C(t) − C(S)` maps Saturday to 1 through Friday 7. `C` uses Eastern date ordinals plus elapsed fraction between IANA-resolved midnights, including 23/25-hour DST dates. Is this normalized day coordinate appropriate for the prototype? It intentionally differs from a fixed number of elapsed hours per day.
2. Strictly preceding Saturday onset, including previous-week Saturday for Saturday exams. No pre-onset contribution; an explicit onset discontinuity is accepted provisionally.
3. Candidate `P = 10 × w × exp(−0.30 × r^1.35)`, with remaining Eastern day units `r`. This is a behavioral approximation, not the supplied raw cube roots or an empirically fitted model. Growth flattens near its bound; it is not globally convex. Night-before and exam morning approach the maximum. At actual start, prep is zero and the exam interval is a separate direct constraint, ending exclusively.
4. Typical-level intersection weight 1; atypical but still relevant 0.65; missing-level weight 0.8. These candidate model strengths are arbitrary and explicitly not enrollment proportions. A multi-level audience uses intersection, not population averaging. Major mappings remain approximations; missing mappings are included conservatively.
5. Unknown hours: return an interval of possible curve values before the exam date, then `[0, 10w]` on that date, no point estimate and no invented hour. These are model bounds, not confidence intervals.
6. Deduplicated bounded combination `10 × (1 − product(1 − P_i / 10))`. Review correlation, saturation, audience overlap, identity quality and uncertainty propagation. It is not a probability/availability interpretation. Cross-layer canonical IDs deduplicate totals and known intervals while category counts may overlap; distinct IDs for the same real occurrence still require future reconciliation.
7. UI week preview samples Eastern day start; it is not a daily average or a proposal-time overlap score. Examine whether this distinction and the ranges are sufficiently clear.
8. **Overall-score gate:** five factor definitions plus preparation contributions, known intervals, date uncertainties and factual counts. Overall status is `awaiting-methodology-review`, score `null`. No aggregate numerical score or calibrated thresholds. Weighting, cross-factor interval union, canonical reconciliation and calibration need explicit approval before implementation.

The ADR contains the full Saturday–Friday Monday/Wednesday/Friday output table. At noon on the preceding Saturday, weight-1 09:00 exams produce 4.96 / 1.54 / 0.38; on Sunday, 7.78 / 2.87 / 0.78. Night before 22:00 ≈ 9.01; exam morning 08:00 ≈ 9.96. These are relative units, not percentages.

## Validation evidence

- `npm ci --cache /tmp/euc-npm-cache`: passed, lockfile/dependencies unchanged.
- `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`: passed.
- `npm test`: **156 passed, 12 files** (49 added cases; 107 original cases preserved).
- `NEXT_TELEMETRY_DISABLED=1 npm run build`: passed; `/` and `/planner` remain request-time routes.
- `CI=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`: **48 passed** (all 38 prior workflows and 10 added browser tests).
- Local Chromium 154; CI uses Playwright's bundled Chromium. See the PR checks for authoritative remote results.
- `git diff --check`: passed.
- First expanded browser run: 46 passed / 2 new test assertions failed (innerText vs textContent normalization; a single-digit regex rejected `10.0`). Both assertions corrected without removing behavior coverage; full subsequent run passed. Visual review separately found and corrected planner sticky date headers and lateral time clipping in overlapping week cards. Planner slots now use side-by-side cards with wrap-capable clocks; a browser assertion checks the proposal card has no lateral overflow.

Coverage includes independent year shortcuts and selections, general STEM/out-of-sequence relevance, many-to-many clusters and explicit targeting/deduplication, default external layers, visibility-independent analysis, complete Sunday–Saturday boundaries across months/years, multi-day/overnight and DST intervals, missing times/sources, preparation onset and buildup, exact start/end transitions, bounded multi-exam aggregation, documented numerical examples, keyboard Enter/Space/Escape/Tab, focus restoration after responsive rerenders, eight-column row alignment and all five responsive widths.

## Screenshots and limitations

See the [screenshot gallery](../previews/planner/intelligence/README.md) for desktop month/week, full tablet/mobile planners, all compact widths, weekly details, and default/hidden visibility controls. All were visually inspected. No remaining page overflow, detached headers or misaligned week rows were observed. Week cards wrap clocks at the range boundary; long overlapping-card titles/metadata can still require internal vertical scrolling within their time slots, with full accessible labels/details retained. Compact pages are deliberately long and synthetic empty weeks remain visible.

Limitations: synthetic/incomplete schedules, curated approximate audiences, arbitrary uncalibrated parameters, potentially wide/saturating unknown-hour bounds, no verified enrollment or attendance interpretation, no fuzzy identity resolution or live data, local unsaved proposals. Human UI approval, independent Claude review/reconciliation and overall methodology/weighting approval remain deferred. Please scrutinize these assumptions instead of treating green tests as product or mathematical approval.
