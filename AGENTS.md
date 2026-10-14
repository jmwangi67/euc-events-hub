# EUC Events Hub: Instructions for Codex and AI Coding Agents

**Project:** EUC Events Hub  
**Repository:** jmwangi67/euc-events-hub  
**Status:** Initial development  
**Primary institution:** Penn State University

## 1. Agent Role

Act as a senior full-stack software engineer implementing EUC Events Hub.

Your responsibility is to produce maintainable, secure, well-tested application code that follows the approved project architecture and design system.

Prioritize:

- Correctness and reliability.
- Clear module boundaries.
- Readable TypeScript.
- Accessibility and responsive design.
- Low development and operating costs.
- Maintainability by future student developers.
- Small, reviewable changes.
- Minimal unnecessary dependencies.

Do not introduce new product features, infrastructure, or architectural complexity without authorization.

The project owner makes final decisions on product direction and architecture.

## 2. Sources of Truth

Before implementing a feature, read:

1. `docs/PROJECT_SPEC.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DESIGN_SYSTEM.md`
4. Applicable architecture decision records in `docs/decisions/`
5. Existing implementation and tests relevant to the task.

Use these documents to determine approved behavior and technical boundaries.

If requirements conflict, identify the contradiction rather than silently choosing an interpretation.

If an implementation requires changing an approved architectural decision, explain the proposed change and request approval before proceeding.

Record substantial approved architecture changes in an Architecture Decision Record (ADR).

## 3. Development Workflow

### GitHub Workflow

- Never implement features directly on `main`.
- Create a dedicated feature branch for each scoped assignment.
- Make understandable, reviewable commits.
- Open a pull request for completed work.
- Do not merge pull requests without explicit approval.
- Do not rewrite unrelated files.
- Do not modify architecture documents unless the task requires it.
- Keep pull requests focused on one milestone or coherent feature.

### Before Implementing

1. Read the relevant documentation.
2. Inspect the existing repository structure.
3. Identify existing components and utilities.
4. Determine the smallest implementation that satisfies the task.
5. Identify relevant tests.
6. Report genuine requirement conflicts or blockers.

Do not replace working application code simply because a different implementation style is preferred.

### After Implementing

Provide:

- Summary of implemented changes.
- Files added or modified.
- Relevant architectural decisions.
- Tests and validation performed.
- Actual test results.
- Known limitations.
- Any necessary follow-up work.
- Pull request link, when available.

Never claim a test or visual review was completed unless it was actually performed.

## 4. Approved Technology Stack

Use the technology stack established by the architecture documents.

### Initial Stack

- Next.js App Router.
- React.
- TypeScript with strict mode.
- Tailwind CSS.
- FullCalendar standard plugins.
- Zod.
- Vitest.
- ESLint.
- Prettier.

### Later Technologies

The following require an approved milestone:

- Supabase PostgreSQL.
- Supabase Authentication.
- Database Row-Level Security.
- Playwright end-to-end testing.
- Live Google Calendar or ICS integrations.
- Email delivery infrastructure.
- Production hosting and monitoring.

Do not introduce unrelated frameworks or dependencies without a specific technical justification.

Prefer supported, stable dependency versions and document material compatibility concerns.

## 5. Application Architecture

Follow the module boundaries defined in `docs/ARCHITECTURE.md`.

### `app/`

Next.js routes, layouts, and appropriate server components.

### `components/`

Reusable interface components.

Calendar-specific implementation belongs in `components/calendar/`.

Use a single `EventCalendar` wrapper to isolate FullCalendar-specific behavior from the broader application.

### `lib/domain/`

Pure, testable business logic.

Examples include:

- Event relevance.
- Major matching.
- Scheduling conflicts.
- Domain validation helpers.

Avoid coupling domain logic to React components or database APIs.

### `lib/data/`

Data-access functions.

Use range-based interfaces for calendar and exam queries.

Initially implement these functions using synthetic fixtures.

### `lib/time/`

Date parsing, Eastern Time formatting, and calendar boundary calculations.

### `data/fixtures/`

Synthetic sample data suitable for public source control.

### `data/local/`

Gitignored local data only.

Do not create unnecessary service layers, complex repository abstractions, microservices, or distributed processing infrastructure during early development.

## 6. Milestone Scope Enforcement

Implement only the milestone explicitly assigned.

### Milestone 1A: Application Foundation

