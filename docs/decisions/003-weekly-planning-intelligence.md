# ADR 003: Weekly planning intelligence and experimental exam preparation

Status: Implemented prototype; independent mathematical/product review pending. Overall numerical scoring NOT approved.
Date: 2026-10-16

## Authorized scope and documentation reconciliation

The PR #5 expansion request supersedes the original Milestone 1C exclusion of all numerical pressure work. It authorizes an isolated, labeled **exam-preparation** prototype, factual weekly summaries, and an overall scoring **design**. It does not authorize a numerical overall score, empirical claims, production enrollment data, authentication, ingestion, or dark mode. ADR 001's stack and module boundaries remain unchanged. The earlier blanket exclusions in AGENTS, PROJECT_SPEC and ARCHITECTURE must be read with this explicitly approved exception.

## Audience and data decisions

- Academic levels are first, second, third, fourth, fifth-plus; shortcuts select first+second, third+, or all. They are independent of majors and display visibility.
- Curated organization clusters use many-to-many organization `clusterIds`. An event is cluster-relevant only through its own explicit `targetClusterIds`. Hosting-cluster membership NEVER implies event targeting. Major relevance OR explicit cluster relevance qualifies an event, intersected with explicit event academic-level eligibility. Missing event levels mean no documented level restriction. Public student relevance is unchanged.
- Exams require an intersecting major mapping; missing mappings are conservatively included for a nonempty audience. Typical levels affect model strength, not exclusion. Model-strength factors are 1 for typical-level intersection, 0.65 for out-of-sequence, and 0.8 for unknown levels. These arbitrary candidate weights are **not enrollment fractions**. General STEM fixtures span majors; upper-level fixtures are major-specific. Missing sections, levels, verification and hours remain unknown.
- Significant commitments have a separate schema, category, campus/local vs national scope, geography, audience description and source. Date-only ranges have exclusive ends and unknown clocks. Known intervals retain offsets and must agree with Eastern date bounds. THON, Homecoming, football, concert, State College, election and Super Bowl fixtures are explicitly fictional, including their dates. They are not College-wide engineering events and imply no universal participation.
- Stable IDs identify canonical occurrences. Repeated IDs within a layer count once. A shared canonical ID across layers counts once in the unique total and known-time interval list, while category counts may overlap. No fuzzy deduplication is attempted. Future imports must reconcile identity before scoring; unrelated IDs for the same occurrence would still double count.

## Weekly summaries and presentation

Weeks are Eastern Sunday–Saturday, represented by inclusive Sunday/exclusive following Sunday dates. A multi-day occurrence counts once in every week it intersects. Audience tags overlap and cannot be summed. Category counts and the deduplicated total are labeled separately. Counts are factual record counts, never scores.

The sole FullCalendar adapter retains seven day columns, then renders a planner-only adjacent eighth summary column. A ResizeObserver aligns summary cells to actual month rows; no FullCalendar premium plugins or calendar reimplementation. Compact layouts retain the approved grouped chronological list and offer accessible weekly sections. External month indicators sit on their actual dates; weekly dialogs supply full timing/source/audience information. Week view has an opt-in experimental breakdown; no pressure charts appear in month cells. Calendar visibility controls are not analysis inputs. FullCalendar-specific measurement stays in the adapter.

## Candidate exam-preparation formulation

For an exam on date D, choose the **strictly preceding Saturday S** (Saturday exams use the previous Saturday). No contribution before S. Let C(t) be an Eastern calendar-day coordinate: the UTC date ordinal plus the fraction of actual elapsed time between that date's IANA-resolved Eastern midnights. A civil day has one model unit even when DST gives it 23 or 25 elapsed hours. The normalized elapsed fraction remains monotonic through repeated fall clocks; it is not a fixed-offset conversion.

For a known start T, remaining model days r = max(0, C(T) − C(t)). While S ≤ date(t) and t < T:

`P_i(t) = 10 × relevanceWeight × exp(−decay × r^exponent)`

Candidate parameters: decay = **0.30**, exponent = **1.35**. At and after the actual start instant, preparation becomes **zero**. The known exam interval is instead a direct constraint until its exclusive end. No residual post-exam contribution exists.

This single curve handles every weekday. It starts Monday weekend pressure much higher than Friday, grows nonlinearly, and approaches its maximum the night before and through exam morning. The exponent controls curvature and decay controls width. It is not globally convex: growth accelerates then flattens near the maximum. At the Saturday boundary there is an explicit onset discontinuity. Neither parameters nor shape are evidence-based predictions.

