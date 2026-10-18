# PR #5 master refinement previews

Fictional Example/Demo fixtures only. These are local Chromium production-build captures, not a deployed service or official university schedule. The browser runs in `America/Los_Angeles`; all application dates and times remain Eastern. The density overlay is explicitly enabled in the preview scenarios and starts off in normal use.

## Planner views and scheduling guidance

| Preview                                           | Purpose                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [Month](planner-month.png)                        | Existing date grid, aligned weekly summaries, separate scope and density legends      |
| [2 Weeks](planner-2-weeks.png)                    | Date-grid layout with weekly summaries preserved                                      |
| [1 Week](planner-1-week.png)                      | Known-time non-exam density behind scope-colored events                               |
| [Day](planner-day.png)                            | Hourly layout and independent density intervals                                       |
| [List](planner-list.png)                          | Chronological discovery and factual density labels                                    |
| [Crowded day](crowded-density-day.png)            | PSU-wide, National, Local and ordinary cards over density backgrounds                 |
| [THON avoidance](thon-avoidance.png)              | Avoid-scheduling guidance remains visible with density off; all reasons available     |
| [Experimental preparation](preparation-range.png) | Independent exam-only lower/upper range, striped uncertainty and optional methodology |

## Responsive planner

The compact calendar preserves full-month shared date headings and separate bordered event rows. At desktop widths, the five planner views remain available. Navigation uses square centered arrows.

| Width  | Preview                              |
| ------ | ------------------------------------ |
| 320px  | [Small mobile](calendar-320.png)     |
| 375px  | [Mobile](calendar-375.png)           |
| 430px  | [Large mobile](calendar-430.png)     |
| 768px  | [Tablet](calendar-768.png)           |
| 1024px | [Compact desktop](calendar-1024.png) |
| 1440px | [Desktop](calendar-1440.png)         |

## Student discovery

- [Desktop calendar](student-desktop.png)
- [Desktop event details](student-details.png)
- [Mobile calendar](student-mobile.png)
- [Mobile event details](student-details-mobile.png)

The public calendar retains four views, published-only visibility, compact times and **All Times Eastern (ET)**. New GBM and Social & Recreational examples use the existing source-backed dialog and keyboard activation/focus restoration.

## Interpretation and limits

Scope card colors are classification, not density. Density bands are factual 0/1/2/3+ maximum simultaneous known-time commitments within a selected major × academic-year cell; separate cells are not summed. Recorded all-day commitments and uncertain-hour records are listed separately and do not produce invented hourly shading. The numerical non-exam and overall pressure scores remain unavailable. Experimental preparation uses unchanged exam mathematics and is neither attendance probability nor a calibrated score.

These images support owner browser-based visual acceptance. No merge or design approval is implied. See [ADR 004](../../../decisions/004-independent-scheduling-indicators.md) for policies, unknown-data treatment and future methodology decisions.

## Validation

Passed on October 18, 2026:

- Clean `npm ci --cache /tmp/euc-master-npm-cache`.
- Formatter/check, ESLint, TypeScript, explicit formatting checks for updated documentation, and `git diff --check`.
- `npm test`: **308 tests / 23 files**, including all 216 baseline tests and 92 new cases.
- `npm run build`: production build succeeded.
- `CI=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`: **83 passed**, retaining 63 existing workflows and adding 20 focused workflows.

Actual screenshots were inspected at all six widths and across all five planner layouts, student discovery/details, preparation ranges, THON and crowded density. The review corrected FullCalendar background specificity, focus darkening, overflow-link contrast, List padding and badge layout, and an empty Week-view date chip. Existing mobile card padding and date-group spacing remain intact; the stronger ordinary border uses the new scope token.

Browser checks cover measured scope text contrast, actual hourly density colors, background pointer exclusion, modal focus containment, Enter/Space activation, Escape dismissal/restoration, all view switches and no page-level overflow. System Chromium 154 was used locally; GitHub Actions uses Playwright's bundled Chromium under Node 22. Formal WCAG compliance is not claimed. CI results are linked from the PR description.

Existing coverage is retained; focused cases add policy boundaries, source uncertainty and complete cross-layer identities, strict indicator independence, audience-year applicability, palette layers, category filtering, dialogs, disclosure behavior and responsive layouts.