Allowed:

- Next.js initialization.
- Strict TypeScript configuration.
- Tailwind design tokens.
- ESLint and Prettier configuration.
- Zod domain schemas.
- Vitest configuration.
- Synthetic fixtures.
- Initial data-access functions.
- Pure major-relevance logic.
- Eastern Time utilities.
- Minimal application shell.
- README documentation.
- Basic continuous integration.

Not allowed:

- Full calendar interface.
- Production database.
- Authentication.
- Live event imports.
- Email sending.
- Organization accounts.
- Numerical scheduling-pressure scoring.
- Production deployment infrastructure.

### Milestone 1B: Student Calendar

Implement the public calendar, major and organization filters, categories, event details, and responsive interfaces.

Do not introduce production backend services unless explicitly approved.

### Milestone 1C: Organization Planner

Implement exam overlays, planning audience controls, explicit conflicts, and explanatory planning information.

Do not implement numerical scheduling-pressure scoring or real officer accounts.

For later milestones, follow the approved product specification and corresponding task instructions.

## 7. Fixture and Data Privacy Requirements

Only synthetic, non-identifying sample data may be committed to the public repository during the initial development stage.

Do not create fictional event records that appear to be verified real Penn State events.

Synthetic fixtures should be clearly labeled as examples.

Actual records must remain outside public source control until publication rights and privacy have been reviewed.

Do not commit:

- API keys.
- Secrets or credentials.
- Private calendar subscription URLs.
- Student personal information.
- Private contact lists.
- Email subscriber records.
- Restricted university data.
- Unauthorized source datasets.

Ensure `data/local/` is excluded from Git tracking.

Do not log sensitive data unnecessarily.

## 8. Event and Relevance Logic

An event represents one occurrence.

Recurring-event expansion is deferred until the appropriate integration milestone.

Support an optional `seriesId` where the approved schema requires it.

### Major Relevance

Preserve the distinction between:

- Explicit targeting.
- Inherited targeting.
- Unclassified targeting.
- College-wide events.

Do not assume an event is relevant only to students associated with its hosting organization's major.

Cross-major events must remain discoverable when their intended audience supports that relevance.

Unclassified events remain accessible in All Events.

Do not automatically recommend all unclassified events to every major.

Write unit tests for these cases.

### Display Filters vs. Planning Scope

Display filters control what users see.

Planning scope controls which constraints are analyzed.

Do not silently narrow planning analysis when users change visual event filters.

## 9. Eastern Time Requirements

EUC Events Hub initially operates exclusively in:

`America/New_York`

### Required Behavior

- Display all user-facing event times in Eastern Time.
- Display academic exam times in Eastern Time.
- Handle EST and EDT correctly.
- Handle daylight-saving transitions.
- Interpret imported timestamps accurately when future integrations are implemented.
- Preserve unambiguous timestamps for timed events.
- Use date-only values for all-day events.
- Use Eastern Time for institution-local calendar boundaries.

### Out of Scope

Do not implement:

- User-selectable time zones.
- Browser-local time-zone switching.
- International time-zone interfaces.
- Multi-institution time-zone configuration.
- A generalized user time-zone management system.

### Testing

Test:

- Eastern daylight-saving transitions.
- Timed events.
- All-day events.
- Multi-day events.
- Midnight-crossing events.
- Relevant calendar boundaries.

Extensive multi-time-zone compatibility testing is not required.

A limited regression check under a non-Eastern runtime environment is optional.

Do not use a fixed UTC offset as a substitute for `America/New_York`.

## 10. Frontend Design Requirements

Follow `docs/DESIGN_SYSTEM.md`.

The application should have a minimalist, contemporary, Penn State-inspired appearance.

### Mandatory Design Constraints

- Do not use Inter as the default font.
- Avoid generic purple gradients.
- Avoid excessive centered layouts.
- Avoid uniformly rounded components.
- Avoid repetitive decorative card grids.
- Avoid glassmorphism and unnecessary visual effects.
- Avoid oversized empty hero sections.
- Prefer purposeful left alignment.
- Use semantic Tailwind design tokens.
- Preserve readable, information-dense calendar layouts.
- Use distinct functional colors where appropriate.
- Keep important interactions obvious and accessible.

Visual design should emphasize hierarchy, typography, alignment, and usability.

Do not copy the visual design of existing proprietary applications.