The supplied shifted cube roots are visual references only: they can become negative or exceed 10, have unrelated weekday offsets and no consistent onset/start/end boundaries. The bounded exponential in remaining days supports coherent common parameters and explicit lifecycle boundaries instead.

Unknown exam start: never choose an hour. Before its date, return lower/upper values obtained over the entire possible exam-date interval. On the exam date return `[0, 10 × relevanceWeight]` with no point estimate, because it may be upcoming, active or completed. After that date, zero. These are model uncertainty bounds, not confidence intervals. Midnight bounds are analytical boundaries, not assigned exam timestamps.

### Daily examples

Hypothetical 09:00–10:00 exams, typical-level match (weight 1), same reference week. Values are snapshots at **12:00 Eastern**, not day averages. The exam-date noon value is zero because the example exam has ended.

| Snapshot | Monday exam (Oct 19) | Wednesday exam (Oct 21) | Friday exam (Oct 23) |
|---|---:|---:|---:|
| Saturday, Oct 17 | 4.96 | 1.54 | 0.38 |
| Sunday, Oct 18 | 7.78 | 2.87 | 0.78 |
| Monday, Oct 19 | 0.00 | 4.96 | 1.54 |
| Tuesday, Oct 20 | 0.00 | 7.78 | 2.87 |
| Wednesday, Oct 21 | 0.00 | 0.00 | 4.96 |
| Thursday, Oct 22 | 0.00 | 0.00 | 7.78 |
| Friday, Oct 23 | 0.00 | 0.00 | 0.00 |

For each: night before at 22:00 ≈ 9.01; exam morning at 08:00 ≈ 9.96. Outputs are calculated by the implementation and tested with tolerances. Day-start snapshots in the opt-in UI are labeled with that sampling time and may show a range when hours are unknown. They are distinct from interval-overlap checks at the proposed event time.

## Multiple exams

Deduplicate by canonical exam ID, then combine:

`E = 10 × (1 − product(1 − P_i / 10))`

This returns a single exam's contribution, increases with added positive contributions, saturates at 10, and applies the same monotone rule to lower/upper uncertainty bounds. Empty input yields zero. Reject nonfinite/out-of-range inputs.

This is a diminishing-returns design choice, **not a probability union**. Correlated courses, shared audiences, duplicate upstream IDs and saturation can overstate or hide burdens. A broad audience's typical-level intersection uses maximum mapping strength, not an inferred proportion. We do not average student populations or claim enrollment percentages. These decisions need review/calibration.

## Overall scoring design and implementation gate

`dayPressureBreakdown` exposes separate preparation contributions, actual known-time intervals, date-level uncertainties, and category counts. `SCHEDULING_FACTORS` defines five inspectable factor families. The overall result has status `awaiting-methodology-review` and `score: null`; there is no numeric overall aggregation or hidden weighted sum.

Before any overall score is authorized:

1. Review factor semantics and source reliability. Separate date-presence from actual overlap with the candidate interval. Unknown hours must remain uncertain.
2. Reconcile canonical occurrence IDs across layers. Preserve category tags, but allocate each occurrence once to the final aggregation.
3. Use interval unions/overlap duration for direct commitments rather than adding counts. Exam preparation ends when the exam starts, avoiding that within-exam double count.
4. Review diminishing returns within competing-event/campus/national factor families. An event's size or category alone cannot supply an attendance probability.
5. Approve cross-factor weighting and bounded aggregation only after sensitivity analysis, correlated-audience review and human calibration against representative schedules. Do not add arbitrarily weighted counts to preparation.
6. Validate uncertainty/missing-data explanations and review UI thresholds before exposing any overall numeric value. No low/moderate/high overall labels yet.

## Limitations and independent review

Synthetic, sparse records; approximate sequencing; arbitrary preparation parameters and relevance weights; discontinuous Saturday onset; day-start snapshots; uncertainty ranges may become wide/saturate; no production source coverage, attendance prediction, enrollment, persistence or auth. External events are contextual commitments, not universally binding obligations. Compact weekly summaries increase page length deliberately rather than compressing an eight-column grid.

Mandatory Claude review remains pending unless an actual external review is recorded. Scrutinize equation boundaries, DST coordinates, uncertainty propagation, audience semantics, identity deduplication, column alignment/focus restoration and the overall-score gate. See the copy-ready handoff in `docs/reviews/PR5_CLAUDE_HANDOFF.md`. Do not merge or describe this prototype as finally approved before review findings are reconciled.
