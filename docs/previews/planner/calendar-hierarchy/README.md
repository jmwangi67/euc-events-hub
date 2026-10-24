# Planner hierarchy and navigation review

All screenshots use the repository's fictional demonstration events and exams. No private academic records are shown.

| Scenario                                   | Preview                                               |
| ------------------------------------------ | ----------------------------------------------------- |
| Crowded Month, density off, 1440px         | [Month / neutral](hierarchy-month-off-1440.png)       |
| Crowded Month, density on, 1440px          | [Month / purple density](hierarchy-month-on-1440.png) |
| 2 Weeks, continuous Homecoming bar, 1440px | [2 Weeks](hierarchy-two-weeks-1440.png)               |
| 1 Week reached through navigation, 1440px  | [1 Week](hierarchy-week-1440.png)                     |
| Narrow desktop Month, 1024px               | [1024px](hierarchy-month-on-1024.png)                 |
| Mobile 320px                               | [320px](hierarchy-mobile-320.png)                     |
| Mobile 375px                               | [375px](hierarchy-mobile-375.png)                     |
| Mobile 430px                               | [430px](hierarchy-mobile-430.png)                     |
| Tablet 768px                               | [768px](hierarchy-mobile-768.png)                     |

## Implementation and evidence

- Planner grid ordering is strict: multi-day date-wide commitments, single-day untimed/all-day records, then chronological clocks. Start, longer duration, title and occurrence identity resolve ties. It does not change timestamps, exclusive ends, numerical contributions or source certainty.
- Homecoming spans Friday–Saturday and continues Sunday as one occurrence. The regression checks its two continuous segments, width across cells and position above shorter records. Unknown-hour records retain Time unknown. Other records remain available directly or through FullCalendar's more-events control.
- Density header counts are removed; background shades use the approved purple tokens. The legend and optional interval disclosure retain factual meaning, with an explicit zero-is-not-safe caveat. Scope cards stay opaque. Existing tests retain analytical equality with layers hidden and verify all four colors and date/control contrast.
- View 1 Week navigates from the Sunday control using the existing date/view setters. Separate Weekly summary details remains keyboard accessible and restores focus. Tests cover normal weeks, September–October and December–January boundaries.
- The structural grid and outer frame use centralized tokens. Existing strict row-alignment checks caught the frame's 2px offset; the measurement now excludes the frame border rather than relaxing those assertions.
- Original decorative line SVG icons use structured categories/external classifications/exam kind, with a neutral fallback. No title keyword detection, new taxonomy, official artwork or dependency is introduced. Unit tests cover every mapping and the fallback.
- The existing public student calendar, private exam review, independent analytical models, THON policies and unavailable overall score remain intact.

Review verdict: implementation suitable for owner visual review. Readable narrow hourly cards still use the existing scrolling/details alternatives; dense dates retain more-events access. This is not formal accessibility certification. Owner visual acceptance is required before merge.

The full validation and CI results are reported on PR #5. The regression suite checks all six requested widths, calendar/summary alignment, keyboard/details behavior, density toggles, uncertain times and the original analytical cases. See [design rules](../../../DESIGN_SYSTEM.md#planner-hierarchy-and-navigation-refinement).
