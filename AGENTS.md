# Instructions for Codex and AI coding agents

## Source of truth
Read docs/PROJECT_SPEC.md, docs/ARCHITECTURE.md, docs/DESIGN_SYSTEM.md and docs/decisions before implementing features. If a proposed change contradicts a decision, flag it and suggest an ADR update.

## Workflow
- Work in scoped branches and small reviewable commits or pull requests; do not silently rewrite architecture.
- Use Next.js App Router, strict TypeScript, Tailwind semantic tokens, Zod validation and an EventCalendar wrapper.
- Use the sanitized sample data supplied by the project owner. Do not invent real PSU events or exams or claim imports are live.
- Keep data access in lib/data, business logic in pure lib/domain functions and time logic in lib/time.
- Treat timed event instants, all-day dates and America/New_York calendar boundaries distinctly.
- Separate event display filters from scheduling analysis inputs.
- Do not add live integrations, Supabase, email sending, auth, paid tools or cloud infrastructure without an approved milestone.
- Do not commit secrets, API keys, student personal data, private calendars or subscriber lists.
- Do not claim tests passed unless actually run. Report commands and outcomes.
- Favor accessible mobile-friendly components and understandable maintenance documentation.

## Definition of done
Feature meets its written acceptance criteria, has appropriate unit tests, passes lint/typecheck/build, does not introduce hidden external costs, and explains significant architectural changes.

## Mandatory frontend design constraints
- Apply docs/DESIGN_SYSTEM.md, including the anti-template visual design rules.
- Do not use Inter, purple-gradient hero sections, excessive centered layouts, or uniformly rounded surfaces.
- Prefer purposeful left alignment, restrained Penn State brand accents, a varied intentional radius scale, accessible typography, and calendar-first information density.
- When implementing UI, inspect responsive screenshots and explicitly assess whether the result looks generic or template-generated. Revise before declaring it complete.
