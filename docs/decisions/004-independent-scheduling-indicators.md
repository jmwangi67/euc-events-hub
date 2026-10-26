# ADR 004: Independent scheduling indicators and provisional non-exam policies

Status: Approved for the owner's master PR #5 implementation request; visual acceptance and any numerical scoring methodology remain subject to owner review.
Date: 2026-10-18

Presentation update, 2026-10-26: [ADR 007](007-calendar-display-activity.md) adds a separate view-filtered daily activity display and replaces the large top summaries. Its explicit PSU-wide/national display exception does not change any analytical input, formula or visibility-independence rule below.

## Context and boundaries

PR #5 needs understandable scheduling guidance without presenting an uncalibrated combined score. This decision adds a separate non-exam analysis and optional factual density visualization. It supplements [ADR 003](003-weekly-planning-intelligence.md), preserving its complete experimental exam-preparation mathematics, audience cells, uncertainty handling, source-conflict rules, and exact temporal boundaries.

There are two independent indicators:

| Indicator                    | Inputs                                                                            | Numerical status                                                    |
| ---------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Exam Preparation             | Academic exams and their existing preparation intervals only                      | Experimental relative preparation bounds; uncalibrated              |
| Other Scheduling Constraints | Eligible non-exam events, explicit audience relationships, and the policies below | Score unavailable (`null`); factual counts and explanatory cautions |

Overall scheduling pressure also remains `{ status: "awaiting-methodology-review", score: null }`. Neither indicator is an attendance probability. Exams, exam preparation, and exam-derived direct conflicts never enter non-exam density. Adding, hiding, or changing non-exam events never changes exam preparation. The prototype does not rank candidate dates or publish proposals.

## Pure domain and data boundaries

`lib/domain/non-exam-scheduling.ts` exports `analyzeNonExamScheduling(context, audience, range, policies)`. Its context contains only engineering events, external events, and organizations. It accepts no exams or calendar visibility controls. The range is an exact inclusive-start/exclusive-end instant interval. Calendar callers supply Eastern midnight boundaries; proposal callers retain their actual proposed hours. Per-date summaries intersect that same range, so an evening concert cannot become a morning proposal overlap.

The result contains:

- Source-labeled constraints and their actual or policy windows, applicability, eligibility, timing certainty, reasons, and original alternatives.
- Independent selected major × academic-level cell counts, including explicit event cluster targeting.
- Exact known-time concurrency segments and per-date maxima.
- Highest-priority and additional cautions, separate all-day counts, date-level uncertainties, and context-only records.
- Explicit `null` non-exam and overall scores.

`lib/data` continues to provide range-based synthetic reads. `policySourceWindow` derives a conservative source-query lookaround from configurable leading and trailing policies; it is not a second policy implementation. With current defaults it expands requested dates two days earlier and seven days later. Hour-buffer lookaround includes an extra boundary day to remain conservative across DST. Weekly reads retain full Sunday–Saturday summaries and the existing independent seven-day exam lookahead. Broader source retrieval never changes factual occurrence dates or counts into earlier weeks.

`getNonExamAnalysisRecords` first gates canonical IDs through the engineering date range or the external policy-source range, then retrieves every published engineering and external source alternative for those IDs across both collections. This prevents an out-of-range alternative from making the remaining claim falsely certain. Public display queries retain their existing range behavior; analysis-only identity expansion does not expose draft or tentative engineering records.

FullCalendar-specific shading, background events, date cues, and focus handling remain inside the existing single calendar adapter and its helper modules. No additional calendar, paid plugin, backend, ingestion service, database, authentication, persistence, or dependency is introduced.

## Audience applicability, identities, and provenance

Each selected major × academic-level cell is analyzed independently. Existing explicit or inherited major relevance and documented college-wide applicability are intersected with event academic-level restrictions. Event cluster targeting is explicit; a host's cluster membership does not imply an event audience. An external record needs the existing explicit broad PSU-wide/curated national designation or a matching documented targeted audience. Ordinary Local context remains excluded analytically.

Consistent duplicate IDs count once within each applicable cell, including identities represented in both the engineering and external layers. Original event classification, source, major/level/time relationships remain associated; metadata from separate alternatives must not create a new Cartesian audience. Conflicting canonical timing or policy claims are retained as source uncertainty and excluded from density. Relevant alternatives are checked with their own timing and audience together. Distinct IDs are not automatically fuzzy-matched to a presumed common real event. Future verified ingestion must reconcile those identities.

Sources and verification are retained with every constraint. Synthetic records are visibly labeled as fictional examples or demo data; a sample university-wide event or break does not assert a real published university date. Context-only Local records may supply a clearly identified contextual notice, but cannot acquire numerical eligibility or a hard analytical avoidance label from their calendar presence.

## Configurable provisional policies

`DEFAULT_NON_EXAM_POLICIES` centralizes calendar-day, elapsed-hour, and relative-priority assumptions. `ExternalEvent.impactPolicy` requires a documented `policyRationale` and appropriate explicit category/scope. Titles never select a policy.

