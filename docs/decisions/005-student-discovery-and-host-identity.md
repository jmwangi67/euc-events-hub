# ADR 005: Student discovery categories and structured host identity

Status: Authorized by the owner's consolidated PR #5 discovery/hosting/planner refinement request. Owner visual acceptance remains pending.
Date: 2026-10-21

## Boundaries

This supplements ADRs 003 and 004. Its six-category taxonomy and hosting-badge rules supersede earlier category/hosting presentation instructions. It changes public discovery, hosting presentation and planner control layout; it does not change experimental preparation mathematics, audience cells, non-exam policy windows, source alternatives, context-only eligibility, or the null overall/non-exam score gates. The existing Next.js/TypeScript/Zod/FullCalendar architecture and dependencies remain intact.

## Six public categories and lossless migration

`eventCategorySchema` has exactly six canonical values: Career & Networking, Professional Development, Technical Workshops, General Body Meetings, Competitions, and Social & Recreational. Stable identifiers and display descriptions live in `lib/domain/event-taxonomy.ts` and `event-categories.ts`.

Legacy corporate recruiting, networking and career fairs migrate to Career & Networking. Their distinctions remain in an explicit typed `subtype`, preserving career-fair midnight-to-exact-finish policy behavior without title matching. Existing canonical category IDs remain stable where applicable. Legacy career URL values map to the canonical career category and deduplicate.

Research and Student organization are not blindly classified. Canonical fixture decisions use actual fictional purpose: the welcome is social/community programming, membership meetings are General Body Meetings, and hands-on design sessions are Technical Workshops. An explicitly educational research seminar is Technical Workshops with `research-seminar` subtype. A legacy record with an unresolved purpose is retained with `category: null`, its `legacyCategory`, and an explanatory `categoryMappingNote`. It remains available in unfiltered published results and details display Category under review. This is not a seventh category filter; selecting a category narrows to classified matches. Ambiguous legacy research/organization URL categories cannot be safely mapped and require a new category selection.

All original event IDs, timestamps, statuses and source verification remain. Dedicated November fictional scenarios exercise the new taxonomy and host arrangements without changing the established October scheduling scenario.

## Student discovery versus planner relevance

Student discovery activates selected majors directly without requiring a separate mode switch. Majors, host organizations, host-membership clusters and categories are OR within each dimension and AND across active dimensions. Empty selections impose no restriction. College-wide and valid explicit/inherited major rules still apply before independent host/category/cluster restrictions. Search remains functional title/description matching. All Events clears major restrictions; the legacy mode URL remains compatible but cannot bypass selected majors.

Public cluster discovery uses the existing documented organization-to-cluster memberships. Unknown memberships do not qualify by title or guesswork. Planner cluster relevance remains explicit event targeting; discovery never changes analytical targeting. URL parsing, serialization, reset, reload and back/forward preserve active dimensions. Filter/date changes create history entries; live search replaces its current entry to avoid an entry per keystroke.

The supplied full welcome copy appears on desktop; compact screens keep the same invitation with a shorter feature description so the first event remains near the initial viewport. The complete category/community guide remains available on every width.

## One registry, explicit hosting, replaceable artwork

The existing Organization schema supports `hostType`, `institutionId`, `unitType`, full `name`, `shortName`, `compactName`, `parentUnitIds` and independent identity sources. Events retain their existing multiple `hostOrganizationIds` relationships. No parallel host entity or name-based inference is introduced.

`hostingIdentity` uses only structured resolved hosts:

- All hosts are Penn State university units: one larger paw, PSU Hosted.
- Penn State university units plus student organizations: two smaller paws, Co-hosted.
- Student-only hosts (one or several): no university badge.
- Missing/unclassified host or ambiguous institutional identity: no institutional badge, with available names preserved.

Category, scope, title, faculty attendance and campus location never establish hosting. Badges do not change event scope, relevance, eligibility, density or preparation. Desktop List date headings now explicitly use the shared full-month format; passing undefined FullCalendar options had suppressed public desktop headings. Full names and sourced parent affiliations remain in details and accessible event descriptions; constrained cards use registered compact names, spacious List/Day cards use full names through CSS container queries. Unknown names are never algorithmically abbreviated. Department-only university hosting has separate Department-hosted metadata adjacent to the original, unmodified event description.

