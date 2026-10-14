
# EUC Events Hub: Architecture Proposal

**Status:** Draft for review  
**Last updated:** October 14, 2026  
**Initial institution:** Penn State University

## 1. Architecture Overview

EUC Events Hub is a standalone web application for engineering event discovery, student organization coordination, and academic-aware event planning.

The application will initially serve Penn State engineering students and student organizations.

Its architecture should prioritize:

- Low initial development and operating costs.
- Maintainability by future student developers.
- Modular, testable application logic.
- Reliable event and exam data.
- Straightforward integration with existing calendars.
- Secure organization and EUC administration.
- Future expansion to additional colleges or universities without premature infrastructure complexity.

Development will proceed incrementally, beginning with a frontend prototype using synthetic sample data.

## 2. Technology Stack

### Frontend

- Next.js App Router
- React
- TypeScript with strict mode enabled
- Tailwind CSS
- FullCalendar standard plugins

### Validation and Testing

- Zod for runtime data validation.
- Vitest for unit testing.
- ESLint for static analysis.
- Prettier for consistent formatting.
- Playwright for end-to-end testing when complete user workflows exist.

### Backend and Database (Later)

- Supabase PostgreSQL for persistent data.
- Supabase Auth for user authentication.
- PostgreSQL Row-Level Security and server-side authorization for access control.

Production infrastructure and authentication will not be implemented during Milestone 1A.

## 3. Application Structure

Proposed initial structure:

```text
app/
  Routes, layouts, and server components

components/
  calendar/
    EventCalendar adapter and event details

  filters/
    Major, organization, and event filters

  planner/
    Exam overlays and conflict indicators

lib/
  domain/
    Types, relevance logic, and conflict calculations

  data/
    Data-access functions and fixture adapters

  time/
    Date parsing, Eastern Time formatting,
    and calendar boundary calculations

data/
  fixtures/
    Synthetic sample records

  local/
    Gitignored local datasets
```

The application should use clear module boundaries without introducing unnecessary repository abstractions, microservices, or additional infrastructure.

### Data Access Layer

The interface should initially expose functions such as:

- `getEvents({ start, end, filters? })`
- `getEventById(id)`
- `getOrganizations()`
- `getExams({ start, end, termId? })`

Calendar date ranges should use inclusive start and exclusive end boundaries.

During Milestone 1, these functions will operate on local fixtures.

When Supabase is introduced, the data-access implementation can change without requiring major changes to frontend components.

## 4. Event Data Model

An event represents one scheduled occurrence.

Each event should support:

- Stable event ID.
- Title and description.
- Start and end date/time.
- All-day designation.
- Location or virtual meeting information.
- Publication status.
- Primary event category.
- Additional tags.
- Hosting organization IDs.
- Relevant engineering major IDs.
- Audience eligibility.
- College-wide designation.
- Targeting classification.
- Optional recurring series ID.

Missing information must be represented explicitly rather than invented.

### Event Identity and Recurrence

A single event record represents one occurrence.

Recurring events may share an optional `seriesId`.

Future recurring calendar integrations must account for:

- Recurring series identifiers.
- Individual occurrence identifiers.
- Canceled occurrences.
- Rescheduled occurrences.
- Exceptions to recurrence rules.
- Recurrence expansion across daylight-saving transitions.

Imported event identity should incorporate the source/feed ID, external UID, and recurrence identifier where available.

Recurring-event expansion is not required for Milestone 1.

## 5. Time-Zone Architecture

### Initial Release Decision

**EUC Events Hub will operate exclusively in the `America/New_York` time zone for its initial release.**

The primary users are Penn State students and student organization representatives located in Pennsylvania.

All user-facing event and exam times will be displayed in Eastern Time, regardless of the viewer's device time zone.

### Requirements

- Use `America/New_York` as the application display time zone.
- Support Eastern Standard Time (EST) and Eastern Daylight Time (EDT).
- Handle daylight-saving transitions correctly.
- Use Eastern Time for local calendar-week boundaries.
- Interpret imported calendar timestamps accurately.
- Preserve unambiguous timestamps for timed events.
- Represent all-day events as date-only values using `YYYY-MM-DD`.
- Preserve original source time-zone metadata when available.

### Out of Scope

The initial release does not require:

- User-selectable time zones.
- Individual time-zone preferences.
- Browser-local event-time conversion.
- International time-zone interfaces.
- Multi-institution time-zone configuration.
- Extensive testing across numerous time-zone environments.

### Implementation

Configure FullCalendar to display events in `America/New_York`.

The selected FullCalendar version must be checked during implementation for the appropriate named-time-zone behavior.

Use appropriate date/time utilities for operations requiring accurate Eastern Time calendar boundaries.

Do not hardcode a fixed UTC offset because Eastern Time changes between EST and EDT.

### Testing

Focused tests should cover:

- Eastern daylight-saving transitions.
- Timed events.
- All-day events.
- Multi-day events.
- Events crossing midnight.
- Calendar-week boundaries.

