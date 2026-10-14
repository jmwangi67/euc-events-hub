# EUC Events Hub Design System (Draft)

## Direction
Minimal, contemporary productivity software with a professional university identity. Primarily light surfaces, clean typography and restrained decoration. No generic dark cyber aesthetic.

## Brand foundation
Penn State inspired reference values to verify against current official guidelines before launch:
- Nittany Navy: #001E44
- Beaver Blue: #1E407C
- Pugh Blue: #96BEE6
- White: #FFFFFF
- Proposed neutral background (not official brand color): #F8FAFC

Use semantic CSS/Tailwind tokens (background, surface, foreground, primary, border, subtle, focus, event-category-*, major-*, pressure-*). Do not scatter raw hex values across components. Allow institution-specific theme overrides in the future.

Official university marks, logos, and branding claims require appropriate permission; using the palette alone does not authorize use of those marks.

## Information design
- Consistent app navigation and distinguishable student/planner views.
- Primary student flow: find upcoming relevant events and their verified details.
- Primary organization flow: see exams/conflicts and evaluate dates.
- Colorful chips may identify majors, event categories and organization networks, but text labels remain mandatory.
- Avoid assigning a unique color to every organization: scale and legibility suffer.
- One star indicates a priority event in planner view, not an endorsement or room reservation.
- Pressure uses text, value and color together; show what contributes to assessments and data completeness.
- Source verification and cancellation/tentative status must be obvious.

## Accessibility and responsiveness
- Target WCAG 2.2 AA, including color contrast, keyboard support, labeled controls and visible focus.
- Avoid relying on color alone; provide alternatives for dense calendars on mobile.
- Test small screens, reduced motion, all-day events, lengthy event titles, empty/error states and screen readers.
- Use consistent date/time formatting with stated local zone.

## Suggested components
AppShell, SiteHeader, FilterBar, MajorPicker, EventCard, EventDetail, EventCalendar, CalendarLegend, ExamMarker, PlannerConflictPanel, SourceStatus, EmptyState.
Components should be reusable and stylistically consistent; introduce only as implemented.
