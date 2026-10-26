# ADR 003: Weekly planning intelligence and experimental exam preparation

Status: Revised for owner-provided independent Claude findings on commit `23f81a3`; follow-up independent review and overall scoring approval pending.
Date: 2026-10-16

Additive update, 2026-10-18: [ADR 004](004-independent-scheduling-indicators.md) governs independent non-exam constraints, explicitly provisional attendance-policy advice, optional factual density, and the revised preparation presentation. All preparation mathematics and uncertainty rules below remain in force. References to deferred recommendations mean automatic candidate-date ranking; the specific THON/music/break/fair policy cautions in ADR 004 are now authorized.

Presentation update, 2026-10-26: [ADR 007](007-calendar-display-activity.md) adds a separate view-filtered daily activity display and replaces the large top summaries. Its explicit PSU-wide/national display exception does not change any analytical input, formula or visibility-independence rule below.

## Scope and architecture

The owner's PR #5 expansion and final refinement request supersede the original blanket numerical-pressure exclusion for Milestone 1C. Only an isolated experimental **exam-preparation** model is authorized. Overall status remains `awaiting-methodology-review` and its score remains `null`. No attendance predictions, overall thresholds, enrollment shares, automatic date-ranking recommendations, auth, persistence, live ingestion, deployment or dark mode are authorized.

ADR 001's stack and module boundaries remain unchanged. Calculations live in pure `lib/domain` modules, range-based fixture reads in `lib/data`, Eastern conversion in `lib/time`, and FullCalendar-specific behavior in the single calendar adapter and its focused helper modules. Audience controls, proposal factors, pressure explanations, weekly details and navigation are separate components. The public student calendar retains its four views, URL state, search, published-only queries, existing relevance and details behavior.

## Overall scheduling-pressure eligibility

Factual record counts never constitute a score. Eligible future analytical factors are:

1. Explicitly classified **PSU-wide** commitments (THON, Homecoming, football, or another reviewed university-wide designation), with a documented broad-context reason. These do not imply uniform student participation.
2. Explicitly classified **major national** commitments (election, Super Bowl, or another curated designation), with a documented reason. Popularity or reach is not an attendance probability.
3. Published events, exams and preparation relevant to the selected major × academic-level audience and explicit organization-cluster relationships.

`ExternalEvent.scope` distinguishes `psu-wide`, `campus-local`, and `national`. `analysis` independently records `broad-context`, `audience-targeted`, or `context-only`, with an explanation. Ordinary local records cannot use broad-context eligibility: they need explicit selected-major/cluster targeting, intersected with any documented academic-level eligibility. Classification is never inferred from a title. A nearby concert or festival remains displayable context and is excluded analytically unless its explicit audience relationship qualifies it. Sources, geographic context, verification and unknown hours remain visible. All fixture names and dates are fictional scenarios, including THON and national-event names.

Display controls independently hide published events, exams, PSU-wide, local context and national layers. All are visible by default. None is an analytical exclusion. Analysis functions accept no visibility arguments. Local contextual counts remain factual and separately labeled; eligible direct intervals and date-level cautions exclude irrelevant local context.

## Audience cells, clusters and unknown mappings (H1, M3, M4)

Selected majors and academic levels are independent. Shortcuts choose first+second year, third+fourth+fifth-plus, or all five levels. A BME+CHE selection means both audiences, not that anyone takes every associated course.

Calculate preparation separately for each selected **major × academic-level cell**. Determine applicable exams, deduplicate their canonical occurrence IDs, apply candidate level strength, and combine within that cell only. Report all cells, the cells with the greatest modeled upper bound, their contributing exams/factors and uncertainty. The subgroup envelope is the maximum across cells, not a pooled individual's burden, population average or statement about everyone. Tied/overlapping uncertain bounds do not establish a precise ranking.

Canonical duplicates with consistent date/timing merge their documented audience/section mappings and count once per applicable cell. Conflicting timing under one canonical ID is withheld from numerical preparation and surfaced as uncertainty. Original source records remain available. Distinct IDs for one real occurrence still require future ingestion reconciliation; no fuzzy deduplication is attempted.

Candidate level strengths are centralized/configurable in `planning-parameters.ts`: typical-level intersection **1**, atypical level **0.65**, unknown level **0.8**. Values are model strengths, not enrollment proportions, study hours or measured effects. Major mappings remain curated approximations. Out-of-sequence students remain included. Missing **major/audience mappings** add no numerical preparation to any cell; the record remains an audience-uncertain academic caution with source and verification. Missing typical levels with a documented major mapping use the unknown-level parameter rather than an invented academic year. Parameter sensitivity is tested at 0, 0.3, 0.8 and 1, including invalid values.

