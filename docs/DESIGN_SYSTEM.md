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

| Color        | Hex     | Intended usage                                |
| ------------ | ------- | --------------------------------------------- |
| Nittany Navy | #001E44 | Primary headings, navigation, strong emphasis |
| Beaver Blue  | #1E407C | Primary buttons, interactive elements         |
| Pugh Blue    | #96BEE6 | Subtle accents, selected backgrounds          |
| White        | #FFFFFF | Cards, content surfaces, backgrounds          |

### Neutral Interface Colors

The following are proposed application colors, not official Penn State brand colors.

| Token          | Hex     | Intended usage                   |
| -------------- | ------- | -------------------------------- |
| Canvas         | #F8FAFC | Main application background      |
| Surface        | #FFFFFF | Cards and panels                 |
| Border         | #E2E8F0 | Dividers and borders             |
| Muted text     | #475569 | Secondary information            |
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

The public calendar uses exactly six categories:

- Career & Networking.
- Professional Development.
- Technical Workshops.
- General Body Meetings.
- Competitions.
- Social & Recreational.

Use the category palette in section 18 for public cards. Career fairs, corporate recruiting and networking remain typed subtypes of Career & Networking. Research and legacy Student organization records need purpose-aware migration; unresolved purposes stay flagged rather than guessed. Planner scope/density colors remain separate.

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

| Component             | Suggested radius      |
| --------------------- | --------------------- |
| Structural panels     | 0–4px                 |
| Inputs and controls   | 4–6px                 |
| Interactive cards     | 6–8px                 |
| Modals                | 8–12px                |
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

## 17. PR #5 scope, density and independent indicators

The owner-approved master refinement replaces earlier provisional scope colors. Tokens live centrally in `app/globals.css`; classification text remains available alongside color.

| Scope                | Surface token/value                 | Border token/value                 | Foreground token/value                 |
| -------------------- | ----------------------------------- | ---------------------------------- | -------------------------------------- |
| PSU-wide             | `scope-psu-surface` #91B8E5         | `scope-psu-border` #3267A3         | `scope-psu-foreground` #102D50         |
| National             | `scope-national-surface` #EEC078    | `scope-national-border` #A26A21    | `scope-national-foreground` #4D2D0D    |
| Local                | `scope-local-surface` #94C9AD       | `scope-local-border` #39795C       | `scope-local-foreground` #123E2B       |
| Ordinary engineering | `scope-engineering-surface` #FFFFFF | `scope-engineering-border` #9AA9BA | `scope-engineering-foreground` #001E44 |

CSS variables have a `--color-` prefix. These fixed card surfaces apply across all five planner layouts. Public event colors are superseded by the six-category system below. Academic exams keep their separate labeled treatment. Use visible focus outlines and restrained borders; cards remain interactive above every background layer. Local is the visible label; `campus-local` remains an internal identifier. Academic exam cards use **Academic Exam COURSE**. Fictional verification remains `synthetic` internally but is explained as Demo/Example in the UI.

Scheduling density has a separate legend and background palette:

| Factual band                | Token                | Background |
| --------------------------- | -------------------- | ---------- |
| 0 known-time commitments    | `density-none`       | #F1E8F5    |
| 1 simultaneous commitment   | `density-one`        | #E0C8EB    |
| 2 simultaneous commitments  | `density-two`        | #C09CD6    |
| 3+ simultaneous commitments | `density-three-plus` | #9367B5    |

These bands describe the maximum concurrency within any selected major × academic-year subgroup, never a sum across students or a calibrated pressure level. All-day and uncertain-hour commitments remain separately listed. The overlay starts off, applies behind cards, and never changes their scope colors. Month/2 Weeks communicate density through background color without date-header numerical badges; hourly views have background-only noninteractive segments and a textual interval disclosure; List/mobile retain factual labels. White surfaces under date numbers and controls preserve dark readable text over the deepest shade. Scope-card text contrasts are checked in browser tests; this is not a formal accessibility certification.

Scheduling guidance forms a third layer. Avoid scheduling (principally THON) outranks scheduling caution, then factual Review conflicts. Text and icons distinguish these from National amber cards, and they remain visible with the overlay disabled. A compact highest-priority banner leads to optional complete daily reasons and source information. Context-only Local activity is labeled and excluded from analytical density.

Exam Preparation is visually independent: a solid navy lower bound, diagonally striped uncertainty through the upper bound and an unfilled remainder on a 0–10 relative scale. Exact fractional screen-reader labels, equal bounds, zero, unavailable state and forced-color hatching are supported. No midpoint or probability is inferred. Main contributing exams and most-affected equivalent subgroups remain concise; complete distinct subgroup estimates and references are under **Advanced methodology & sources**. The experimental caveat appears once per enabled section, while meaningful uncertainty stays visible.

