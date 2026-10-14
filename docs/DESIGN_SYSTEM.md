
# EUC Events Hub: Design System

**Status:** Draft for review  
**Last updated:** October 14, 2026  
**Design direction:** Minimalist modern interface with Penn State-inspired branding

## 1. Design Philosophy

EUC Events Hub should feel like a polished, modern productivity application rather than a traditional university website.

The interface should combine the functional minimalism of modern software platforms with a recognizable Penn State Engineering identity.

### Core Principles

- Clear visual hierarchy.
- Intentional typography and composition.
- Primarily light backgrounds.
- Strong, purposeful alignment.
- Efficient use of screen space.
- Readable, information-dense calendars.
- Consistent spacing and design tokens.
- Accessible interactive components.
- Responsive layouts.
- Restrained visual decoration.

Prioritize functionality and usability over decorative complexity.

The website should feel distinctive without being unnecessarily futuristic or experimental.

---

## 2. Brand Color Foundation

The application's foundational palette will use Penn State's official visual identity colors.

Reference:
https://brand.psu.edu/visual-identity-standards/color-and-the-mark

| Color | Hex | Intended usage |
|---|---|---|
| Nittany Navy | #001E44 | Primary headings, navigation, strong emphasis |
| Beaver Blue | #1E407C | Primary buttons, interactive elements |
| Pugh Blue | #96BEE6 | Subtle accents, selected backgrounds |
| White | #FFFFFF | Cards, content surfaces, backgrounds |

### Neutral Interface Colors

The following are proposed application colors, not official Penn State brand colors.

| Token | Hex | Intended usage |
|---|---|---|
| Canvas | #F8FAFC | Main application background |
| Surface | #FFFFFF | Cards and panels |
| Border | #E2E8F0 | Dividers and borders |
| Muted text | #475569 | Secondary information |
| Subtle surface | #F1F5F9 | Hover states and grouped content |

These values are starting proposals and may be adjusted after accessibility and visual testing.

### Color Usage

- Use Nittany Navy for major structural elements.
- Use Beaver Blue for primary interactive controls.
- Use Pugh Blue primarily for light fills and accents.
- Favor white and subtle neutral surfaces throughout the application.
- Avoid covering large portions of the interface with solid navy unless justified.
- Do not use generic purple gradient backgrounds.

Pugh Blue should not be used as body text on white backgrounds without verified sufficient contrast.

### Penn State Branding

Using university colors does not automatically authorize use of official logos or university marks.

Before public launch, confirm applicable Penn State branding and student organization requirements.

---

## 3. Functional Color System

Not every color needs to come from Penn State's official palette.

Majors, event categories, organization groupings, and scheduling-pressure indicators may use independent color systems.

### Major Colors

Each major may receive a consistent identifier color.

Requirements:

- Distinguishable from adjacent major colors.
- Accessible text contrast.
- Consistent across calendar views.
- Clearly labeled with major abbreviation or name.
- Not dependent on color alone.

Major colors should remain configurable rather than hardcoded throughout the application.

### Event Category Colors

Events may use category-specific colors, including:

- Corporate recruiting.
- Technical workshops.
- Professional development.
- Networking.
- Career fairs.
- Student organization events.
- Research events.
- Competitions.

Use event category as the primary calendar color treatment when helpful.

Do not assign every organization a unique calendar color because this would create excessive visual complexity.

### Scheduling-Pressure Colors

The organization planning interface will eventually use:

- Low pressure.
- Moderate pressure.
- High pressure.

These states must have sufficiently distinguishable visual appearances.

Never communicate scheduling pressure exclusively through color.

Include numeric values, text labels, or appropriate icons.

Specific thresholds and scoring colors will be finalized when scheduling-pressure calculations are implemented.

---

## 4. Typography

Typography should distinguish the application from generic AI-generated dashboards while maintaining excellent readability.

### Requirements

- Do not use Inter.
- Use a considered, professional sans-serif typeface.
- Establish a clear typographic hierarchy.
- Prioritize readability in dense calendar layouts.
- Limit unnecessary font weights and sizes.
- Use consistent line heights.
- Avoid excessive letter spacing.
- Use tabular numerals for dates, times, and numerical scores where appropriate.

### Candidate Typefaces

Consider:

- IBM Plex Sans
- Source Sans 3
- Public Sans
- Geist
- DM Sans