Organization clusters are curated many-to-many memberships. Host membership alone never implies an event audience. An event qualifies through explicit event `targetClusterIds` OR existing major relevance, intersected with explicit event level restrictions. Missing event levels mean no documented restriction. Unspecified cluster targeting is labeled unknown in planner details. Multiple cluster/major matches never duplicate a canonical event.

### BME + CHE example

The fictional upper-biomedical and upper-process exams both start October 28 at 09:00 Eastern. The former maps to BME, the latter to CHE; both typically map to third year and above. For a proposal October 27, 17:00–18:00, each typical-level BME cell gets only the biomedical contribution and each typical-level CHE cell only the process contribution: approximately **8.41 at start**, approaching **8.53 at the exclusive end**. The UI rounds these relative units. It does not combine the two exams into approximately 9.75 for an invented individual or treat that subgroup as the entire audience. First/second-year cells remain included with the atypical strength, without claiming their enrollment.

## Candidate preparation curve and Saturday onset (M1)

For an exam on date D, S is the strictly preceding Saturday; a Saturday exam uses the previous week's Saturday. No preparation occurs before S. The owner's onset discontinuity is intentionally retained, not smoothed.

C(t) is the Eastern date ordinal plus the fraction of actual elapsed time between that date's IANA-resolved midnights. A civil date has one model unit even across 23/25-hour DST dates. The fraction stays monotonic through repeated fall clocks. The reference coordinate is `x(t) = 1 + C(t) − C(S)`: Saturday midnight is 1, Sunday 2, Monday 3, through Friday 7. This is a normalized calendar-day model, not a fixed-offset or fixed-24-hour calculation.

For known start T and remaining model days `r = max(0, C(T) − C(t))`, while date(t) ≥ S and t < T:

`P_i(t) = 10 × relevanceWeight × exp(−0.30 × r^1.35)`

Decay and exponent remain configurable with finite positive decay and exponent greater than one. The shape approximates the owner's desired weekday behavior without copying unbounded shifted cube-root references. Growth accelerates then flattens near its bound; it is not globally convex. Parameters and shape remain uncalibrated assumptions.

At the actual known exam start, preparation becomes zero and the recorded exam interval becomes a separate direct constraint. At its exclusive end the direct constraint ends. There is no residual preparation. Direct time overlap uses real instants, independent from day-level modeling.

Unknown hour: do not select an exam time. Before its date, report bounds over possible start positions across the entire exam date. During its date, return `[0, 10 × relevanceWeight]` and no point estimate. After the date, zero. These are model bounds, not confidence intervals. Midnight analytical boundaries are not assigned exam timestamps.

### Daily examples (weight-1 cell, hypothetical 09:00–10:00 exams)

Noon snapshots are examples of the curve, not whole-day estimates. The exam-date noon value is zero because the hypothetical exam has ended.

| Noon snapshot     | Monday exam (Oct 19) | Wednesday exam (Oct 21) | Friday exam (Oct 23) |
| ----------------- | -------------------: | ----------------------: | -------------------: |
| Saturday, Oct 17  |                 4.96 |                    1.54 |                 0.38 |
| Sunday, Oct 18    |                 7.78 |                    2.87 |                 0.78 |
| Monday, Oct 19    |                 0.00 |                    4.96 |                 1.54 |
| Tuesday, Oct 20   |                 0.00 |                    7.78 |                 2.87 |
| Wednesday, Oct 21 |                 0.00 |                    0.00 |                 4.96 |
| Thursday, Oct 22  |                 0.00 |                    0.00 |                 7.78 |
| Friday, Oct 23    |                 0.00 |                    0.00 |                 0.00 |

Night before at 22:00 ≈ 9.01; exam morning at 08:00 ≈ 9.96; pre-start left limit = 10; exact start and later preparation = 0. These are model units, never percentages.

## Sampling and exact interval limits (H2, M2, M5)

Daily analysis reports a **22:00 Eastern reference** and a **maximum over the Eastern date**. Proposal analysis separately reports its start and maximum over its inclusive-start/exclusive-end interval. Neither is a daily average. The UI labels peaks that may be limiting values immediately before a cutoff; it never presents that value as pressure after the exam starts.

Between discontinuities, all applicable contributions and their bounded combination are nondecreasing. Evaluate the interval's start, each onset/known start/known end/unknown-date boundary inside it, and exact left limits before boundaries and the exclusive interval end. No minute grid or arbitrary epsilon approximates the peak. Evaluating an exact exam start gives zero preparation; evaluating its left limit gives the valid pre-exam supremum. Lower and upper maximum bounds can occur at different references, so both references remain inspectable in the domain output. Under unknown hours, the upper bound is conservative and may not be jointly attainable across all records.