Other Scheduling Constraints has an explicitly unavailable numerical indicator, factual counts and source-backed cautions. It never uses academic exams. Neither it nor preparation activates an overall score. Further scoring requires owner-approved methodology as documented in [ADR 004](decisions/004-independent-scheduling-indicators.md).

Calendar previous/next controls use square 42px hit areas with centered 20px arrow icons and retained accessible names. Shared-date mobile/tablet grouping, full month names, compact Eastern times and overnight cues remain intact. The category taxonomy in this earlier refinement is superseded by section 18’s six public categories and lossless migration rules. Validate 320, 375, 430, 768, 1024 and 1440px.

## 18. Student discovery categories and host badges

The public calendar uses category surfaces independently of planner scope and density. Central `--color-category-*` tokens define:

| Category                 | Surface | Border  |
| ------------------------ | ------- | ------- |
| Career & Networking      | #E5AA75 | #A96530 |
| Professional Development | #A6D3CC | #438B7C |
| Technical Workshops      | #E3CA78 | #A08530 |
| General Body Meetings    | #C7A7DF | #8055A5 |
| Competitions             | #E59AA5 | #AC4E63 |
| Social & Recreational    | #A9CF8A | #648C3A |

Primary and secondary text use #1C2430 and #34404E. Stable category classes apply to public Month, Week, Day, List and mobile cards. Compact legend/guide labels keep categories distinguishable when hues converge under color-vision deficiencies. Unknown legacy purposes remain flagged with a neutral surface, without adding a seventh category filter. Planner ordinary/external scope styles remain independent.

Hosting uses a separate white badge with #1E407C icon/text and #B8C7DB border. One larger original generic SVG paw means PSU Hosted (university-only); two smaller horizontal paws mean Co-hosted (university plus student organization). Student-only or unresolved hosting gets no institutional badge. There is no white inner-border identity treatment, university-specific card fill, emoji or official logo claim. Full names remain in details/accessible names; compact contexts use registered labels, with CSS container queries selecting full names on spacious List cards. See [ADR 005](decisions/005-student-discovery-and-host-identity.md) for source and branding limitations.

Welcome text remains restrained, with a closed-by-default category/community guide. Shared-date compact grouping, 12px/14px card padding, 4px header/card gap, 8px same-day card gap and 16px between days remain. Planner controls use native disclosure dropdowns above a full-width calendar; the separate proposal disclosure replaces the permanent sidebar without removing functionality.

## Milestone 2A.0: local academic review

The separate development review reuses neutral academic-exam styling and responsive chronological grouping. It displays **Private exam data preview — unverified** and an explicit non-official schedule warning. Unknown-hour date alternatives use a **Date options** band and time-unknown labels, without drawing fabricated hour blocks. Additional possible dates use text plus dashed borders; color alone does not convey uncertainty. Known clocks explain their explicit/source-default basis. Range totals count canonical occurrences rather than rendered date segments. Native details retain source/status/audience/permission information and Enter/Space/Escape focus behavior. No category legend, non-exam density or numerical preparation is shown in this review. [Public review screenshots](previews/planner/exam-import/README.md) use invented records only; real source screenshots must stay private.

## Planner hierarchy and navigation refinement

Planner Month and 2 Weeks use strict deterministic event ordering: multi-date date-wide spans, then single-date untimed/all-day records, then chronological timed events. Ties use start, longer duration, title and stable public occurrence ID. FullCalendar retains continuous horizontal segments and exclusive ends; this changes presentation only. External precision is now explicit: curated date-wide scenarios use date-wide labels, missing-hour activities use Time TBD, and academic date-only constraints retain Time unknown. None establishes verified continuous attendance. The public student ordering is unchanged.

Density uses the existing factual subgroup concurrency calculation with purple semantic surfaces: none #F1E8F5, one #E0C8EB, two #C09CD6, three-plus #9367B5. Date headers have no numerical density badges. Shaded date cells retain screen-reader density descriptions, removed when the overlay is disabled. The legend and optional interval disclosure explain counts; zero known-time commitments does not imply an empty/safe day. Opaque event scope cards, white date-number/control surfaces and keyboard outlines remain above shading. Cautions remain independent of density visibility.

The planner frame uses a restrained 2px #8C9BAD outer border around grid and integrated weekly summaries, 1px #B5C1CF day divisions and stronger week/header separation. These are centralized structural tokens. No shadows are added.

Each weekly summary exposes exactly one Focus this week in calendar action, navigating to the matching Eastern Sunday–Saturday hourly view while preserving audience/display state. Redundant Sunday-cell controls are removed. Weekly summary details is a separate dialog action. Both integrated and compact summary interfaces use the existing date/view callbacks.