A small regression check using a non-Eastern system time zone may be included to confirm that browser or runtime settings do not alter Eastern Time display.

This is a correctness check, not a separate user-facing feature.

## 6. Event Relevance and Major-Based Filtering

An event's relevance should be based on its intended audience and content, not solely on the organization hosting it.

An event hosted by AIChE, for example, may be relevant to biomedical engineering students if it features a pharmaceutical company.

### Targeting States

Events may have one of three targeting states:

**Explicit**

The event has reviewed target-major classifications.

**Inherited**

The event uses a hosting organization's documented default academic audience.

Inherited relevance should be identifiable as inferred rather than manually verified.

**Unclassified**

There is insufficient information to reliably determine the relevant majors.

Unclassified events should remain available in the All Events view and may enter a future administrative classification queue.

### Recommended Major View

When a student selects an engineering major, the recommended view should include:

- College-wide engineering events.
- Events explicitly relevant to the selected major.
- Events with applicable inherited major relevance.
- Relevant cross-major and industry-specific programming.

Unrelated student organization events should not automatically appear merely because they are engineering-related.

### Display Filters vs. Planning Scope

These are separate concepts.

**Display filters** determine which events appear on the student's or organization's calendar.

**Planning scope** determines which academic and event conflicts are considered during scheduling analysis.

Hiding an event through a display filter must not automatically remove that event from scheduling conflict calculations.

## 7. Organization Planning Architecture

Organization representatives should eventually access a planning interface containing:

- Engineering-wide events.
- College of Engineering commitments.
- Relevant department and major-specific programming.
- Academic exam schedules.
- Tentative organization events.
- Priority-designated events.
- Scheduling conflict indicators.

### Planning Audience

By default, an organization's planning audience should reflect its declared target majors.

The interface should clearly display the current audience, such as:

"Analyzing for: BME, CHE"

Representatives should be able to adjust the planning audience separately from calendar display filters.

### Conflict Detection

Initial conflict analysis should identify:

- Relevant academic exams.
- College-wide commitments.
- Overlapping events targeting similar students.
- Relevant priority-designated events.

Timed-event overlap should use interval intersection with inclusive start and exclusive end boundaries.

Back-to-back events should not automatically count as overlapping.

All-day and multi-day events require explicit handling based on event type and scheduling context.

### Scheduling-Pressure Score

A future scheduling-pressure score may summarize academic and event constraints.

However:

- The score must use the selected planning audience.
- Component contributions should be explainable.
- Missing exam data should be acknowledged.
- The score should not be represented as a guaranteed attendance prediction.
- Display filters should not silently change the analysis scope.

**A numerical 0–100 scheduling-pressure score is not required for Milestone 1.**

The initial planner will show known scheduling conflicts.

## 8. Academic Exam Data

Exam records should support:

- Exam ID.
- Course ID.
- Academic term.
- Exam date.
- Optional start and end times.
- Whether the exam time is known.
- Course section scope.
- Source.
- Verification status.
- Relevant academic audience.

When an exam's time is unknown, it should be presented as a date-only academic constraint.

Do not fabricate exam start or end times.

Course-to-major mappings should be treated as curated approximations where exact enrollment data is unavailable.

Initial academic data may include common mathematics, chemistry, and physics examinations.

Major-specific exam dates may be collected through participating student organizations, departments, and instructors.

Verification and source attribution are required before treating submitted dates as authoritative.

## 9. Future Normalized Database Structure

The eventual database should support relationships such as:

- Institutions → colleges → departments and majors.
- Institutions → academic terms.
- Organizations ↔ organization types.
- Organizations ↔ coordination networks.
- Events ↔ hosting organizations.
- Events ↔ target majors.
- Events ↔ categories and tags.
- Calendar sources → imported source records.
- Imported source records ↔ canonical events.
- Courses → exams.
- Users ↔ organization memberships and roles.
- Organization-term priority allocations → event designations.
- Subscribers → preferences and newsletters.

The same event may have multiple hosts and multiple imported source records.

The schema should support these relationships without creating duplicate canonical events.

Full database implementation is deferred until persistent storage is necessary.

## 10. Calendar Integration Architecture

The platform should eventually aggregate engineering events from:

- Google Calendars maintained by student organizations.
- College of Engineering calendars.
- Departmental calendars.
- Public iCalendar feeds.
- Approved structured event sources.
- Authorized newsletter announcements.
- Direct organization submissions.

### Import Workflow

1. Register and verify an authorized calendar source.
2. Retrieve source events using an appropriate API, feed, or import method.
3. Validate incoming records.
4. Normalize dates, locations, and event metadata.
5. Match records to existing canonical events.
6. Identify potential duplicates.
7. Route ambiguous records for administrative review.
8. Publish or update verified event information.
9. Preserve source attribution and synchronization history.

The ingestion system must account for rate limits, failed imports, missing events, cancellations, and source updates.

### Source Provenance

Imported records should retain:

