# PR #5 student discovery, hosting and planner previews

These captures document commit `72f842d`. The subsequent [organization-membership clarification gallery](../organization-membership/README.md) shows the current student-only selectors and separate University Events controls.

Fictional events and proposed local scenarios only. Publicly sourced institutional host names establish identity, not event verification or endorsement. The SVG paw artwork is original and generic; it is not an official Penn State mark. Owner visual acceptance remains pending.

## Student discovery and hosting

| Preview                                          | Coverage                                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [Month](student-month.png)                       | Six category colors, compact hosts, single/double paw badges, student-only cards                |
| [Week](student-week.png)                         | Category cards and hosting in the hourly grid                                                   |
| [Day](student-day.png)                           | Keyboard activation, department hosting and times                                               |
| [List](student-list.png)                         | Full host names where space permits, full-month shared date headers, readable colored cards     |
| [Hosting arrangements](hosting-month.png)        | CoE, BME, MatSE, university/university, university/student, student-only and unknown-host cases |
| [Department details](department-details.png)     | Full MatSE name, Department-hosted metadata and separate source identity/event verification     |
| [Welcome and expanded guide](guide-expanded.png) | Six category explanations and the application's documented cluster definitions                  |
| [Major-only results](major-only.png)             | Major relevance without requiring an organization                                               |
| [Major + organization](major-organization.png)   | Independent restrictions combined with AND                                                      |

The welcome uses the supplied full copy on desktop and shorter feature copy on compact screens. At 320px the first event stays within the 1000px validation viewport. The full registry remains available in the organization filter's scrollable group. Card titles, compact times, category labels and registered host names remain readable; full names remain in accessible labels and details.

## Planner controls and all five layouts

- [Filters expanded](planner-filters-expanded.png)
- [Filters collapsed](planner-filters-collapsed.png)
- [Month](planner-month.png)
- [2 Weeks](planner-2-weeks.png)
- [1 Week](planner-1-week.png)
- [Day](planner-day.png)
- [List](planner-list.png)

The proposal/audience sidebar is removed. Native dropdowns and the outer Filters & Audience disclosure preserve all controls and selections. The separately collapsible local proposal retains validation and repeated-time choices. Weekly summaries, detail dialogs, density overlays, scheduling cautions and independent preparation/non-exam indicators remain available. Expanded/collapsed captures deliberately include an analyzed fictional scenario; initial-width captures show the unsaved sample draft.

## Responsive student and planner interfaces

| Width  | Student                     | Planner                     |
| ------ | --------------------------- | --------------------------- |
| 320px  | [Student](student-320.png)  | [Planner](planner-320.png)  |
| 375px  | [Student](student-375.png)  | [Planner](planner-375.png)  |
| 430px  | [Student](student-430.png)  | [Planner](planner-430.png)  |
| 768px  | [Student](student-768.png)  | [Planner](planner-768.png)  |
| 1024px | [Student](student-1024.png) | [Planner](planner-1024.png) |
| 1440px | [Student](student-1440.png) | [Planner](planner-1440.png) |

## Color-vision simulations

Chromium's vision-deficiency emulation was used, with visible category labels and textual hosting semantics retained:

- [Deuteranopia](vision-deuteranopia.png)
- [Protanopia](vision-protanopia.png)
- [Tritanopia](vision-tritanopia.png)

Some category hues converge under these simulations. Color is supplemental; category names remain visible on cards, filters, legend and guide. Primary/secondary category text contrast is checked against each prescribed surface at a 4.5:1 minimum, and badges use navy-blue text on white. These checks and visual simulations do not constitute formal WCAG certification or guarantee any individual's experience.

## Validation

Baseline at `6056c9f715018758b829ea85e0ea93a8c2f93303`: 308 unit tests, 83 Chromium workflows and GitHub Actions were green. Existing mathematical/policy coverage is retained. This refinement adds 27 unit cases and 16 browser workflows for taxonomy/subtypes, source-backed hosts, all nine hosting arrangements, filtering/history, disclosure state, category palette/contrast, responsive layout and color-vision simulations.

Final local validation passed:

- `npm run format` and `npm run format:check`.
- Explicit Prettier formatting/check of the changed documentation.
- `npm run lint` and `npm run typecheck`.
- `npm test`: **335 tests in 24 files**.
- `npm run build`: successful production build.
- `CI=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`: **99 passed**, including full/compact host visibility, wide Day-card bounds and keyboard focus restoration.
- `git diff --check`.

Student and planner previews were inspected at all six requested widths. Expanded guide/filter states, all public/planner layouts, hosting/detail scenarios and the three vision simulations were also reviewed. The 31 original captures are linked above. Wide Day cards use horizontal metadata rows; short/narrow hourly cards retain the existing internal scrolling, with complete accessible descriptions and detail dialogs.

Local checks use Chromium 154 and Node 24; GitHub Actions uses the existing Node 22/bundled-Chromium configuration. The local production build required authorized local socket access and a fresh generated build cache after a sandbox-bound worker failed; no project workaround was added. See the PR report for the final commit's Actions result.

See [ADR 005](../../../decisions/005-student-discovery-and-host-identity.md) for authoritative identity sources, proposed abbreviations, lossless unresolved mapping, branding limits and the complete planner control inventory. These are local Chromium captures, not a hosted deployment.
