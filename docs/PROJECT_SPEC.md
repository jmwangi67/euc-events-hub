# EUC Events Hub: Product Specification
Status: Draft for independent architecture review (October 2026)

## Purpose
Build a standalone, responsive event-discovery and event-planning application for Penn State Engineering. The existing EUC WordPress site remains separate and may link to the new platform.

## Audiences and workflows
1. **Students:** browse engineering events, select major(s), view college-wide and relevant cross-major events, filter by organization/category, inspect event details, and later subscribe to digests.
2. **Organization officers:** see the shared calendar plus academic exams, relevant institutional events, tentative plans and planning conflicts; later submit and edit events and designate priority events.
3. **EUC administrators:** curate source records, verify exams and organization memberships, review event submissions, manage settings and newsletters.

## Product principles
- A useful calendar should exist even before organizations manually submit events: import verified public/authorized calendar feeds.
- Host affiliation, organization classification, event category, target-major relevance and audience eligibility are separate concepts.
- Major-selected recommended view includes relevant cross-major events and College of Engineering-wide events, not every unrelated club meeting. An all-events view remains available.
- MEP is a coordination/network affiliation, not necessarily an organization type.
- Visual event filtering and scheduling-analysis scope are separate; hiding a conflict cannot erase its effect on a score.
- Calendar planning indicates known conflicts, not guaranteed attendance or exclusive room reservations.
- Label original source, verification status and last-updated information, especially for exam schedules.
- Public source code contains no credentials, private contact lists, or restricted data.

## Planned capabilities (not all MVP)
- Public month/week/day/list calendar, search and event details.
- Major, organization, category and network filters; multi-tag relevance.
- Synced Google Calendar/ICS feeds, authorized department/college sources; deduplication with provenance; manual submissions; newsletter extraction with human approval later.
- Major-sensitive exam overlay using known common-course dates and verified departmental/organization contributions.
- Scheduling pressure by audience, week and ultimately day/time. Initially expose explicit conflicts; numeric scoring is experimental and transparent.
- Three priority event designations per organization per semester, one star per event, visible primarily to organization planners; server-enforced allocation; no exclusive date reservation and no size weighting at launch.
- Weekly/biweekly opt-in newsletters for students and organization leaders, editorial approval before delivery.
- Organization and EUC roles, future officer handoff.

## Milestone 1: Frontend prototype
Use supplied sample data, without live integrations, authentication or production database.
- Responsive light-mode visual style with Penn State navy/blue as structural colors and distinct accessible data colors.
- Working month/week/day/list views with FullCalendar standard plugins.
- Event detail view and functional major/category/organization filters.
- Planner-mode prototype with exam overlay and explicit conflict examples.
- Semantic event types validated with Zod, simple data functions behind lib/data.
- Basic Vitest coverage for relevance/filter logic; lint, format, typecheck and build checks.
- Clearly label example data and nonfunctional actions; no fake RSVP, email delivery or account system.

## Later milestones
2. Import pipeline and normalized records, tracking source provenance and deduplication.
3. Persistent storage, secure officer/admin auth, submission/approval and audited management.
4. Exam verification, priority budgets and transparent pressure analysis.
5. Opt-in newsletters, delivery workflows and analytics.
6. Public pilot, accessibility/security review and administrative handoff.

## Acceptance criteria for first review
- A local developer can install, run and build the app from README instructions.
- Calendar and filters change displayed events correctly, including cross-major relevance and college-wide inclusion.
- Calendar event times display consistently in America/New_York, including DST boundaries and all-day dates.
- Desktop/mobile layouts are functional and keyboard accessible.
- No production external services or API secrets required.
- Tests and checks run reliably.

## Explicit non-goals for Milestone 1
Penn State SSO, production hosting, AI predictions, automated newsletter parsing, multi-university deployment, room booking, and privileged organizational accounts.

## Open decisions
- Actual sample data format, sources and permission to republish.
- Penn State branding/external hosting approvals.
- Production stewardship and code ownership agreement between the personal repository and EUC.
- Data protection and organizational verification process.


## Approved pre-implementation clarifications
- Public committed fixture data must be entirely synthetic and clearly labeled. Real provided datasets belong in gitignored local paths until redistribution rights and privacy are reviewed.
- Event recurrence is deferred, but the prototype represents each event as one occurrence, with optional seriesId.
- Recommended major view: college-wide plus explicit target-major matches plus inherited host-default major matches. Events without enough targeting metadata remain visible in All Events and enter a future classification queue, not auto-matched indiscriminately.
- The planning audience defaults to the organization's declared target majors, separately from display-only filters.
- Scheduling score 0–100 is out of scope for Milestone 1. Display explicit known conflicts instead.

## Revised Milestone 1 increments
**1a Foundation:** Next.js scaffold, strict TS, Tailwind tokens, Zod types, synthetic fixtures, range-based data interface, time utilities, pure relevance filtering, Vitest, CI, README. Pass clean install/lint/typecheck/test/build; cover explicit/inherited/unclassified/college-wide/multi-major relevance and test time logic under Eastern and non-Eastern process time zones.
**1b Student calendar:** functional standard month/week/day/list calendar, event details, shareable URL-based major/category/organization filters, readable mobile list alternative, source and status labels.
**1c Planner prototype:** exam overlays, separate audience controls and explanatory known-conflict panel. No scoring, auth or live feeds yet.

## Time zone scope for the Penn State MVP
All calendar views and organization/exam scheduling use America/New_York. Do not build a user-selectable time-zone experience or multi-institution zone switching in Milestone 1. Keep basic DST-safe event parsing and rendering, including correct all-day dates.
