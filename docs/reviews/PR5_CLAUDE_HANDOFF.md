# PR #5: Follow-up independent Claude review handoff

**Status: Follow-up independent review PENDING.** The owner supplied findings from an independent Claude review of `23f81a391b76aec60d3d2a8075161791bffbce07`. This round implements those findings and the owner's final requirements. Codex has not directly invoked Claude and does not claim that Claude reviewed these new changes. Do not merge or treat green tests as mathematical/product approval.

Please review `jmwangi67/euc-events-hub` PR #5 on `feat/milestone-1c-organization-planner`, comparing this correction round against `23f81a3` and the complete PR against main. Return severity, source file/line, concrete reproduction, expected behavior and test recommendations. Reconcile findings with the owner before merge approval.

## Required review material

- [Finding-by-finding reconciliation](PR5_REVIEW_RECONCILIATION.md): H1/H2 and M1–M9 statuses, sources/tests and accepted/deferred limitations.
- [ADR 003](../decisions/003-weekly-planning-intelligence.md): corrected eligibility, audience cells, parameters, exact interval mathematics, examples and gate.
- [Current screenshots](../previews/planner/refinements/README.md): all five planner views, optional preparation, compact summaries, default/hidden layers, intermediate desktop widths and reflow.
- Updated PROJECT_SPEC, ARCHITECTURE and README. The public student calendar retains its approved behavior; no auth, live data, persistence, recommendations, deployment, theme toggle, paid plugins or application dependency upgrades.

## Implementation summary and source map

- `planning-parameters.ts`: validated configurable typical/atypical/unknown level strengths.
- `planning-audience.ts`: independent majors, levels, clusters and major × level cells; unmapped exams remain cautions without numerical contribution. Host-cluster membership never implies targeting.
- `exam-occurrences.ts`: common canonical mapping dedup/merge and conflicting-identity uncertainty, retaining original source records.
- `exam-pressure.ts`: original bounded curve and Saturday boundary, exact “at” vs “left” semantics, per-cell bounded aggregation and most-affected subgroup envelopes.
- `preparation-sampling.ts`: 22:00 daily reference, exact daily/proposal interval maxima and source attribution. Lower/upper maxima can occur at different references.
- `scheduling-eligibility.ts`, `external-events.ts`, fixtures: PSU-wide vs ordinary local vs curated national classification, explicit analytical relationships, source/verification/time uncertainty. Nearby local concerts remain context-only unless explicitly relevant to the selected audience.
- `weekly-planning.ts`, `proposal-analysis.ts`, fixture-access modules: complete Sunday–Saturday weeks, next-week exam lookahead, factual occurrence counts, mapped/uncertain distinctions, eligible proposal constraints, subgroup factors and null overall result. No visibility inputs.
- Calendar adapter/helpers: source, toolbar, item renderer, row alignment and types. Planner Month / 2 Weeks use date grids with eighth-column summaries; only 1 Week / Day use hourly grids. Student view hierarchy remains unchanged.
- Planner components: audience controls, compact week selector above events, weekly dialogs, default overall-unavailable factor panel, opt-in rounded preparation and proposal-time explanations. Existing native-dialog focus behavior remains shared.
- `.github/workflows/ci.yml`: Ubuntu 24.04 and immutable reviewed action revisions, keeping Node 22 for the app and existing cache/artifact contracts.

## Mathematical questions to scrutinize

