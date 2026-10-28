# Hourly layering and compact calendar cards

Actual rendered Chromium previews use fictional demonstration records only. The
owner's reference images are not committed. They guide overlap mechanics, not the
application's light Penn State-inspired palette. Owner visual acceptance remains
pending; PR #5 must remain open and unmerged.

## Hourly mechanics

FullCalendar's supported `slotEventOverlap` is enabled on both calendars. Within
each temporal cluster it computes collision levels and doubles each layer's
available width, bounded by the day column. Later collision levels have increasing
horizontal offsets and z-index. With two same-start events, the earlier/longer
one occupies the full column and the other starts halfway across it. Three layers
overlap rather than occupy three equal-width adjacent columns. Non-overlapping
events recover the full column. Ordering is start, longer duration, then title;
FullCalendar retains the source instants and all vertical placement.

At most three collision layers are shown directly, reduced to two when the actual
day-column event area is narrower than 168px. Excess records use FullCalendar's
labeled, keyboard-operable more-events popover. This bounds narrow exposed strips
instead of shrinking indefinitely for five or more conflicts. All events remain
individually selectable, including each hidden occurrence in the popover. Escape
closes only the event dialog and restores its opener, retaining the popover.
Popover cards establish their own positioning context so FullCalendar's absolute
focus pseudo-elements cannot intercept clicks intended for neighboring cards.

The noneditable calendar no longer reserves 20px for a resize handle. Timed cards
use 2px vertical / 3px horizontal padding and a 1px bottom gap. Neither cards nor
content descendants use scroll/auto overflow. The calendar's main vertical scroll
remains. Native duration geometry is retained, with only a 1px rendering floor.

Titles use at most two lines, with an inline icon on the first line; wrapped text
returns to the full left inset. Below 54px of card content height they use one
line; below 32px the time/location row gives way to the title; below 20px the
label/icon become 10px. Full original titles, times and metadata remain in the
accessible label and event details. Very short or heavily layered cards necessarily
show less text; their actual duration is not enlarged to accommodate prose.

The Week/Day header uses at most two date-wide/untimed event rows, with the last
row used for native more-events access when needed (`dayMaxEventRows: 2`). It no
longer inherits the Month cell's minimum height.
Unknown-hour activities retain Time TBD, academic date-only constraints retain
Time unknown, and genuine date-wide/all-day records retain their original semantics.
An untimed display position does not assert known all-day attendance.

## Month cards and compact clocks

Month and 2 Weeks use at most three information lines on both calendars:

1. Bold time and regular-weight location, when supplied. Location yields space to
   the time; both truncate within the card. Date rollover cues stay in that row.
2. One title line, with the existing event-type icon and a graceful ellipsis.
3. One meaningful host (including hosting paws) or external scope line, if present.

No placeholder location or invented third field is added. Explicit date-wide
external records need no redundant clock row. Full descriptions, original titles,
source verification/demo disclosures, complete hosting names and locations remain
available through existing details and page disclosures. Private staged-exam
review retains its separate source-status presentation and production safeguards.

The centralized Eastern clock formatter omits only zero minutes in compact card
ranges: `7–8 PM`, `9–10:20 AM`, `11 AM–12:30 PM`. Irregular minutes, both necessary
meridiems, elapsed-time DST disambiguation, next-day and previous-day cues remain.
Detailed date/time labels retain full dates and their existing minute precision.
No canonical timestamps, offsets, category/subtype metadata or analytical inputs
are changed.

## Planner information

Only the standalone Other Scheduling Constraints section is removed from hourly
Week/Day information. Exam Preparation remains opt-in, overall scoring remains
unavailable, and the indicators remain independent. The existing **View all
scheduling reasons and sources for N dates** disclosure still exposes each date's
reasons, sources and uncertainty. Month/2-Weeks summaries, proposal explanations,
source details and all calculations/policies are unchanged. No larger pressure
interface redesign or dependency change is included.

## Rendered evidence

| Scenario                                                                          | Screenshot                                           |
| --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Two overlaps / long fictional CHIPOTLE shift and BME 446 example, 1462px viewport | [Two-event layering](layering-two-overlaps.png)      |
| Three staggered overlaps and two-line titles                                      | [Three-event layering](layering-three-overlaps.png)  |
| Six simultaneous events with native overflow                                      | [Dense Week](layering-dense-week.png)                |
| Each hidden dense event independently selectable                                  | [Dense-event popover](layering-dense-popover.png)    |
| Day, short appointment, compact all-day header                                    | [Day](layering-day.png)                              |
| Student Month, bold clocks and regular locations                                  | [Student Month](layering-month-student.png)          |
| Planner Month, three-line cards and unchanged weekly summaries                    | [Planner Month](layering-month-planner.png)          |
| Planner Week without standalone constraints panel                                 | [Planner Week](layering-planner-week.png)            |
| Planner Day without standalone constraints panel                                  | [Planner Day](layering-planner-day.png)              |
| Preserved Week reasons and sources                                                | [Week disclosure](layering-planner-week-reasons.png) |
| Preserved Day reasons and sources                                                 | [Day disclosure](layering-planner-day-reasons.png)   |
| Chronological list, 320px                                                         | [320px](layering-list-320.png)                       |
| Chronological list, 375px                                                         | [375px](layering-list-375.png)                       |
| Chronological list, 430px                                                         | [430px](layering-list-430.png)                       |
| Chronological list, 768px                                                         | [768px tablet](layering-list-768.png)                |
| Chronological list, 1024px                                                        | [1024px](layering-list-1024.png)                     |
| Chronological list, 1440px                                                        | [1440px](layering-list-1440.png)                     |

`/dev/calendar-layout` runs the same EventCalendar adapter with isolated invented
items in development; it returns 404 in production. The route supplies neither
analytical nor public fixture data. Automated geometry, exposed-edge pointer
selection, Tab/Enter/Space/Escape, focus, overflow and formatting assertions are
in `tests/exam-preview/calendar-layering.spec.ts` and
`tests/calendar-density-layout.spec.ts`. Existing domain regressions retain the
independent scheduling calculations and published-only discovery behavior.

## Local validation

- `npm run format:check`, `npm run lint`, `npm run typecheck`: passed.
- `npm test`: 421 passed in 30 files.
- `npm run build`: passed.
- `npm run test:browser`: 138 production Chromium tests passed.
- `npm run test:exam-preview`: 16 development Chromium tests passed.
- Explicit Markdown formatting and Git whitespace checks passed.

Local browser runs used the environment's installed Chromium through the existing
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` option, with the configured Los Angeles
browser time zone. Screenshots at all six requested viewport widths were visually
inspected. GitHub Actions results on the final commit are reported in PR #5.
