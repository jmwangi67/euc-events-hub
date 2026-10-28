# Calendar layout, interactions and actual icon inventory

These screenshots contain fictional demonstration records only. The inventory is the actual shared EventTypeIcon output, not substitute artwork. Open `/dev/icons` with `npm run dev` to review every mapping; the route returns 404 in production.

| Review scenario                                                       | Screenshot                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------- |
| October 26–27 linked overnight event                                  | [Overnight](calendar-overnight.png)                           |
| October 25: all four cards; compact crowded dates and weekly controls | [Four cards](calendar-four-events.png)                        |
| Compact overflow popover                                              | [Popover](calendar-popover.png)                               |
| PSU-wide event details                                                | [Homecoming](details-scenario-homecoming.png)                 |
| Local event details                                                   | [Local festival](details-scenario-local.png)                  |
| National event details                                                | [National sporting scenario](details-scenario-super-bowl.png) |
| Focused 1 Week with independent summaries                             | [Focused week](focused-week.png)                              |
| Student Month, including explicit research flask                      | [Student icons](student-icon-month.png)                       |
| Exam sheet/pencil in details                                          | [Exam details](exam-sheet-details.png)                        |
| Original THON geometry with corrected inline alignment                | [THON alignment](thon-alignment.png)                          |
| Complete actual rendered icon inventory                               | [Inventory](icon-inventory.png)                               |
| Mobile 320px                                                          | [320px](calendar-mobile-320.png)                              |
| Mobile 375px                                                          | [375px](calendar-mobile-375.png)                              |
| Mobile 430px                                                          | [430px](calendar-mobile-430.png)                              |
| Tablet 768px                                                          | [768px](calendar-mobile-768.png)                              |
| Narrow desktop 1024px                                                 | [1024px](calendar-mobile-1024.png)                            |
| Desktop 1440px                                                        | [1440px](calendar-mobile-1440.png)                            |

## Rendering decisions and limitations

FullCalendar's native date-wide bars remain continuous. Its timed multi-day dayGrid blocks are replaced only for display by linked timed slices. Start/end instants are clipped to their visible Eastern date, while original source records, canonical counts and analytical intervals are unchanged. Start and continuation open the same full event details; exact-midnight ends do not acquire another day. Range labels stay together when width permits, with narrow-cell wrapping as an accessible fallback. A continuation is explicitly an end/continuation marker rather than an all-day commitment.

Compact mode is conservative and count-based: dates with three or more overlapping occurrences use time/title/host-or-scope; overnight segments and popovers are compact. One/two ordinary cards retain the full layout. Native overflow is bounded at four events, allowing October 25's four compact cards without a more link while retaining useful overflow elsewhere. This is not unrestricted row growth or a general optimal-packing algorithm. Original titles, hosting identity, source precision and demo disclaimers remain available; no blanket title-prefix deletion is applied.

Curated date-wide display precision never changes `timeKnown`, source reconciliation, numerical eligibility, scheduling policies or any score. Missing-hour activities say Time TBD; exams retain meaningful Time unknown cautions. Full details preserve source precision and explicitly disclaim continuous attendance when hours were not supplied.

Event clicks, including overflow events, are independent of summary clicks. Each weekly summary has one Focus this week in calendar action and one separate details interaction. Calendar backgrounds and ordinary dates have no summary opener. All six requested responsive widths and original alignment assertions remain covered.

Music, sports, festivals, celebrations, THON and neutral special-event mappings are retained. Only explicit research and examination symbols were replaced. The inventory lists every category, career subtype, research/exam selection, external classification, THON fallback and neutral fallback, including sharing/usage. Symbols are independent of category/scope color and hosting paws. No new icon dependency or public category is added.

Validation results and final CI are reported on PR #5. Human visual acceptance remains pending; screenshots and browser checks are not formal accessibility certification.

Modal Escape handling runs in capture phase so FullCalendar's document-level popover listener cannot dismiss the underlying overflow while closing event details. The popover remains available and focus returns to its originating event.
