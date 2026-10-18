# EUC Events Hub: Product Specification

**Status:** Draft for final architecture review  
**Last updated:** October 14, 2026  
**Institution:** Penn State University  
**Initial audience:** College of Engineering students and student organizations

## 1. Product Overview

EUC Events Hub is a standalone, responsive web application for engineering event discovery and student organization scheduling.

Its primary purpose is to consolidate engineering-related events into a shared calendar and help student organizations make informed scheduling decisions using event and academic exam information.

The platform will initially serve Penn State University Park.

The existing Engineering Undergraduate Council (EUC) WordPress website will remain separate and may link to EUC Events Hub.

### Primary Goals

1. Make relevant engineering events easier for students to discover.
2. Reduce the fragmentation of student organization and departmental calendars.
3. Help organization leaders identify scheduling conflicts.
4. Increase visibility into college-wide and major-specific programming.
5. Establish a maintainable platform that can be managed by future EUC leadership.

## 2. Target Users

### 2.1 Engineering Students

Students should be able to:

- Browse upcoming engineering events.
- Select one or more engineering majors.
- Discover college-wide and relevant cross-major events.
- Filter events by organization and category.
- Search for events.
- Inspect event details and registration information.
- Access events through month, week, day, and list views.
- Eventually subscribe to personalized event newsletters.

The calendar should help students find relevant opportunities without requiring them to follow every individual student organization.

### 2.2 Student Organization Officers

Organization representatives should eventually be able to:

- View the shared engineering events calendar.
- Review relevant academic exam schedules.
- Identify college-wide programming.
- Evaluate potential scheduling conflicts.
- Adjust the target audience used for scheduling analysis.
- Review tentative and priority-designated events.
- Submit and manage their organization's events.
- Designate a limited number of priority events each semester.

Organization planning should emphasize relevant academic constraints and major-related events rather than treating every unrelated club meeting as an equally important conflict.

### 2.3 EUC Administrators

Authorized EUC administrators should eventually be able to:

- Verify organizations and their representatives.
- Review event submissions.
- Manage imported event sources.
- Resolve duplicate or conflicting event records.
- Verify academic exam information.
- Manage event publication status.
- Administer priority allocations.
- Manage newsletters and platform settings.
- Support leadership transitions.

## 3. Product Principles

### 3.1 Centralized Event Discovery

The platform should provide value even before every student organization manually submits events.

It should eventually aggregate information from authorized existing calendars and institutional sources.

### 3.2 Relevance Beyond the Host Organization

Host organization affiliation does not automatically determine event relevance.

An event hosted by one major-specific organization may still be relevant to students in other majors.

The platform must distinguish:

- Hosting organization.
- Organization classification.
- Organization network affiliation.
- Event category.
- Event subject or industry.
- Target-major relevance.
- Audience eligibility.

For example, a pharmaceutical company event hosted by AIChE may still be relevant to biomedical engineering students.

### 3.3 Major-Based Recommendations

Students should see:

- College-wide engineering events.
- Events specifically targeted to their selected majors.
- Relevant cross-major opportunities.
- Events with applicable inherited relevance.

They should not automatically see every unrelated organization meeting.

An All Events view must remain available.

### 3.4 Separate Display and Planning Logic

Calendar display filters and scheduling-analysis scope are separate.

Hiding an event from the visible calendar must not automatically remove that event from conflict analysis.

### 3.5 Transparent Scheduling Information

Scheduling analysis should communicate known conflicts rather than guarantee attendance or predict exact turnout.

Incomplete exam data and uncertain event relevance should be acknowledged.

### 3.6 Source Verification

Imported or submitted information should retain appropriate:

- Source attribution.
- Verification status.
- Last-updated information.
- Cancellation or tentative status.

### 3.7 Privacy and Security

Public source code must not contain credentials, private student information, restricted contact lists, or unauthorized calendar data.

## 4. Event Discovery Features

### 4.1 Calendar Views

The student calendar should support:

- Month view.
- Week view.
- Day view.
- List view.

These views should operate on the same underlying event dataset.

### 4.2 Event Information

Events should display, when available:

- Event title.
- Date and time.
- Hosting organization.
- Event category.
- Location or online format.
- Description.
- Registration link.
- Relevant majors.
- Publication status.
- Source and verification information.

Missing details should not be fabricated.

### 4.3 Event Filters

Students should eventually be able to filter by:

- Major.
- Organization.
- Event category.
- Organization network.
- Date range.
- Search terms.

Milestone 1B will initially implement major, organization, and category filtering.

Major selections may include multiple majors.

Where practical, calendar selections and filters should be reflected in shareable URL parameters.

### 4.4 Event Targeting States

Events should support three targeting states.

**Explicit:** Relevant majors have been reviewed or directly assigned.

**Inherited:** Relevance is derived from a hosting organization's documented default audience.

**Unclassified:** Available information is insufficient for reliable major targeting.

Unclassified events remain visible in All Events.

They should not be indiscriminately recommended to every major.

A future administrative review process may resolve unclassified events.

## 5. Penn State Time-Zone Requirements

EUC Events Hub will operate in the `America/New_York` time zone for its initial release.

All user-facing events and academic exam times will be displayed in Eastern Time, regardless of the viewer's device time zone.

### Required Behavior

- Correctly display Eastern Standard Time (EST).
- Correctly display Eastern Daylight Time (EDT).
- Handle daylight-saving transitions.
- Preserve accurate timestamps from imported calendar sources.
- Represent all-day events using date-only values.
- Use Eastern Time for local calendar date boundaries.

### Not Required for the Initial Release

- User-selectable time zones.
- Browser-local event-time conversion.
- International time-zone interfaces.
- Multi-institution time-zone settings.
- Extensive multi-time-zone compatibility testing.

Testing should focus on Eastern Time, daylight-saving transitions, all-day events, and relevant calendar boundaries.

A limited non-Eastern environment regression check may be used to verify that the application consistently displays Eastern Time.

## 6. Academic Exam Integration

The organization planning interface should eventually display relevant academic examinations.

### Initial Exam Sources

Potential sources include:

- Common mathematics courses.
- Chemistry courses.
- Physics courses.
- Departmental examination schedules.
- Verified contributions from major-specific organizations and instructors.

### Exam Information

Exam records should identify:

- Course.
- Academic term.
- Exam date.
- Time, if known.
- Section scope, if applicable.
- Source.
- Verification status.
- Approximate major relevance.

If the exam time is unknown, the application should display the date without inventing a time.

Exam coverage may be incomplete.

The planning interface must not imply that every relevant examination has been captured.

## 7. Organization Planning Features

The organization planning interface should help representatives evaluate potential event dates.

### Planning Information

The planner should display:

- College-wide events.
- Major-relevant events.
- Verified academic exams.
- Relevant priority-designated events.
- Tentative plans where available.
- Known scheduling conflicts.

### Planning Audience

Planning analysis defaults to an organization's declared target majors.

A clearly labeled control should display the current analysis audience, such as:

"Analyzing for: BME, CHE"

Organization representatives should be able to change that audience independently of visual event filters.

### Conflict Detection

The initial planner should identify:

- Relevant exam conflicts.
- Overlapping major-relevant events.
- College-wide commitments.
- Priority-designated event overlaps.

The system should explain why each reported conflict matters.

Back-to-back events should not automatically count as overlapping.

All-day and multi-day events require appropriate handling.

### Scheduling-Pressure Analysis

A future version may provide an explanatory scheduling-pressure score.

However, the score must:

- Depend on the selected planning audience.
- Distinguish different conflict types.
- Explain major contributors.
- Acknowledge missing information.
- Avoid presenting itself as a guaranteed attendance prediction.

**Numerical overall scheduling-pressure scoring remains excluded.** The approved PR #5 expansion permits the isolated experimental exam-preparation model described in ADR 003, with independent review required.

The initial prototype will identify explicit conflicts instead.

## 8. Priority Event Designations

Each verified student organization will initially receive up to three priority event designations per semester.

Each designation is represented by one star.

### Product Rules

- Equal allocation for all verified organizations.
- Maximum of three designations per semester.
- Stars primarily visible in organization planning mode.
- No exclusive reservation of event dates.
- No guaranteed attendance or promotional preference.
- Backend enforcement once persistent accounts are implemented.

### Deferred Policy Decisions

Before implementation, determine:

- How co-hosted events consume stars.
- Cancellation and refund rules.
- Minimum advance designation requirements.
- Deadline for moving priority events.
- Administrative exceptions.
- Concurrency-safe allocation enforcement.

Priority stars are planned for a later milestone.

## 9. Calendar Aggregation and Data Sources

EUC Events Hub should eventually ingest events from authorized sources, including:

- Public Google Calendars maintained by student organizations.
- College of Engineering calendars.
- Departmental calendars.
- Public iCalendar feeds.
- Approved structured event sources.
- Manual organization submissions.
- Authorized newsletters, with human review.

### Integration Principles

- Verify source access permissions.
- Preserve original event identity.
- Normalize dates and event information.
- Detect duplicate records.
- Maintain source provenance.
- Track source updates and cancellations.
- Support administrative review of ambiguous records.
- Avoid deleting canonical events after temporary source failures.

The same event may appear in several imported sources.

The application should consolidate verified duplicates rather than presenting repeated calendar entries.

**No live calendar ingestion is required during Milestone 1.**

## 10. Newsletter Features (Later)

The platform should eventually offer optional newsletters.

Potential audiences:

- Engineering students.
- Student organization representatives.
- EUC administrators.

Potential delivery frequencies:

- Weekly.
- Biweekly.

Newsletters should highlight relevant upcoming events and provide useful context.

Subscription preferences, unsubscribe handling, privacy requirements, and editorial approval must be implemented before live delivery.

Automated newsletter extraction and delivery are excluded from the initial prototype.

## 11. Authentication and Permissions (Later)

Future roles include:

### Public Visitor

Can browse approved published events.

### Verified Organization Representative

Can submit and manage permitted organization events and request priority designations.

### EUC Administrator

Can verify organizations, moderate events, manage sources, and administer platform settings.

### Security Requirements

- Individual accounts.
- Least-privilege permissions.
- Server-enforced authorization.
- Appropriate database row-level security.
- Secure credential handling.
- Audit logs for important administrative actions.

Application administration is separate from GitHub repository permissions.

## 12. Visual Design Requirements

The interface should follow `docs/DESIGN_SYSTEM.md`.

### Design Direction

- Primarily light interface.
- Penn State-inspired navy and blue colors.
- Distinct accessible colors for event categories and majors.
- Intentional typography and spacing.
- Strong information hierarchy.
- Functional, readable calendars.
- Accessible responsive layouts.

### Avoid

- Generic purple gradients.
- Excessive centered layouts.
- Inter as the default font.
- Uniform rounded corners.
- Repetitive card grids.
- Glassmorphism and unnecessary decorative effects.

The application should resemble a professionally designed productivity platform, not a generic university website or AI-generated dashboard.

## 13. Development Milestones

The product will be developed incrementally.

### Milestone 1A: Application Foundation

**Objective:** Establish a working, testable frontend development foundation.

#### Deliverables

- Next.js App Router initialization.
- React and strict TypeScript.
- Tailwind CSS with semantic design tokens.
- ESLint and Prettier.
- Zod runtime validation.
- Vitest unit testing.
- Synthetic event, organization, major, and exam fixtures.
- Initial domain types.
- Range-based data-access functions.
- Major relevance logic.
- Eastern Time utilities.
- Basic application shell.
- README with setup instructions.
- CI checks.

#### Acceptance Criteria

- Application installs from a clean checkout.
- Local development server starts.
- Lint passes.
- Type checking passes.
- Unit tests pass.
- Production build passes.
- Major relevance tests cover explicit, inherited, unclassified, college-wide, and multi-major cases.
- Time tests cover Eastern Time, daylight-saving behavior, and all-day events.
- No external production services or secrets are required.
- Public fixture records are synthetic.

**Not included:** Full calendar UI, live imports, Supabase, authentication, newsletters, or scheduling scores.

### Milestone 1B: Student Calendar

**Objective:** Create a usable public engineering events calendar.

#### Deliverables

- Month, week, day, and list views.
- Event details.
- Major filtering.
- Organization filtering.
- Category filtering.
- College-wide event inclusion.
- Cross-major event relevance.
- Shareable URL-based filter state.
- Responsive desktop and mobile layouts.
- Accessible event-list alternative.
- Visible event source and status information.
- Basic text search across event titles and descriptions using local fixture data.

#### Acceptance Criteria

- Calendar navigation functions.
- Filters correctly change displayed events.
- College-wide events appear appropriately.
- Relevant cross-major events can appear in recommendations.
- Unclassified events remain available in All Events.
- Event details correctly reflect fixture data.
- Times display consistently in Eastern Time.
- Layouts work across representative viewport sizes.
- Keyboard navigation is functional.

### Milestone 1C: Organization Planner Prototype

**Objective:** Demonstrate academic-aware scheduling functionality.

