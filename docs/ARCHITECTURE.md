# Architecture Proposal (Review Draft)

## Stack
- Next.js App Router, strict TypeScript
- React and Tailwind CSS
- FullCalendar standard plugins behind a single client-side EventCalendar component
- Zod for runtime input validation
- Vitest for pure domain logic; ESLint + Prettier
- Supabase PostgreSQL/Auth only after static prototype, with authorization enforced server-side/RLS
- Playwright after core workflows exist

## Initial modules
- app/: routes, layouts and server components
- components/calendar/: EventCalendar adapter and event detail UI
- components/filters/: audience and display controls
- components/planner/: future exam/conflict planning UI
- lib/domain/: event types, relevance and conflict logic (pure, testable)
- lib/data/: getEvents(), getEventById(), getOrganizations(), getExams(); sample-data implementation initially
- lib/time/: time zone parsing, formatting and calendar boundaries
- data/: locally provided sanitized sample fixtures

No elaborate repository pattern or unnecessary service layer for the initial milestone.

## Event data model (initial)
An Event has a stable id, title, description, start/end, timeZone, allDay flag, location/online details, status, primary category, tags, host organization IDs, relevant major IDs, eligibility/audience and collegeWide flag. The fixture schema must account for optional fields and missing data rather than invent details.

Use an unambiguous ISO instant for timed event start/end, preserving source zone metadata. All-day entries use YYYY-MM-DD date-only values, not midnight UTC. The default Penn State display zone is America/New_York. Weeks and exams use institution-local boundaries. Define behavior for invalid/missing source time zones explicitly.

## Future normalized schema
institution -> college -> department/major and terms;
organizations <-> organization_types; organizations <-> networks;
events <-> hosts; events <-> target majors; events <-> tags;
calendar_sources -> imported_source_records -> normalized_event links;
courses -> exams with provenance and verification;
users <-> organization memberships/roles;
priority_allocations per organization/term -> designated events;
subscriptions and newsletter issues.

The same event may have multiple source records and multiple hosts. Source records retain external ID, source URL, imported timestamps, original payload metadata, update/deletion state and confidence. Never delete an event solely because one source temporarily fails.

## Ingestion pathway (future)
1. Register and verify each authorized public feed (Google Calendar/ICS or supported structured source).
2. Fetch with rate limiting and caching; parse original records into staging tables.
3. Validate, normalize dates and locations, then match by stable source ID and cautious cross-source duplicate logic.
4. Route ambiguous matches and newsletter-extracted items to administrator review.
5. Maintain canonical events with visible source/last verified details; refresh changes and cancellations.
6. Allow manual overrides while preserving source provenance and avoiding overwrite of reviewed fields.

No live scrapers or newsletter mailbox access in Milestone 1.

## Relevance versus planning
Event relevance is derived from curated target-major tags, industry/topic information and college-wide classification; never assume host's major defines all attendees. Students may independently filter displayed events. Planning analysis uses a separate audience/scope object, defaulted from selection but not silently narrowed by display-only filters.

Explicit conflicts: exam in selected course/major; college-wide commitment; overlapping relevant event; priority designation. Later scores should expose component contributions and coverage caveats rather than claim attendance prediction.

## Roles and security (later)
Public: read approved published events.
Verified officer: submit/edit permitted organization's drafts and request stars.
EUC admin: review/publish, verify affiliations/sources, manage allocations and officer access.
Use individual accounts (not shared passwords), least privilege, server-enforced authorization and audit logs. Application admin access is independent of GitHub write privileges. EUC-controlled production operations and owner handoff need documented procedures.

## Scalability
Include institution_id and local zone as conceptual dimensions; initially only Penn State data and interface. Avoid premature multi-tenant UI, search infrastructure, queues or microservices.

## Key risks to review
External feed permission and reliability, duplicates/cancellations, exam coverage bias, relevance misclassification, Daylight Saving Time, row-level security, and maintenance after officer transitions.
