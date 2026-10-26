# Compact planner date activity and navigation

Actual application captures use fictional demonstration data only. The large
standalone pressure and weekly summaries are no longer above the calendar. Owner
visual acceptance remains pending; PR #5 remains open and must not be merged.

## Reading the dots

Each visible calendar date has five small circles directly beneath its label.
One distinct calendar commitment fills one circle, capped at five. Outlined empty
circles differ from filled ones without relying on color alone. Accessible labels
retain the actual count and explicitly describe this as display activity, not a
validated pressure score. A zero count never establishes availability.

The active audience, publication rules and calendar-layer visibility control the
inputs. PSU-wide and national external records always count even when their layers
are hidden. Hidden cards remain hidden; Day context identifies the additional
records. An otherwise empty chronological list retains compact broad-scope date
indicators, so this exception remains visible on mobile too. University-hosted
engineering events remain distinct from the external PSU-wide scope and respect
the University Events display control.

Counts come from canonical, unsliced calendar items. A spanning occurrence counts
once per occupied Eastern date. Exact-midnight/date-only ends are exclusive;
DST and year transitions use existing Eastern helpers. Proposals and density
backgrounds are excluded. Academic exams and Local context count when displayed,
without inventing hours or promoting them into an analytical contribution.

Five dots saturate: changing six items to seven changes the accessible count and
day-context contents, while the fill remains five. Dates with sequential events
can have the same dot count as dates with overlapping events. Duration, relevance
strength, impact weights, attendance probabilities and source certainty are not
converted into a numerical pressure estimate.

## Retained analysis and navigation

Day has a collapsed context disclosure for its focused date and previous/next
buttons attached to the outer grid-header edges. The arrows use the existing
calendar navigation, remain keyboard operable and retain focus as dates change,
including year boundaries. The main navigation stays available.

Week/List have small detail controls below the grid, with the existing week
selector, full source-backed summary dialog and focus-week action. Month/2-Weeks
retain their integrated side summaries. Scheduling guidance and all reasons and
sources are below the calendar. Experimental preparation remains available through
a closed analysis disclosure: seven dates for Week, one for Day. The independent
models, eligibility, policies, provisional cautions and null overall/non-exam
scores are unchanged.

Planner date-grid cards own the same centralized 5px gap across event types,
using 2.5px vertical margins with no extra harness margin. This avoids inconsistent
spacing between normal and absolutely positioned multi-day rows. Popover margins are 2px. The
existing 1px timed-event gap and temporal geometry are preserved, together with
native overlap layering, no inner card scrollbars, full event dialogs, shared
icons, host badges, compact clocks and the exact All Times Eastern (ET) label.
Student calendar behavior and spacing are unchanged.

See [ADR 007](../../../decisions/007-calendar-display-activity.md) for the display
boundary and explicitly authorized visibility exception.

## Preview gallery

| Scenario                                                         | Actual render                                    |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| Week with one dot row per date and no large top summary          | [Week](dots-week.png)                            |
| Two-Week per-date signals and retained integrated week summaries | [2 Weeks](dots-two-weeks.png)                    |
| Day-specific expanded context and outer header arrows            | [Day context](dots-day-context.png)              |
| Before hiding published events: two commitments on Monday        | [Before filter](dots-filter-before.png)          |
| After hiding published events: one commitment on Monday          | [After filter](dots-filter-after.png)            |
| PSU-wide/national still counted with every card layer hidden     | [Always-included scopes](dots-always-scopes.png) |
| Uniform tighter Month card separation                            | [Month spacing](dots-month-spacing.png)          |
| Day, 320px                                                       | [320px](dots-day-320.png)                        |
| Day, 375px                                                       | [375px](dots-day-375.png)                        |
| Day, 430px                                                       | [430px](dots-day-430.png)                        |
| Day, 768px                                                       | [768px tablet](dots-day-768.png)                 |
| Day, 1024px                                                      | [1024px](dots-day-1024.png)                      |
| Day, 1440px                                                      | [1440px](dots-day-1440.png)                      |
| Empty mobile list retains broad-scope activity dates             | [Empty list](dots-empty-list-broad-scopes.png)   |

`display-busyness.test.ts` checks counting, visibility provenance, mandatory scopes,
university-host separation, exclusive boundaries, DST and analytical independence.
`planner-day-activity.spec.ts` checks real header geometry, accessible counts,
filter updates, hidden broad scopes, navigation/focus, event dialogs, spacing and
responsive overflow. Existing regressions still exercise the full scheduling
models and development-only review safeguards. Final validation results are
reported in PR #5.

## Final local validation

- Formatting, ESLint, TypeScript and production build: passed.
- Unit tests: **431 passed in 31 files**.
- Production Chromium suite: **150 passed**.
- Development Chromium suite: **16 passed**, including the retained overlap stress
  tests, actual icon inventory and invented academic-review safeguards.
- Explicit Markdown formatting and Git whitespace checks: passed.
- All six requested viewport widths were visually inspected. The new tests also
  verify all six widths, exact per-date labels, filled/unfilled states, the hidden
  broad-scope exception, empty mobile lists, Day-only context, navigation focus,
  event dialogs, and normal/multi-day card gaps without weakening prior checks.

Local browser validation uses the existing installed-Chromium executable option
and the configured non-Eastern browser time zone. Exact-commit GitHub Actions
status is reported in PR #5.