#### Deliverables

- Organization planning mode.
- Academic exam overlays.
- Independent planning audience control.
- Explicit known-conflict indicators.
- Conflict explanation panel.
- Example priority-star visualization where appropriate.

#### Acceptance Criteria

- Exam constraints appear on relevant dates.
- Planning audience can be selected independently of display filters.
- Known overlapping events can be identified.
- Conflict explanations identify relevant causes.
- Missing or uncertain exam data is labeled.
- No numerical scheduling-pressure score is required.
- No production accounts or database are required.

## 14. Future Development Milestones

### Milestone 2: Calendar Integration

Implement authorized source imports, recurring-event handling, provenance, deduplication, and reviewed synchronization.

### Milestone 3: Database and Authentication

Introduce persistent storage, secure organization accounts, event submission, moderation, and administrative permissions.

### Milestone 4: Advanced Planning

Implement verified academic scheduling workflows, priority-star allocation, and transparent scheduling-pressure analysis.

### Milestone 5: Newsletters

Implement subscriptions, editorial workflows, email delivery, and appropriate analytics.

### Milestone 6: Public Pilot

Conduct accessibility testing, security review, source verification, operational testing, and EUC administrative handoff.

The ordering of later milestones may be adjusted according to implementation dependencies and user needs.

## 15. Data Privacy and Fixture Policy

Only synthetic event and exam fixtures should be committed to the public repository during initial development.

Real datasets should remain in a gitignored local directory until their publication rights and privacy implications are reviewed.

Never commit:

- Credentials.
- API secrets.
- Private calendar URLs.
- Restricted contact lists.
- Student records.
- Unauthorized event datasets.
- Sensitive user information.

Synthetic data should resemble realistic use cases without representing real student information or falsely claiming to be verified Penn State events.

## 16. Explicit Initial Non-Goals

Milestone 1 will not include:

- Penn State single sign-on.
- Production hosting.
- Live Google Calendar synchronization.
- Production database.
- Privileged organization accounts.
- AI-based attendance predictions.
- Automated newsletter parsing.
- Newsletter delivery.
- Multi-university deployment.
- User-selectable time zones.
- Room reservations.
- Numerical overall scheduling-pressure scores (experimental exam preparation is separately authorized by ADR 003).

## 17. Product Success Criteria

The initial prototype should demonstrate that:

1. Engineering events can be presented in one coherent calendar.
2. Students can discover relevant cross-major programming.
3. Major and organization filters behave predictably.
4. College-wide programming remains appropriately visible.
5. Organization leaders can see useful academic scheduling constraints.
6. The interface works on mobile and desktop.
7. The application remains understandable and maintainable by student developers.

Future production success measures may include calendar coverage, repeat usage, organization participation, data freshness, and planning adoption.

No numeric adoption targets are established before piloting.

## 18. Open Decisions

The following decisions remain outstanding:

1. Actual calendar sources and permission to republish their data.
2. Penn State branding and external hosting approvals.
3. Production repository ownership and institutional stewardship.
4. Open-source licensing and contributor rights.
5. Data protection and organization verification procedures.
6. Priority-star cancellation and co-hosting rules.
7. Newsletter delivery services and consent processes.
8. Production operating costs and funding responsibilities.

These decisions should be addressed before the relevant production milestones rather than blocking the initial synthetic-data prototype.

## Approved Milestone 1C expansion (PR #5)

See [ADR 003](decisions/003-weekly-planning-intelligence.md) for audience semantics, curated many-to-many clusters, typical-level exam uncertainty, separately classified synthetic PSU-wide, local-context and national commitments, weekly Sunday–Saturday summaries, per-major × academic-level preparation, exact interval limits and examples, and the overall-score approval gate. Calendar display toggles never narrow analysis. The student calendar and existing module/technology boundaries remain intact. No live schedules, empirical attendance claims, dark mode or production services are introduced.

## PR #5 final owner requirements and review corrections

ADR 003 now governs the corrected prototype: relevant commitments and preparation are analyzed per selected major × academic-level cell, without pooling disjoint majors or inventing enrollment shares. Curated many-to-many clusters add event relevance only through explicit event targeting. Unmapped exams remain source-labeled audience-uncertain cautions and add no numerical preparation. Typical, atypical and unknown-level strengths are centralized candidate parameters.