| Commitment                                                              | Default window                                                                                                                          | Guidance and limitations                                                                                                                                                                  |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| THON                                                                    | Seven Eastern calendar days before its first date; the day before, every event date, and the day after form a stronger avoidance window | **Avoid scheduling — THON** overrides its preparation-week caution. Avoidance is advice, not a technical prohibition or universal student unavailability.                                 |
| THON preparation week                                                   | From seven days before its first date up to the day-before avoidance window                                                             | **Scheduling caution — THON preparation week**. Internal relative importance is one-half the maximum THON policy importance; it is not a numerical pressure contribution.                 |
| Explicit major Local concert/festival                                   | Two elapsed hours before documented start through two elapsed hours after documented end                                                | Selected-audience applicability required for density. Unknown clocks yield only a date-level uncertainty notice; no buffer hours are invented.                                            |
| Documented academic break                                               | The two Eastern calendar days before its first date                                                                                     | **Scheduling caution — Students may leave early for break**. Attendance-risk assumption, not an overlapping event. Ordinary holiday names do not qualify; current examples are fictional. |
| Relevant engineering career fair                                        | Eastern midnight on its first date through its documented finish                                                                        | Provisional attendance-impact assumption, with no post-fair buffer. Specialized audience restrictions remain effective.                                                                   |
| Ordinary engineering/organization event or eligible external commitment | Actual scheduled interval                                                                                                               | No additional before/after buffer without an explicit policy.                                                                                                                             |

Calendar-day policies use `America/New_York` civil dates and IANA-resolved midnights. Hour buffers use elapsed instants, preserving UTC offsets, cross-midnight boundaries, and DST transitions. A multi-day event remains one canonical commitment even when its window spans several calendar dates.

THON windows do not add together. The day-before avoidance rule replaces the weaker lead-up caution for that event, and an event's overlapping windows cannot count it twice in the same cell. The internal maximum importance defaults to `1`, lead-up relative importance to `0.5`; these values order policy emphasis only. Neither is added to concurrency counts or exposed as an approved 0–10 score.

## Factual density and caution precedence

The optional **Show scheduling density** overlay is off by default and belongs to the planner. Its four bands mean exactly **0, 1, 2, or 3+ simultaneous known-time non-exam commitments** in the selected cell with the largest concurrent count. They are not Low/Moderate/High risk thresholds, estimates of participation, or sums across unrelated populations. A BME-only event and a CHE-only event at the same time do not become two commitments for an invented combined student. Sequential events do not become simultaneous because they share a date.

Date grids show each date's maximum eligible concurrency; hourly grids show exact interval segments. Compact/List views retain readable textual counts and context instead of forcing an hourly layout. Events remain above noninteractive background layers. Legends and text expose the count independently of color. Event-scope colors, density colors, and preparation bars are separate semantic visual systems.

Unknown-hour records never receive fabricated hourly shading, including THON records with unknown event clocks. Their explicit date-policy cautions still apply. Genuine all-day engineering events are listed and counted separately as documented all-day context; they do not become timed density. Consequently, zero known-time concurrency does not mean a day is free of all-day events, uncertain commitments, missing records, or policy cautions.

Guidance precedence is:

1. **Avoid scheduling** for eligible explicit high-priority policy windows, principally THON.
2. **Scheduling caution** for documented provisional attendance risks.
3. **Review conflicts** for factual applicable overlaps or unresolved timing.

The highest applicable guidance is prominent; additional reasons, source verification, and uncertainty remain available through accessible disclosure. One ordinary known event alone is not labeled a whole-day conflict. Within a proposed interval, that event remains an explicit intersecting commitment that the candidate event must review. Cautions remain visible independently of the density toggle, and context-only notices cannot supersede an eligible analytical caution.

## Exam-preparation presentation

The original curve, candidate relevance strengths, Saturday onset, exact start cutoff, per-cell bounded aggregation, Eastern civil-day normalization, unknown-time bounds, source conflicts, and exact interval maxima are unchanged.

Preparation ranges use solid navy from zero to the lower bound, stripes between lower and upper bounds, and an unfilled remainder to ten. Equal bounds have no uncertain segment; fractional bounds, zero, and unavailable values have text equivalents. Stripes describe uncertainty, not probability, and no midpoint is invented.

Default day summaries lead with the experimental range, affected selected subgroups, main exams, uncertainty, and upcoming exams. Equivalent cell results may be grouped for presentation only. **Advanced methodology & sources** retains every distinct cell, contribution, source mapping, exact lower/upper reference, limiting peak, and optional 10 PM reference. A shared visible explanation replaces repeated generic peak caveats. Missing-audience and contradictory-source warnings remain visible.

## Decisions still needed before numerical scoring

Future numerical non-exam or overall scoring requires owner-approved event weights, normalization, treatment of attendance correlations and participation, uncertainty propagation, source coverage, identity reconciliation across sources, aggregation between independent indicators, calibration data, meaningful display thresholds, and validation with representative schedules. Factual concurrency bands and green regression tests do not provide that approval. Policy advice can change through documented configuration without silently activating a score.

## Validation evidence and acceptance

Pure regression coverage exercises independence, exact proposal intersections, cell integrity, explicit clusters, source alternatives, deduplication, caution precedence, THON dates, concerts/festivals, breaks, fairs, unknown hours, overnight intervals, DST, and configurable lookaround. Presentation/browser checks cover the independent indicators, range bars, density and visibility toggles, modal behavior, focus, responsive views, and event discovery. Final command results and preview links belong in the PR delivery report; this ADR does not claim a check ran merely because it is required.

Owner browser-based visual acceptance remains required. No merge, squash, closure, or approval is authorized by this decision.
