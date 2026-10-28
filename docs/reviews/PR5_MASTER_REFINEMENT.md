# PR #5 master refinement implementation review

This report covers the owner's master refinement request applied on top of `af98780c0962d35c86ce6f4c3240787b74fee00e`. That starting branch was clean and matched PR #5. Existing work and regression coverage were preserved. The earlier [review reconciliation](PR5_REVIEW_RECONCILIATION.md) remains relevant to the unchanged exam mathematics and canonical exam handling.

| Request area                                    | Implementation                                                                                                                                                                                                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope colors, ordinary borders, arrow alignment | Central semantic tokens and fixed scope-card colors across all planner views; square centered SVG controls; readable overflow links and unchanged scope colors while focused                                                                                   |
| Terminology and discovery                       | Local, Academic Exam COURSE, Example/Demo presentation; GBM and Social & Recreational retain existing categories; representative fictional records; existing source-backed EventDetails reused                                                                 |
| Weekly controls                                 | Factual dialogs retained; Focus this week in calendar still moves focus without changing view                                                                                                                                                                  |
| Independent indicators                          | Exam Preparation uses only exams; new non-exam API accepts only event/organization/external data; both non-exam and overall numerical scores remain null                                                                                                       |
| Preparation presentation                        | Solid lower bound, striped uncertainty, unfilled remainder; exact fractional accessibility labels, zero/unavailable/forced-colors support; equivalent results grouped only for display; advanced sources/references/10 PM remain available; shared caveat once |
| Scheduling policies                             | Configurable THON lead-up/avoidance, explicit major Local music buffers, documented fictional break lead-up and relevant career-fair window; ordinary events use actual intervals; every policy remains provisional                                            |
| Density and cautions                            | Optional off-by-default overlay; factual maximum simultaneous known-time commitments within each independent audience cell; 0/1/2/3+ bands; date/hour/list treatments; priority guidance independent of display controls                                       |
| Source uncertainty                              | Complete canonical non-exam alternatives retained across engineering/external layers, including outside-range alternatives; conflicting timing/policy claims withheld from density; per-window audience, source and classification retained                    |
| Responsive and keyboard behavior                | Six widths, five planner views and four public views; existing grouped compact lists, shared date headers, compact times, overnight cues, Enter/Space/Escape and focus restoration retained                                                                    |

## Additional correctness findings resolved during review

Broad-context external eligibility previously bypassed explicitly recorded academic-year restrictions. Both broad and targeted records now respect selected years, including empty selections. This changes no exam curve or formula.

Range-only non-exam reads could hide a conflicting source claim outside the requested dates. Analysis now gates canonical IDs by relevant source/policy windows and retrieves complete source alternatives across both non-exam collections. Public display queries retain their default published-only range behavior. Same-ID cross-layer records deduplicate consistently; contradictory times never become two certain density intervals.

Rendered screenshot review caught FullCalendar's default green hourly fill overriding the requested density palette, default focus darkening of scope cards, insufficient dark-cell overflow-link contrast, and List spacing issues. The CSS was corrected and tests now check actual background intervals, not just legend swatches.

## Important files

- Domain: `lib/domain/non-exam-scheduling.ts`, `scheduling-eligibility.ts`, `external-events.ts`, `models.ts`, `proposal-analysis.ts`, `source-labels.ts`.
- Data: `lib/data/fixtures.ts`, `planner.ts`, `weekly-planning.ts`; fictional additions in `data/fixtures/`.
- UI: `components/calendar/calendar-density.tsx`, `event-calendar.tsx`, `calendar-toolbar.tsx`, `event-details.tsx`; `components/planner/other-scheduling-constraints.tsx`, `preparation-range.tsx`, `preparation-details.tsx`, `pressure-panel.tsx`, `proposal-factors.tsx`; centralized colors in `app/globals.css`.
- Tests: new non-exam policy/query/independence/eligibility, preparation-presentation and discovery cases; `tests/master-calendar.spec.ts`, `master-discovery.spec.ts`, `master-indicators.spec.ts`; original browser cases retained with precise new labels and fixture expectations.
- Decisions: [ADR 004](../decisions/004-independent-scheduling-indicators.md), additive ADR 003 note, architecture/specification/design-system updates, README and [preview gallery](../previews/planner/master-refinement/README.md).

## Validation and visual acceptance

Baseline: 216 unit tests and 63 Chromium browser tests passed before implementation. The final suite adds 92 unit cases and 20 browser workflows. Final command results and preview inspection are recorded in the [gallery validation section](../previews/planner/master-refinement/README.md#validation) and PR description.

The architecture, dependencies, lockfile and CI infrastructure are unchanged. No real schedules, authentication, persistence, publishing, paid plugins or date-ranking feature were added. Owner browser-based visual acceptance remains the next step; no merge or approval is implied.

## Limits and future decisions

Fictional coverage and audience mappings are incomplete. Source owners must reconcile contradictory claims before reliable timed density can resume. Unknown-hour and all-day records do not create hourly shading; zero timed density never establishes that a date is free. Distinct source IDs are not automatically inferred to describe the same real occurrence. Crowded hourly cards retain internal scrolling, complete accessible names, details and a chronological alternative.

Policies provide advice, not prohibitions or empirically measured attendance risk. Preparation remains uncalibrated and may have wide/saturated bounds. A numerical non-exam or overall score still requires owner-approved weighting, normalization, uncertainty/coverage treatment, representative calibration and validation; no approval follows from factual concurrency bands or green tests. Local validation uses system Chromium; GitHub Actions checks Playwright's bundled Chromium under Node 22. No formal accessibility certification is claimed.