Overall eligibility is limited to explicitly designated PSU-wide commitments, curated major national events, and commitments relevant to the selected audience. Ordinary nearby concerts/local events remain context-only unless an explicit audience relationship qualifies them. Visibility never narrows analysis; factual counts remain separate from pressure.

Planner desktop views are Month, 2 Weeks (date grid), 1 Week (hourly), Day (hourly), and List. Month and 2 Weeks have weekly summaries after Saturday; compact lists place a selectable weekly summary above events and keep empty weeks concise. The student calendar retains its approved four-view experience.

Week/Day lead with overall scoring unavailable pending methodology review (`score: null`). Optional experimental preparation reports evening references, exact daily/proposal interval maxima and affected cells; known start cutoffs and unknown-hour ranges are distinct from direct overlaps. Saturday preparation may come from an exam in the following week without changing factual weekly exam counts. No overall score, thresholds, attendance probability or dark mode is introduced.

**Future enhancement: Smart Scheduling Recommendations.** Comparing prospective dates and suggesting lower-conflict alternatives is deferred; no recommendation algorithm or UI is authorized in PR #5. See the review reconciliation and updated Claude handoff before independent re-review and any merge decision.

## PR #5 master refinement: discovery and independent scheduling guidance

The owner's master PR #5 request authorizes the focused refinements in [ADR 004](decisions/004-independent-scheduling-indicators.md). Student event discovery retains published-only visibility, existing major/organization/category filtering, search, keyboard activation, and source-backed details. **GBM** and **Social & Recreational** are explicit discoverable categories. Fictional records remain labeled as examples/demo data, including records that resemble PSU-wide or national commitments. The calendar-level time label remains **All Times Eastern (ET)**.

Planner scheduling information has two independent sections:

- **Exam Preparation** uses only the existing experimental academic model. It presents lower/upper relative estimates with solid-and-striped uncertainty bars, selected subgroup attribution, contributing/upcoming exams, and visible meaningful uncertainty. Optional **Advanced methodology & sources** preserves complete cell, timing, mapping, and contribution details. The approved mathematics and exam-source conflict handling remain unchanged.
- **Other Scheduling Constraints** presents an unavailable numerical indicator, applicable non-exam commitments, actual overlaps, all-day context, timing uncertainty, and explicitly provisional policy advice. **Events & scheduling constraints** replaces raw factor IDs with meaningful titles, times, relevance, sources, and verification. Academic exams and exam-derived conflicts are excluded.

Overall and non-exam numerical scores remain `null`. No combined score, attendance percentage, population weighting, or automatic ranking of proposed dates is approved.

The optional planner **Show scheduling density** toggle starts off. Its visual bands report **0, 1, 2, or 3+ simultaneous known-time commitments** in the most affected selected major × academic-level cell. Counts do not establish validated risk levels. Disjoint majors/years are not pooled, sequential events are not simultaneous, and duplicated canonical records count once. Unknown clocks and conflicting sources do not acquire invented hours; genuine all-day events and date cautions remain separate information. A zero timed count does not establish general availability. Month/2 Weeks retain their date grids and weekly summaries; only 1 Week/Day are hourly. Compact/List layouts retain chronological groups and text cues.

Specific policy guidance is authorized as a local prototype: THON avoidance covers the preceding calendar day, every event day, and the following day; a seven-day lead-up caution is weaker and never double-counted with avoidance. Explicit audience-relevant major Local music receives two elapsed hours before/after known event times. Documented fictional break scenarios caution about early departures on the preceding two calendar days. Relevant career fairs apply from Eastern midnight through their documented finish. Ordinary engineering events use actual intervals. These configurable assumptions do not predict universal participation, fabricate unknown clocks, or prohibit event creation. Only documented break classifications qualify; real official break dates must not be invented.

Eligible **Avoid scheduling** guidance takes priority over ordinary **Scheduling caution** and **Review conflicts** reasons, with additional sources and uncertainty available accessibly. Cautions remain visible when density is off. Local context stays analytically excluded without explicit selected-audience applicability. Host cluster membership alone does not establish event targeting. Calendar show/hide controls do not narrow analysis or change either indicator's results.

The application remains a synthetic-data prototype without authentication, live ingestion, database persistence, publication, or new paid infrastructure. Final owner visual acceptance remains required before any merge. Later numerical scoring needs an approved relevance/weighting and normalization model, source-coverage review, calibration data, uncertainty treatment, and representative validation; factual counts and policy priorities do not substitute for those decisions.
