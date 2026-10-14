# ADR 001: Initial Technology Stack
Status: Accepted for initial prototype
Date: 2026-10-14

## Context
EUC needs a standalone, highly customizable calendar/planning app. The existing Penn State WordPress instance is managed and unsuitable for unrestricted custom application development. Development is student-led with ChatGPT for architecture, Claude for review and Codex for implementation.

## Decision
Next.js App Router + strict TypeScript + React; Tailwind semantic tokens; FullCalendar standard views behind EventCalendar adapter; Zod validation; simple lib/data fixture interface; Vitest and ESLint/Prettier. Supabase and Playwright are deferred until their corresponding capabilities are required.

## Reasons
Widely adopted and maintainable tools, low initial cash cost, modular boundaries for future ingestion and institutional data, and straightforward AI-assisted development without upfront infrastructure.

## Alternatives
WordPress custom plugins: restricted university-managed platform and less control.
Microservices or dedicated ingestion infrastructure: excessive for initial scope.
Supabase from day one: unnecessary while working from provided fixtures.
Premium calendar views: unnecessary for current features.

## Consequences
Requires frontend development skills and eventual production operations/security review. Hosting/commercial-use terms, branding permissions and repository/IP stewardship remain open. Architecture must resist premature complexity.

## Revisit when
Persistent event editing, account roles, live feed sync or paid/proprietary calendar capabilities become necessary.
