# ADR 007: Compact calendar display activity

Status: Approved for implementation by the owner's compact per-day dot request; visual acceptance remains pending.
Date: 2026-10-26

## Decision and scope

Replace the large standalone summaries above the planner calendar with five small
activity dots beneath each visible date. This is a separate presentation signal,
not an overall pressure score, a new non-exam model, an attendance estimate, or a
concurrency measurement. ADRs 003 and 004 continue governing the independent
analytical models, including their unchanged visibility independence and null
overall/non-exam scores.

Use the same canonical, unsliced items returned for the active calendar display:
current audience relevance, publication rules and active display toggles apply.
Add PSU-wide and national external records for the visible date range even when
their layers are hidden, as explicitly requested by the owner. This exception
does not force hidden cards to appear. University-hosted engineering records are
not synonymous with the external PSU-wide scope and still respect University
Events visibility.

Each distinct canonical calendar item fills one dot, capped at five. Actual counts
remain in accessible labels and day context. A spanning occurrence counts once on
each Eastern date it occupies; exclusive midnight/date-only ends, DST and year
boundaries are respected. Duplicate broad-scope and visible records count once.
Proposals and background shading are excluded. Visible academic/date-only exams
and displayed Local context are included as factual records, without asserting
known hours or analytical eligibility. Zero records do not establish availability;
five dots do not imply a calibrated level of risk.

The pure display adapter lives in `components/calendar/display-busyness.ts`, with
loading in the existing calendar-source adapter. It neither consumes the heavier
non-exam analysis output nor feeds values back to analytical functions. Existing
domain models, fixture records, policies, weights and time calculations are not
changed. No dependencies are added.

## Presentation and access

Time-grid dots sit beneath each column date. Month/2-Weeks dots sit beneath each
individual day number, and chronological-list dots accompany their shared date
header. Filled versus outlined circles provide a shape/fill difference, with an
accessible count and interpretation. This signal belongs only to the planner.

Week/List retain small below-grid week-detail controls and the existing summary
dialogs and focus-week navigation. Month/2-Weeks retain their integrated weekly
side summaries. Day has no weekly summary controls; its compact day-context
disclosure describes only that date's counted items and identifies broad-scope
records included while hidden. Previous/next-day buttons attach to the outer
edges of the Day grid header and use the existing Eastern navigation callbacks.

Scheduling guidance and full reasons/sources remain below the calendar. The
existing experimental exam-preparation inspection remains behind a closed
below-grid disclosure, for seven dates in Week or one date in Day. This preserves
access without restoring the large default top block. All analytical inputs
remain independent of display toggles even though the new activity dots respond
to them.

## Validation and tradeoffs

Pure tests cover the display-only inclusion rules, mandatory scopes, canonical
counts, date boundaries, DST and analytical independence. Browser checks cover
alignment, filtering, source explanations, keyboard/focus behavior, tighter card
spacing, and responsive views. Actual results and fictional previews are recorded
in the PR delivery and preview gallery.

The five-dot display saturates: changes above five items affect the accessible
count and day-context list without changing the filled-dot pattern. Dots count
date presence, not the duration, simultaneity, importance or certainty of an item.
Deep analysis is still needed to assess a proposed time. The hidden PSU-wide and
national exception means dot counts can exceed visible card counts; the interface
states that rule explicitly.

## Owner-approved dot presentation refinement

The subsequent dot-refinement request adds centered display labels: Free, Open,
Light, Moderate, Heavy and Extreme for zero through five filled dots. These words
are presentation labels only. In particular, Free/Open do not establish
availability, and Heavy/Extreme are not analytical thresholds or calibrated risk.
Accessible text explicitly states the recorded-activity interpretation and
retains the exact count even above five.

Fixed border-box circles, a separate neutral outline, green/yellow/orange/red
fills and the text label supply consistent, color-independent presentation.
There are no changes to the counting function, source inclusion, mandatory
PSU-wide/national exception, independent analytical models or student calendar.

Native overflow counts hidden rendered segments, not activity dots or total
records. The planner uses explicit `+N more` text. Regression checks distinguish
three/four cards that fit from genuine overflow, including display-filter and
range rerenders. FullCalendar continues owning placement and popover interaction.