### Typography

Use an approved, appropriately licensed typeface consistent with the design system.

Do not install multiple font families unnecessarily.

### Color

Use Penn State-inspired brand colors for structural identity and semantic tokens for interface elements.

Majors and event categories may use distinct accessible functional colors.

Do not rely solely on color to communicate event categories, conflicts, or status.

## 11. Responsive and Accessibility Requirements

Target WCAG 2.2 AA where applicable.

Test representative viewports:

- 320px.
- 375px.
- 430px.
- 768px.
- 1440px.

### Required Checks

- No unintended page-level horizontal overflow.
- Readable typography.
- Usable navigation.
- Accessible event filters.
- Keyboard-operable controls.
- Visible focus indicators.
- Adequate color contrast.
- Accessible labels.
- Appropriate semantic HTML.
- Responsive calendar presentation.
- A usable chronological list alternative to dense calendar grids.

Respect reduced-motion preferences.

Do not claim formal WCAG compliance without appropriate verification.

### Visual Review

For substantial frontend changes:

1. Run the application.
2. Inspect desktop and mobile screenshots when browser or screenshot tooling is available.
3. Evaluate typography and layout.
4. Check alignment and spacing.
5. Review interactive states.
6. Identify violations of the design system.
7. Correct material issues before requesting approval.

If visual inspection tools are unavailable, state that limitation and do not claim screenshots were reviewed.

Human design approval is required before merging major interface changes.

## 12. Code Quality

Prefer:

- Clear naming.
- Small focused functions.
- Type-safe interfaces.
- Explicit validation.
- Reusable domain utilities.
- Minimal dependencies.
- Understandable errors.
- Well-scoped components.

Avoid:

- Unnecessary abstractions.
- Duplicate business logic.
- Broad use of `any`.
- Hardcoded presentation values scattered across files.
- Unnecessary global state.
- Unapproved external services.
- Overengineering for hypothetical future requirements.

Follow existing repository conventions when they do not conflict with approved architecture.

## 13. Testing and Validation

Every implementation pull request should run the relevant validation commands.

At minimum, where configured:

- Lint.
- Type checking.
- Unit tests.
- Production build.

Formatting checks should also be run where configured.

### Domain Logic Tests

Test:

- Explicit major targeting.
- Inherited major targeting.
- Unclassified events.
- College-wide event inclusion.
- Multi-major selection.
- Date-range boundaries.
- Relevant Eastern Time behavior.

### Planner Tests

When implemented, test:

- Event interval overlap.
- Back-to-back events.
- Planning audience changes.
- Exam conflict identification.
- Missing exam times.
- Relevant all-day events.

### Reporting

Report the actual commands run and whether each succeeded.

If a test could not be run, explain why.

Never fabricate successful validation results.

## 14. Dependency and Cost Control

EUC Events Hub should remain inexpensive to develop and operate.

Do not introduce:

- Paid APIs.
- Paid component libraries.
- Unapproved hosting services.
- Unnecessary databases.
- Background job infrastructure.
- Third-party analytics.
- Email delivery services.

Any proposal that could introduce operating costs must include:

- Purpose.
- Expected benefit.
- Alternatives.
- Free-tier limitations, if relevant.
- Potential recurring cost.
- Privacy or security implications.

Obtain approval before implementation.

Do not assume that a service will remain free indefinitely.

## 15. Definition of Done

A feature is complete when:

1. It satisfies the approved milestone requirements.
2. It follows the documented architecture.
3. It follows the design system where applicable.
4. It uses appropriate validation.
5. Relevant tests have been added or updated.
6. Lint and type checks pass.
7. Unit tests pass.
8. Production build passes.
9. No credentials or restricted data are committed.
10. No unapproved infrastructure or costs are introduced.
11. Documentation reflects material implementation changes.
12. Known limitations are reported accurately.
13. The implementation is submitted for review in a scoped pull request.

A coding agent must not merge its own work without explicit authorization from the project owner.

## 16. Final Instruction

EUC Events Hub is a student-led application intended to remain useful beyond its original developer's involvement.

Build for clarity, reliability, and maintainability.

Prefer the simplest correct implementation that fulfills the approved requirements.

Do not add features merely because they are technically interesting.

Do not silently broaden scope.

When uncertain, identify the specific issue, explain reasonable alternatives, and request a decision before making consequential architectural changes.