Planner titles use original 13px line SVG icons selected only from structured categories, external classifications or exam kind. Music, trophy, briefcase, tools, users, celebration, calendar, research-flask and exam-sheet/pencil shapes remain separate from scope colors. Neutral calendar is the fallback; titles never select an icon. Icons are decorative to assistive technology and do not replace title, time, scope, source or uncertainty text. No dependencies or official marks are added.

### Dedicated THON mark

Use the owner's supplied four-diamond geometry for explicitly recorded `subtype: "thon"` events only. The external THON scenario now records that subtype in addition to its existing classification; this metadata does not change scheduling eligibility or policy. A THON classification without the subtype retains the generic community icon. Titles and generic philanthropy/service/community categories never select the mark.

`ThonMark` is a small local inline SVG using the supplied currentColor geometry. Its separate `--color-thon-icon` token defaults to Penn State blue #1E407C; it neither reads category colors nor controls institutional hosting paw badges. Use 13px for compact date-grid cards and 16px for larger views/details. It is decorative when the adjacent event text supplies the identity. `EventTypeIcon` retains a `useThonMark={false}` generic-users fallback for future branding replacement. The supplied mark does not independently verify an event or imply institutional endorsement.

## Adaptive cards, linked overnight slices and event details

Month and 2 Weeks use 3px/5px event margins and 4px harness separation; popover cards use 4px margins. Every standard Month/2-Weeks card has at most three information lines: bold compact time with regular-weight location when available, one icon/title line, and one meaningful host-or-scope line. Missing location and detail fields are omitted. Full titles/locations/source disclosures remain in details and accessible labels. Native four-event overflow remains bounded. The distinct private staged-exam review keeps its source-status presentation.

Hourly Week/Day cards use FullCalendar's native horizontally offset overlap mode with increasing collision-layer z-index. Start/longer-duration/title ordering keeps long same-start events behind shorter layers with useful width. Three layers are bounded to two below a 168px day-column event area, with accessible native more-events access for additional records. No card or content wrapper scrolls internally. Timed cards use 2px vertical/3px horizontal padding and a 1px bottom gap, independently of other text line spacing. Titles clamp to two lines, one below 54px content height; below 32px the title replaces the clock row, and below 20px a 10px label retains compact recognition. Inline icons align to the first title line while subsequent text uses the full width. Details and accessible labels retain full information. The all-day header uses at most two compact rows, with the last used for native overflow when needed (`dayMaxEventRows: 2`), no inherited Month minimum height; uncertain times remain uncertain.

Compact card clocks omit only zero minutes through the centralized Eastern formatter (7–8 PM, 9–10:20 AM, 11 AM–12:30 PM), retaining DST elapsed-time disambiguation and all rollover cues. Detailed date/time labels keep their existing precision. The standalone Other Scheduling Constraints daily panel is removed only from Week/Day; the existing scheduling-reasons/source disclosure, independent opt-in exam estimates, null overall score, Month/2-Weeks summaries and calculations remain. See the [hourly layering and compact-card review](previews/planner/layering/README.md).
FullCalendar 6 dayGrid normally represents a timed interval crossing dates as a horizontal multi-day block. To avoid implying all-day occupancy, `dayGridItems` creates explicitly linked, timed start/continuation display slices at IANA Eastern midnight boundaries. Each retains `canonicalEventId`, original source identity and full timing metadata. The next date says Ends [clock] / From prev day. Counts use the original occurrence list; analysis never consumes slices. Exact-midnight ends produce no extra day. Native continuous all-day/date-wide bars remain unchanged. Week/Day/List retain their existing occurrence intervals. One clock-range token avoids unnecessary AM/PM line breaks; narrow cells can still wrap rather than overflow.

External records may carry curated `dateWide` display precision independently of `timeKnown`. It is supplied only for the explicitly date-wide Homecoming, THON and academic-break demonstration scenarios. Missing clocks never set it. Numerical uncertainty, source status, eligibility and policy calculations still use the unchanged original fields. Details explain both the date-wide nature and unknown individual hours rather than implying 24-hour attendance.

Every event card now opens its specific event/exam details. External details show the available title, dates, precision, classification, scope, source, applicability and policy explanation. Only explicit weekly-summary controls open weekly summaries. Both overnight slices resolve to one canonical dialog; focus restoration prefers the originating display segment and supports rerendered openers.

The shared EventTypeIcon now appears in both calendars and appropriate details. Only research (explicit research-seminar subtype) and academic exam artwork changed, to a flask and exam sheet/pencil. Existing music, sports, celebrations, scope-independent types and the supplied THON geometry remain. Icons align in an immediate inline container; THON alignment does not alter text-line spacing. `/dev/icons` renders the complete actual icon inventory in development and returns 404 in production. See the [current screenshot and inventory review](previews/planner/event-layout/README.md).

Modal Escape handling runs in capture phase so FullCalendar's document-level popover listener cannot dismiss the underlying overflow while closing event details. The popover remains available and focus returns to its originating event.