These are candidates, not a requirement to install multiple fonts.

Select one primary family after comparing readability and overall visual character.

Where appropriate, load locally or use Next.js font optimization.

Verify licensing before deploying bundled typography.

---

## 5. Layout and Composition

The interface should use strong structural alignment and intentional spacing.

### Preferred Design Patterns

- Left-aligned headings and content.
- Purposeful asymmetry.
- Consistent grid systems.
- Functional sidebars.
- Structured event lists.
- Clearly separated information regions.
- Logical content grouping.
- Appropriate whitespace.
- Compact, readable calendar controls.

### Avoid

- Excessive centered hero layouts.
- Large empty sections.
- Repetitive three-column card grids.
- Unnecessary full-width decorative sections.
- Overly symmetrical dashboard compositions.
- Excessive spacing that reduces information density.

Centered layouts are permitted when they improve comprehension, such as an empty state or focused confirmation screen.

They should not be the default structure for every section.

---

## 6. Component Shape and Surface Design

Avoid applying identical rounded corners to every element.

Use a deliberate radius hierarchy.

### Suggested Radius System

| Component | Suggested radius |
|---|---|
| Structural panels | 0–4px |
| Inputs and controls | 4–6px |
| Interactive cards | 6–8px |
| Modals | 8–12px |
| Filter chips and tags | Pill when appropriate |

These are preliminary values, not strict requirements for every component.

### Visual Treatments

Favor:

- Subtle borders.
- Light backgrounds.
- Minimal shadows.
- Clear hover states.
- Strong typography.
- Consistent alignment.

Avoid:

- Heavy shadows.
- Glassmorphism.
- Excessive glow effects.
- Decorative gradients.
- Unnecessary floating icons.
- Overly rounded cards.
- Repetitive decorative containers.

The visual design should derive its quality from composition rather than effects.

---

## 7. Student Calendar Interface

The student calendar should prioritize event discovery and navigation.

### Required Views

- Month.
- Week.
- Day.
- List.

### Required Interactions

- Select engineering majors.
- Filter by organizations.
- Filter by event category.
- Search events.
- View event details.
- Navigate between dates.
- Identify event status and source.

### Calendar Presentation

- Event titles must remain readable.
- Avoid overcrowding calendar cells.
- Provide accessible overflow behavior when multiple events occur on one day.
- Use meaningful event category indicators.
- Preserve a clear distinction between event name, host, time, and location.
- Use consistent Eastern Time formatting.
- Clearly indicate canceled or tentative events.

### Mobile Alternative

A chronological event list should be available as an accessible alternative to the calendar grid.

On small screens, prioritize usable event discovery rather than forcing a full desktop calendar into a narrow layout.

---

## 8. Organization Planning Interface

The organization planning experience should emphasize scheduling decisions.

### Core Information

- College-wide events.
- Major-related events.
- Academic exams.
- Tentative organization events.
- Priority-designated events.
- Known scheduling conflicts.
- Selected planning audience.

### Design Requirements

- Clearly identify exam dates.
- Distinguish exams from public events.
- Identify priority events with a star and descriptive label.
- Display the active planning audience.
- Explain why conflicts are relevant.
- Identify uncertainty or missing exam information.
- Allow users to navigate weeks efficiently.

Scheduling-pressure indicators should support decisions, not simply decorate the interface.

### Priority Stars

Priority stars primarily belong in organization planning mode.

They represent an organization's important events, not popularity rankings or official endorsements.

A star should not dominate the calendar's appearance.

---

## 9. Navigation and Information Architecture

The application will eventually support three experiences.

### Student Experience

Primary goals:

- Discover events.
- Filter relevant programming.
- Access registration details.
- Subscribe to updates.

### Organization Experience

Primary goals:

- Review academic and event schedules.
- Identify conflicts.
- Plan and manage events.
- Assign priority designations.

### EUC Administration

Primary goals:

- Review event submissions.
- Manage sources and verification.
- Manage organization representatives.
- Administer platform settings.

Navigation should distinguish these experiences without duplicating the underlying data.

Do not overcrowd the public navigation with administrative features.

---

## 10. Accessibility

Target WCAG 2.2 AA where applicable.

Accessibility is a design requirement, not a final-stage enhancement.

### Required Considerations