Fetch complete Sunday–Saturday summary weeks plus seven days of exam lookahead. Saturday preparation for a following-week Sunday/Monday exam is included and explicitly attributed to the upcoming exam date. That exam is not counted as occurring in the earlier week. Weekly factual counts only include actual occurrence/date intersections.

Within a cell, after identity deduplication:

`E = 10 × (1 − product(1 − P_i / 10))`

Empty input yields zero, one exam yields its contribution, additions are monotonic, order does not matter, and the result is bounded by 10. Apply the monotone rule to uncertainty bounds. This is a diminishing-returns choice, not a statistical probability union. Correlation, saturation, approximated audiences and uncertain times still require scrutiny. UI values are rounded relative units; raw decimal precision is retained only for calculation/tests and documented examples. No Low/Moderate/High overall labels exist.

## Planner views, summaries and accessibility (M6, M8, M9)

Planner desktop hierarchy: **Month | 2 Weeks | 1 Week | Day | List**. Only 1 Week and Day use hourly grids. 2 Weeks uses FullCalendar's standard day grid, two Sunday–Saturday rows, fortnight navigation and the same eighth summary column as Month. No paid plugins or duplicate calendar. Month has no daily preparation chart; List has no numerical chart.

The default Week/Day factor area leads with overall score unavailable/pending methodology review and factual commitments. A separate opt-in reveals experimental preparation with synchronized daily peak and evening references, subgroup attribution and uncertainty. Proposal explanations separate known overlaps, date-level cautions, selected audiences, broad commitments, context-only records and optional preparation.

Weekly summary controls include the date range and factual category counts in accessible names. Sunday week-detail buttons occur in calendar row tab order, so users can open a week's summary before traversing that week's events. Summary-to-calendar focus controls and existing Enter/Space/Escape/Tab dialog handling provide predictable navigation and responsive focus restoration. A ResizeObserver matches actual five/six-row and two-row grid geometry; all adapter-specific DOM work stays inside calendar modules.

Compact layouts keep the approved blue-gray day sections, attached full-month date headers and bordered white event rows. A native week selector and current-week summary appear **above** the list. Empty summaries are compact. Explicit week choices persist while filters change; date navigation/sample loading selects the corresponding week. At intermediate desktop widths the proposal form stacks above the workspace, leaving space for readable day columns. Responsive checks cover 320/375/430/768/1024/1280/1440px and 200%-equivalent browser reflow.

## Overall scoring gate and deferred work

The domain exposes eligible factors, source uncertainty, direct intervals, subgroup-specific preparation and factual counts, with overall `{status: "awaiting-methodology-review", score: null}`. No aggregate numerical algorithm or simulated overall values exist.

Before any overall score: reconcile canonical identities across layers; distinguish date presence from actual proposal overlap; union intersecting direct intervals; avoid within-exam preparation/direct double counting; review relevance, correlated audiences and diminishing returns; approve factor weights and cross-factor aggregation; calibrate against representative schedules; review uncertainty and presentation thresholds. Approval cannot be inferred from green tests.

**Future enhancement: Smart Scheduling Recommendations.** Comparing candidate dates and suggesting lower-conflict options remains documentation only. No recommendation algorithm or recommendation UI is implemented.

## CI and review

The runner is pinned to Ubuntu 24.04. Upstream version tags, README breaking-change notes and action inputs/runtime were inspected before pinning checkout 6.1.0, setup-node 6.5.0 and upload-artifact 7.0.2 to immutable SHAs. Their Node 24 action runtime uses hosted runners; the application/test Node version remains 22. Explicit npm caching and zipped diagnostic artifacts preserve the existing input contracts. Remote CI verifies the updated workflow; the failure-only artifact path is source-reviewed and not intentionally forced to fail.

See `docs/reviews/PR5_REVIEW_RECONCILIATION.md` for H1/H2 and M1–M9 statuses, sources/tests and remaining limits. Owner-provided Claude findings are the basis of these corrections; a new independent Claude pass remains pending. Do not merge before owner review and independent-review reconciliation.

Common-exam refinement: numerical analysis preserves each original major/typical-level relationship before deduplicating the occurrence within a cell. Multiple applicable mappings use the strongest documented candidate relevance within that cell, once; merged factual metadata never invents cross-major/year numerical relationships. The selected contribution retains its source. The correlated-mapping regression verifies BME-third/CHE-first mappings retain atypical strength for BME-first/CHE-third.