1. Verify H1: do not pool disjoint BME/CHE exams. Each major × level cell combines its applicable canonical occurrences only; the envelope/most-affected cells are not representative of everyone. Check contributor lists, ties, uncertainty and lack of invented population weighting.
2. Candidate remains `10 × w × exp(−0.30 × r^1.35)`, zero before the strictly preceding Saturday and from the actual exam start onward. Saturday exams use the prior week's Saturday. The owner explicitly retains the onset discontinuity. No smoothing should be introduced.
3. Coordinate `C` uses Eastern date ordinal + elapsed fraction between actual IANA midnights, preserving monotonicity across repeated fall hours and normalizing 23/25-hour dates. Relative `x = 1 + C(t) − C(S)` maps Saturday–Friday to 1–7. Evaluate this modeling assumption separately from exact instant-based overlap.
4. Strengths 1 / 0.65 / 0.8 remain arbitrary candidate parameters; out-of-sequence students are not excluded. Unmapped major/audience records and conflicting canonical timestamps contribute zero numerically and remain warnings. Missing typical levels with known majors use the unknown-level strength, not a fabricated year.
5. Within one cell use `10 × (1 − product(1 − P_i / 10))`, bounded, monotonic and deterministic under order changes. It is not a probability. Examine common-exam dedup, merged mappings, correlation, saturation and retained provenance.
6. Verify H2: interval maxima use monotonic segments and exact transition left limits instead of midnight snapshots or arbitrary minute sampling. At the known exam start prep is zero; the pre-start supremum is valid and clearly labeled. The exclusive interval end is evaluated only as a limit. Known exam end ends direct constraints, not a residual prep factor.
7. Unknown hours produce model bounds: possible starts across the exam date, `[0,10w]` during that date, zero afterward. Maxima of lower/upper bounds may occur at different references and the upper bound may not be jointly attainable. No fabricated clock or confidence level.
8. Daily peak vs 22:00 snapshot and proposal start vs interval peak must stay distinguishable. Following-week exams can cause this Saturday's preparation without entering this week's factual exam count. No post-start point estimate may masquerade as active studying.
9. Verify eligibility: broad analytical context only for explicitly classified PSU-wide/major national commitments; local records need explicit audience targeting. Title/nearby geography and visibility controls cannot silently change analysis. Review the distinction between factual counts, eligible intervals and context-only records.
10. Overall score must remain null/unavailable awaiting methodology review. No raw-decimal overall line, simulated total, Low/Moderate/High threshold, percentage unavailable, extra prep value to add to a total, or date-recommendation UI.

## Documented example

Synthetic biomedical/process exams on October 28, 09:00 Eastern, target BME/CHE separately and typically third year+. For a joint-audience proposal October 27, 17:00–18:00, typical BME cells get only biomedical and typical CHE cells only process: about 8.41 at start and a limit near 8.53 at interval end. The two disjoint burdens do not become approximately 9.75 for a fictitious individual. First/second-year cells remain possible with atypical strength. UI rounds values and names affected subgroups; no enrollment shares.

## Validation and visual review

The implementation runs installation, formatting/check, lint, strict typecheck, unit tests, all Chromium browser tests, production build and diff checks. Local results: **190 unit tests across 13 files** and **63 Chromium browser tests**, including every previous workflow, passed. The authoritative GitHub Actions run is recorded in PR #5. Existing tests remain, with assertions updated only for approved planner labels, scope distinctions and subgroup output structure.

New coverage includes joint majors/levels, common/disjoint/unknown audiences, parameter sensitivity, eligibility, evening/night-before/morning, exact cutoff and exclusive-end suprema, unknown hours, following-week attribution, bounded/order-independent combination, DST, two-week year boundaries, score-null negatives, five views, week-row keyboard access, focus after resize, empty compact summaries, five/six-row months, 320/375/430/768/1024/1280/1440px and 200%-equivalent reflow.

Initial validation found a real compact summary bug: sample/date navigation retained a previously initialized week. Selection is now keyed to the current calendar date while explicit choices persist under filters, with browser coverage. A new multi-element text assertion was corrected to inspect all values. A production rebuild overlapped an early browser run; authoritative browser runs use a fresh stable build. These are implementation/validation notes, not evidence of independent approval.

Final screenshot inspection also found blank desktop planner List date headings: explicit undefined options overrode FullCalendar's formatter defaults. Planner List now uses full weekday/month/date headings, with a browser assertion that every group has a nonempty heading. Student-calendar rendering is unchanged. The preparation-enabled preview waits for all seven daily breakdowns before capture.

Please assess screenshot hierarchy, source/readability, all-day/unknown exam labels, short overlapping hourly cards, week-summary keyboard order and row alignment. Compact pages are long by design; internal vertical scrolling can remain in short hourly slots. Native browser-chrome zoom was not manually driven: 200%-equivalent reflow is automated. Human UI approval and this follow-up Claude pass remain pending.

Common-exam refinement: numerical analysis preserves each original major/typical-level relationship before deduplicating the occurrence within a cell. Multiple applicable mappings use the strongest documented candidate relevance within that cell, once; merged factual metadata never invents cross-major/year numerical relationships. The selected contribution retains its source. The correlated-mapping regression verifies BME-third/CHE-first mappings retain atypical strength for BME-first/CHE-third.