- Readable text contrast.
- Non-text interface contrast.
- Visible keyboard focus.
- Keyboard navigation.
- Accessible labels.
- Semantic HTML.
- Appropriate heading hierarchy.
- Sufficient interactive target sizes.
- Focus not obscured by sticky navigation or overlays.
- Reduced-motion preferences.
- Screen-reader support.
- Text alternatives to color-coded information.
- Accessible event list alternatives.

Validate actual token combinations instead of assuming official brand colors automatically meet contrast requirements.

Do not claim formal WCAG compliance without appropriate testing.

---

## 11. Responsive Design

Test representative screen widths:

- 320px: Small mobile.
- 375px: Mobile.
- 430px: Large mobile.
- 768px: Tablet.
- 1440px: Desktop.

### Verification Requirements

- No unintended page-level horizontal overflow.
- Navigation remains accessible.
- Filters remain usable.
- Calendar controls are not clipped.
- Event details are readable.
- Text does not overlap.
- Buttons and interactive targets remain usable.
- Keyboard focus remains visible.
- Dense calendar layouts have usable alternatives.

Do not simply shrink desktop interfaces to fit mobile screens.

Use layouts appropriate to each viewport.

---

## 12. Design Tokens

Use semantic design tokens throughout the application.

Suggested token categories:

### Brand

- primary
- primary-hover
- brand-navy
- brand-blue
- brand-light

### Surfaces

- background
- surface
- surface-muted
- border

### Typography

- foreground
- foreground-muted
- foreground-inverse

### States

- success
- warning
- danger
- focus

### Data Visualization

- major-*
- event-category-*
- pressure-low
- pressure-medium
- pressure-high

Colors, spacing, typography, and border radii should be centralized in the design system.

Avoid scattering raw hexadecimal values and arbitrary spacing throughout React components.

---

## 13. Suggested UI Components

Potential components include:

- AppShell
- SiteHeader
- NavigationSidebar
- FilterBar
- MajorPicker
- OrganizationSelector
- EventCalendar
- EventCard
- EventDetail
- EventList
- CalendarLegend
- ExamMarker
- PlannerConflictPanel
- PriorityStarIndicator
- SourceStatus
- EmptyState

Create components only when functionality requires them.

Avoid unnecessary abstraction and component proliferation.

---

## 14. Anti-AI-Slop Design Requirements

The following rules are mandatory.

1. Do not use Inter as the default font.
2. Avoid generic purple gradients.
3. Avoid excessive centered layouts.
4. Avoid uniform rounded corners.
5. Avoid repeated card grids without a functional reason.
6. Avoid heavy shadows and decorative glass effects.
7. Avoid unnecessary floating icons.
8. Avoid oversized hero sections with little meaningful content.
9. Avoid excessive blank space in information-heavy pages.
10. Avoid generic template-like compositions.

A polished interface should have intentional hierarchy, spacing, typography, and visual rhythm.

These requirements should be evaluated alongside usability and accessibility, not at their expense.

---

## 15. Visual Review and Acceptance

Before considering a frontend feature complete:

1. Review screenshots at desktop and mobile widths.
2. Check the intended information hierarchy.
3. Verify text contrast.
4. Evaluate typography and spacing.
5. Check responsive behavior.
6. Review keyboard accessibility.
7. Check interaction states.
8. Identify generic visual patterns.
9. Verify consistency with established design tokens.
10. Request human review before merging substantial UI changes.

### Review Severity

Use:

- Critical: Major functionality inaccessible or serious usability barrier.
- High: Broken responsive behavior, navigation, or important information hierarchy.
- Medium: Noticeable visual inconsistencies or interaction weaknesses.
- Low: Minor aesthetic refinement.

### Review Verdict

Use:

- Approve
- Approve with Changes
- Reject

Review decisions should reference actual screenshots, code, or observed behavior.

Do not claim visual inspection if no rendered interface or screenshot was available.

---

## 16. Design Success Criteria

The EUC Events Hub frontend should:

- Look recognizably connected to Penn State Engineering.
- Feel like a modern software product.
- Provide efficient event discovery.
- Support academic-aware planning.
- Remain usable across mobile and desktop devices.
- Preserve a consistent design language.
- Avoid generic AI-generated aesthetics.
- Be maintainable by future student developers.

The ultimate goal is an application whose design makes engineering event discovery and organization scheduling easier, not merely a visually attractive website.
