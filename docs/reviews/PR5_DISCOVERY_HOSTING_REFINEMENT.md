# PR #5 consolidated discovery and hosting refinement review

The owner's consolidated request was applied on top of clean head `6056c9f715018758b829ea85e0ea93a8c2f93303`, preserving all previously pushed implementation. Its [GitHub Actions run](https://github.com/jmwangi67/euc-events-hub/actions/runs/39143615918) passed before this update. No reset, merge, squash, closure or approval is part of this work.

| Requirement                   | Resolution                                                                                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exactly six public categories | Canonical six-value schema and stable classes; career legacy values migrate with typed fair/recruiting/networking subtypes                                                                          |
| Purpose-aware migration       | Existing fixture purposes classified explicitly; unresolved Research/Student organization inputs retain IDs/data, null category, legacy value and review note                                       |
| Preserve career fairs         | Non-exam timing checks the structured `career-fair` subtype; midnight-to-exact-finish tests remain and new migration/title-independence cases pass                                                  |
| Category palette and legend   | Six exact surfaces/borders and charcoal text in public views; planner scope/density untouched; category names remain visible                                                                        |
| One/two-paw hosting           | Existing Organization model extended; university-only one paw, university+student two, student-only/unknown none; original generic SVG, no official mark/inner-border identity design               |
| Host registry and names       | Authoritative Penn State sources checked; full/compact labels separated, named IME/Nuclear titles preserved, MatSE parent EMS, ABE joint affiliation, EE/CSE under EECS                             |
| Full host details             | Full registered names in accessible event labels and dialogs, separate Department-hosted metadata, original descriptions unchanged, identity sources distinct from fictional event verification     |
| Student filter semantics      | Major/organization/category/host-membership cluster OR within and AND across; no restriction for empty selections; mode cannot bypass selected majors                                               |
| History and reset             | Active clusters/categories/hosts/majors serialized; legacy career URLs migrate; filter changes push history and search replaces its current entry; reset clears all dimensions                      |
| Welcome and guide             | Supplied full desktop copy, compact mobile invitation, closed-by-default category/community guide using real application cluster definitions                                                        |
| Planner dropdowns and count   | Outer Filters & Audience panel, independent native dropdowns, accurate selected-choice/restriction count, selected names visible while collapsed; proposal host remains distinct                    |
| Sidebar removal               | Controls above full-width calendar; separate local-proposal disclosure; complete control inventory and relocation in ADR 005                                                                        |
| Analytical preservation       | Original preparation formula/onset/cutoffs, exam alternatives, Eastern/DST, per-cell integrity, policies, context-only exclusions, source uncertainty, striped ranges and null score gates retained |
| Responsive/keyboard behavior  | All public/planner layouts, six widths, source-backed links, Enter/Space, Escape/focus restoration, independent density and weekly focus behavior retained                                          |

## Material review corrections

Rendered review caught generic calendar span rules overriding horizontal badge layout and compact/full name visibility. More specific semantic layout selectors and geometry/visibility assertions now cover those states. A bounded scroll region keeps the complete host registry accessible without making the sidebar excessively tall.

Wide hourly event cards now use the available horizontal space for their time, title, badge, category, full host name and location. Browser bounds assertions verify that the badge, full name and location fit inside the one-hour Day-view fixture. Narrow hourly events retain the existing scrollable content and compact host labels; full names and all details remain available through accessible labels and the dialog.

The unabridged welcome pushed the first compact event below the initial viewport. Compact copy, a combined filter header and restrained spacing bring it within the 1000px validation viewport at 320px while preserving full desktop copy and the discovery guide. Public desktop List headings were also empty because undefined FullCalendar format props suppressed defaults; explicit full-month date formatting restores the shared headers.

Old regression assertions were updated only for superseded taxonomy/filter behavior or explicitly relocated controls. They continue to exercise counts, conjunctions, time ranges, geometry, keyboard interactions, focus, source uncertainty and mathematical boundaries. No tests were skipped or removed to obtain passing results.

## Files and evidence

- Domain: `event-taxonomy.ts`, `event-categories.ts`, `models.ts`, `hosting.ts`, `calendar-state.ts`, `planner-control-summary.ts`; the non-exam module's fair discriminator changes from category to subtype only.
- Data: existing fixture query filters and original fixture records; new `data/fixtures/hosts.ts` and `discovery.ts` with verified identities and fictional November event scenarios.
- UI: existing calendar source/content/details, student composition/filter controls, semantic styles, new category legend/hosting badge/guide/shared disclosure; relocated planner controls and form.
- Tests: original unit/browser suites retained with exact new semantics; `student-discovery-refinement.test.ts` and `discovery-hosting.spec.ts` add the new requirements.
- Documentation: [ADR 005](../decisions/005-student-discovery-and-host-identity.md), specification/architecture/design system/README and [preview gallery](../previews/planner/discovery-hosting/README.md).

Final command counts and CI status belong in the gallery and PR delivery report. No dependency, lockfile or CI infrastructure changes were needed.

## Honest limits and owner decisions

### Student organizations versus university hosts

The October 22 clarification restricts student organization choices on `/` and the planner's proposed-event organization selector to explicit student-organization records, including the existing fictional groups and sourced BMES/SWE. The complete host registry remains available to cards, abbreviated/full host names, paw badges, details and scheduling analysis. Schema validation rejects student-cluster memberships on university, unknown or unclassified hosts; discovery cluster matching and guide membership lists also require student organizations.

University-hosted/co-hosted events remain discoverable by major or the new University Events restriction. Its URL, history, reset and active-count behavior are covered. The planner's separate university-card visibility checkbox defaults on under the published-event master switch, and never narrows proposal conflicts, weekly context or density inputs. Ten additional unit cases and eight browser workflows bring validation to **345 unit tests and 107 browser tests**, retaining all prior coverage. [Current screenshots and validation](../previews/planner/organization-membership/README.md) cover both interfaces. No event data or scheduling/time methodology changed.

### Continuing prototype limitations

Events remain fictional, incomplete and unsaved. Public institutional identity sources do not verify an event or partnership. Most compact department labels are owner-proposed UI abbreviations, not a claim of official adoption. Official mark replacement would require applicable branding/trademark authorization; the current original generic SVG does not claim that status. Unresolved purposes/host types/memberships remain flagged or excluded from restrictive matches rather than guessed.

Color-vision simulations show converging hues, so textual category labels remain essential. Automated contrast, keyboard and reflow checks are not a formal accessibility certification. Existing uncalibrated preparation and non-exam policy limitations persist; no numerical overall/non-exam score or automatic date ranking is approved. The remaining acceptance step is the owner's local-browser visual review before any merge.
