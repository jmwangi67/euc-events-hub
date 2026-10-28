# Planner activity-label and overflow refinement

Actual Chromium renders of the fictional planner sample only. No private source
records or personal schedules appear here. The prior galleries remain historical
previews. These images show the latest presentation.

## Presentation

The centered 22px indicator stacks a small gray word above five nonshrinking,
border-box 6px circles. A shared 1px stroke and 3px gap keep filled/empty dots
identical in shape. Zero through five fills map to Free, Open, Light, Moderate,
Heavy and Extreme. Counts still saturate at five and retain their exact values in
accessible labels and Day context. Free/Open describe recorded activity only;
they do not establish availability. The labels are not calibrated pressure/risk.

Filled-dot tokens use green `#15803D` (1–2), yellow `#A16207` (3), orange `#C2410C`
(4) and red `#B91C1C` (5). Yellow/orange are darker than bright primary shades to
retain graphical contrast; the worst ratio across white, neutral and blue-gray
headers is 4.25:1. Neutral outlines remain `#475569`. Small gray label `#5C6B7D`
retains at least 4.70:1 text contrast across those surfaces. Adjacent-month date
text remains muted without fading indicators. These measured color pairs and
keyboard tests do not constitute a formal accessibility certification.

## Overflow findings and regressions

At inspected head `61a3e716`, the default dense date had eight displayed records:
four cards plus four genuinely hidden records. Its `+4 more` was correct. The
reported redundant trigger was not reproduced. Native FullCalendar placement is
retained; no additional counter, custom popover, DOM-count workaround or altered
limit is introduced. Planner hourly triggers now explicitly say `+N more` rather
than only `+N`, clarifying that these are additional hidden events.

Focused regressions verify:

- Three or four date-grid cards that fit have **no** overflow trigger.
- Five records show four cards plus `+1 more`; eight show four plus `+4 more`.
- The three-card case still has five counted activity records when hidden
  PSU-wide/national layers contribute; dots do not generate overflow.
- Month and 2 Weeks preserve those results after filters and range rerenders.
- An hourly three-event overlap has no trigger; adding another overlapping event
  restores a trigger for its genuinely hidden record.
- Visible cards and overflow items retain the correct details, Enter/Space/Escape
  activation and focus restoration.

FullCalendar's date-grid popover intentionally lists all records for that date,
including cards already shown in the cell. Its **trigger count** still reports
only the additional hidden set. The hourly popover lists its hidden group only.
PSU-wide/national inclusion, Eastern/DST handling, activity calculation, analytical
models, day navigation, student calendar and dependencies are unchanged.

The exact-fit visual check also exposed overlapping weekly-summary controls in
shortened filtered rows. The populated-row minimum increases from 270px to 300px
to keep those existing links separated. Empty rows, four-card limits and native
placement remain unchanged; a browser assertion measures control separation.

## Responsive previews

The application keeps its responsive List/Day choices below 1024px. Desktop
Month/2-Weeks and Week remain available. Screenshots cover all requested widths;
browser checks measure circle dimensions, even spacing, label alignment and
page overflow at each width.

| Width  | Default responsive calendar                                             | Day and preserved edge navigation |
| ------ | ----------------------------------------------------------------------- | --------------------------------- |
| 320px  | [List](responsive-320.png)                                              | [Day](day-320.png)                |
| 375px  | [List](responsive-375.png), [readable top section](list-detail-375.png) | [Day](day-375.png)                |
| 430px  | [List](responsive-430.png)                                              | [Day](day-430.png)                |
| 768px  | [List](responsive-768.png), [readable top section](list-detail-768.png) | [Day](day-768.png)                |
| 1024px | [Narrow Month cells](responsive-1024.png)                               | [Day](day-1024.png)               |
| 1440px | [Month with all six labels](responsive-1440.png)                        | [Day](day-1440.png)               |

- [Three visible cards, no overflow; hidden broad-scope records still count](fits-month.png)
- [Same exact-fit behavior in 2 Weeks](fits-two-weeks.png)
- [Genuinely dense 2-Weeks date with four additional hidden cards](dense-two-weeks.png)
- [Week with centered per-date indicators](week.png)
- [Hidden PSU-wide/national layers still contribute](always-scopes.png)

## Validation

- `npm run format:check`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: **438 passed in 32 files**.
- `npm run build`: passed.
- `npm run test:browser`: **160 passed** (full production Chromium suite).
- `npm run test:exam-preview`: **16 passed** (development Chromium suite).
- Explicit Markdown formatting and `git diff --check`: passed.
- Screenshots inspected at all six requested widths, including narrow Month
  cells, List/Day layouts, Week, exact-fit/dense dates and hidden broad scopes.

Local browser tests use the repository's installed-Chromium executable option
and its non-Eastern browser timezone. Exact-commit GitHub Actions status is
reported on PR #5. No assertions were weakened or tests skipped; no dependencies,
source fixtures, analytical modules or CI infrastructure changed.
