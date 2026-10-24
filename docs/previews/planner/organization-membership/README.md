# Student organizations and university event hosts

Follow-up to the owner's October 22 clarification on PR #5. All event/proposal scenarios are fictional; sourced institutional host names do not verify events or partnerships. Owner visual acceptance remains pending.

Organization choices contain only explicitly classified student organizations: the three existing fictional student groups and the sourced BMES/SWE registry records. University departments, colleges, schools, administrative units and unresolved host types remain in the complete host registry for descriptors, badges, details and eligible scheduling constraints. They cannot be selected as student organizations or assigned student cluster membership.

## Current interfaces

| Width  | Student organization choices and University Events | Planner organization choices and university display control |
| ------ | -------------------------------------------------- | ----------------------------------------------------------- |
| 320px  | [Student](student-320.png)                         | [Planner](planner-320.png)                                  |
| 375px  | [Student](student-375.png)                         | [Planner](planner-375.png)                                  |
| 768px  | [Student](student-768.png)                         | [Planner](planner-768.png)                                  |
| 1440px | [Student](student-1440.png)                        | [Planner](planner-1440.png)                                 |

Student captures keep organization choices expanded and secondary filter groups collapsed to make the distinction visible. University Events restricts published results to known Penn State university hosting, including co-hosts, AND other active filters. Selected majors continue to find relevant department events without requiring department organization choices. URLs, browser history, reload, reset and collapsed active-filter counts preserve the new restriction.

Planner captures show student-only proposal hosts and the university display control with an analyzed fictional scenario. Show University Events defaults on and depends on the existing published-events master switch. Turning it off hides university-hosted/co-hosted cards while preserving eligible conflict analysis, weekly context and density inputs. It does not redefine PSU-wide external scope or alter host badges, full names, abbreviations, formulas, timestamps or policy windows.

## Regression evidence

New unit cases cover student-only choices and isolated accessor results, explicit membership across university unit kinds, schema rejection of university/unknown/unclassified cluster membership, department discovery by major or university filter, co-host conjunctions, stale URL sanitization/reset, unknown co-host uncertainty, and university constraints retained after display filtering.

Eight browser workflows cover both interfaces at the four widths above. They verify exact student option sets, absent university/unknown choices, preserved department details/paw badges, Enter/Escape/focus restoration, university filter persistence/history/reset and unchanged planner analysis when university cards are hidden. The preceding responsive/calendar/time/policy regression suite remains enabled.

Validation passed: formatting and formatting check, explicit documentation formatting, ESLint, TypeScript, **345 unit tests in 25 files**, production build, **107 Chromium browser tests**, and `git diff --check`. This adds ten unit cases and eight browser workflows to the previous 335/99 baseline. The eight new workflows also passed separately before the complete suite. Both interfaces were visually reviewed at 320, 375, 768 and 1440px; the existing suite retains the additional 430/1024px regression checks.

Local browser checks use system Chromium with a Los Angeles browser time zone to verify Eastern handling. CI retains its existing Node 22/bundled-Chromium configuration; see the PR delivery report for the final commit's Actions status. No event data, time utility, scheduling formula/policy, dependency, lockfile or CI infrastructure changes are included.

See [ADR 005](../../../decisions/005-student-discovery-and-host-identity.md#october-22-clarification-selectable-student-organizations) for semantics and model boundaries. Previous [discovery previews](../discovery-hosting/README.md) remain historical evidence for commit `72f842d`.