- Source identifier.
- External event identifier.
- Source URL when applicable.
- Original timestamp information.
- Import and synchronization timestamps.
- Modification or cancellation status.
- Match type and review status.

A future provenance link should support multiple source records mapping to one canonical event.

### Deduplication

Prefer deterministic matches using stable source identifiers.

Potential fuzzy matches should be suggested for administrative review rather than automatically merged in the initial integration system.

Do not delete a canonical event solely because one source temporarily fails.

### Field Precedence

Proposed precedence, subject to validation:

1. Approved administrator override.
2. Verified hosting organization's source.
3. College or departmental source.
4. Newsletter-derived information.

These rules must be finalized before implementing the ingestion engine.

**No live calendar synchronization, scraping, or newsletter ingestion is required during Milestone 1.**

## 11. Organization Priority-Star System

Each verified organization will initially be eligible to designate up to three priority events per semester.

Each designation represents one priority star.

The purpose is to communicate scheduling importance to other organizations.

Priority stars:

- Are primarily visible in organization planning mode.
- Do not reserve event dates.
- Do not guarantee attendance.
- Do not automatically give an organization promotional preference.
- Are not allocated based on organization size during the initial version.

Before implementation, the system must define:

- How co-hosted events consume allocations.
- Cancellation and refund rules.
- Deadlines for priority designation.
- Semester reset behavior.
- Administrative exceptions.
- Concurrent allocation enforcement.

The backend must enforce allocation limits rather than relying exclusively on frontend controls.

## 12. Authentication and Authorization (Later)

### Public Users

May view approved and published events.

### Verified Organization Representatives

May manage authorized organization event drafts and submit priority-designation requests.

### EUC Administrators

May review events, verify sources, manage organization access, and administer platform settings.

### Security Principles

- Individual user accounts.
- Least-privilege permissions.
- Server-side authorization.
- Database row-level security when applicable.
- Input validation.
- Secure credential management.
- Appropriate audit logging.

Frontend visibility controls are not security boundaries.

GitHub repository permissions must remain separate from production application permissions.

## 13. Fixture and Data Privacy Policy

The public GitHub repository should contain only synthetic and non-identifying sample datasets unless explicit redistribution permission has been established.

Real datasets should be stored separately in a gitignored local directory such as:

`data/local/`

Actual event or exam records must be evaluated for publication rights and personal information before being committed to the repository.

Milestone 1 should use synthetic fixtures matching the intended schema.

Do not commit credentials, private calendar links, student records, mailing lists, or sensitive information.

## 14. Scalability and Future Expansion

Although EUC Events Hub initially serves Penn State, the architecture should permit future expansion to other colleges or universities.

The data model may include institution identifiers and institution-local configuration.

However, the initial application should not implement:

- Multi-university administrative dashboards.
- International time-zone settings.
- Complex multi-tenant user interfaces.
- Microservices.
- Distributed queues.
- Dedicated search infrastructure without demonstrated need.

Design for possible expansion without implementing unnecessary features.

## 15. Development Milestones

### Milestone 1A: Application Foundation

Implement:

- Next.js application scaffold.
- Strict TypeScript.
- Tailwind design tokens.
- ESLint and Prettier.
- Zod data schemas.
- Vitest test framework.
- Synthetic fixtures.
- Basic domain models.
- Range-based data-access functions.
- Major relevance logic.
- Eastern Time utilities.
- Basic continuous integration checks.
- README development instructions.

Acceptance requires a successful clean installation, lint, type check, test run, and production build.

### Milestone 1B: Student Calendar

Implement:

- Public events calendar.
- Month, week, day, and list views.
- Event details.
- Major filters.
- Organization filters.
- Category filters.
- College-wide event inclusion.
- Shareable URL-based filter state.
- Responsive layouts.

The calendar must correctly apply relevance rules and display event details.

### Milestone 1C: Organization Planner Prototype

Implement:

- Planning calendar mode.
- Exam overlays.
- Planning audience selection.
- Known scheduling-conflict indicators.
- Explanatory conflict details.
- Priority-star visual examples where useful.

Do not implement production authentication, live data synchronization, or numerical pressure scoring during this milestone.

## 16. Key Risks

The architecture must account for:

- Availability and permission to access external event feeds.
- Incomplete exam coverage.
- Event duplication.
- Cancellations and schedule changes.
- Incorrect major relevance.
- Daylight-saving errors.
- Future authorization vulnerabilities.
- Public repository data exposure.
- Maintenance after EUC leadership transitions.
- Changes in third-party service pricing or availability.

## 17. Open Architectural Decisions

The following decisions remain unresolved:

1. Final event and exam schema details after reviewing actual source formats.
2. External calendar feed availability and synchronization approach.
3. Production database configuration.
4. Authentication and organization verification process.
5. Priority-star cancellation and co-host policies.
6. Production hosting and institutional approval.
7. Public repository licensing and long-term ownership.
8. Newsletter delivery infrastructure.

These decisions should be resolved when their corresponding implementation milestones approach, rather than blocking initial frontend development.