The icon is an original generic SVG paw, not a Penn State mark. White badges use blue #1E407C with a subtle #B8C7DB border. No Unicode paw emoji, generic building icon, university-specific card background, or white inner-border treatment is used. Official mark replacement would require applicable brand/trademark authorization; the prototype does not claim it. Institutional identity sources do not verify the fictional events or imply university endorsement.

## Verified names and proposed calendar labels

Registry sources were checked on October 21, 2026:

- [Engineering academic departments](https://www.engr.psu.edu/academics/department-contacts.aspx): department names, joint Agricultural and Biological Engineering affiliation, named IME/Nuclear departments and EECS structure.
- [EECS departments](https://www.eecs.psu.edu/departments/): Electrical Engineering and Computer Science and Engineering departments under the School of Electrical Engineering and Computer Science. The department index timed out when opened directly; its authoritative indexed result and the Engineering directory corroborated the structure.
- [School of Engineering Design and Innovation](https://www.sedi.psu.edu/): current SEDI name.
- [Materials Science and Engineering in EMS](https://www.ems.psu.edu/academics/our-departments/department-materials-science-and-engineering): MatSE belongs to Earth and Mineral Sciences, not Engineering.
- [Engineering student organizations](https://www.engr.psu.edu/academics/organizations.aspx) and [Outreach and Inclusion student organizations](https://inclusion.engr.psu.edu/student-resources/student-organizations.aspx): BMES/SWE identities.
- [Penn State brand guidance](https://brand.psu.edu/visual-identity-standards/color-and-the-mark): reference for official brand context, not authorization to reproduce an official mark.

ABE lists Agricultural Sciences first as its administrative home, with Engineering as a joint affiliation. EE and CSE list EECS as parent. IME and Nuclear retain their named department titles in full details. MatSE lists only EMS as its parent college. Calendar labels such as CoE, BME Dept., ChemE Dept., CEE Dept., AE Dept., EE Dept., ESM Dept., IME Dept., ME Dept., Nuclear Eng. Dept., Aerospace Dept., ABE Dept. and MatSE Dept. are the owner's proposed UI labels; this implementation does not assert that every abbreviation is officially adopted. CSE, EECS and SEDI are corroborated short forms. Future source/organizational changes require registry review.

## Planner control inventory and relocation

The permanent proposal/audience sidebar is removed. The calendar spans the available workspace width; Month/2 Weeks retain their existing eighth weekly-summary column, and Week/Day retain hourly grids.

| Existing functionality                                                                                 | Location after refinement                                                 |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Demo notice and Load sample scenario                                                                   | Page top, unchanged                                                       |
| Responsible proposal organization                                                                      | Filters & Audience, separate single-select host control                   |
| Independent major selections                                                                           | Planning majors dropdown                                                  |
| Academic years and shortcuts                                                                           | Academic years dropdown, all shortcuts retained                           |
| Analytical clusters and targeting explanation                                                          | Analytical clusters dropdown                                              |
| Current analysis scope                                                                                 | Compact inline summary, also available while the outer panel is collapsed |
| Published/exam/PSU-wide/Local/National visibility                                                      | Calendar layers dropdown, still display-only                              |
| Optional density and explanation                                                                       | Calendar layers dropdown, still presentation-only and off by default      |
| Proposal title, date/time endpoints, repeated-clock choices, optional category, validation and Analyze | Separate Local proposal disclosure above the calendar                     |
| Conflict results and independent proposal indicators                                                   | Main workspace, no deletion or combined score                             |
| Weekly detail dialogs, focus-week controls, empty/reset behavior                                       | Existing calendar and weekly summaries                                    |

Native details/summary dropdowns retain mounted controlled inputs, keyboard operation and selections while closed. The outer Filters & Audience panel shows selected majors/years/clusters, hidden layers, density status and proposal host when collapsed. Its count includes selected majors, academic years when restricted, selected analytical clusters, hidden display layers and enabled density. Proposal-host choice and draft fields are not calendar filters and are excluded from the count. Collapsing controls never changes analysis.

## Validation and acceptance

Unit/browser tests preserve the preceding analytical coverage and add migration, subtype, registry affiliations, all nine hosting arrangements, independent filtering/history, category palettes/contrast, paw sizing, disclosures, full-width planner views, six responsive widths and color-vision simulation checks. Actual results and screenshots are recorded in the preview gallery and PR report. Visible category labels remain necessary because some palette hues converge under color-vision deficiencies. Automated tests and simulation review are not formal WCAG certification or owner visual acceptance.
