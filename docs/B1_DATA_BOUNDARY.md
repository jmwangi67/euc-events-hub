# B1: asynchronous fixture-backed data boundary

The application still uses only the existing synthetic fixtures. No database,
authentication, live ingestion, or private dataset publication is introduced.

## Ownership

`lib/data/contracts.ts` defines storage-neutral Zod requests and serialized
responses. `lib/server/data/queries.ts` is the server-only provider entrypoint;
it validates inputs and outputs and delegates to the existing fixture readers.
Those readers remain the tested parity reference. Domain calculations and
Eastern time helpers retain their existing behavior.

Server pages await the full reference registry and pass majors, organizations,
and clusters to clients. University units stay in the registry without becoming
selectable student organizations. Missing required references produce an explicit
unavailable state rather than inventing an initial organization. A page error
boundary covers failed server-side reads with a retry and no internal details.
Reference reads finish before page rendering; there is no shared streaming loading
boundary, preserving the private preview route’s production HTTP 404.

Calendar-source helpers now transform supplied records synchronously. They do
not retrieve data. A transitive client-import test prevents fixture/server modules
from entering any client entrypoint, including development previews.

## Read-only endpoints

All endpoints accept POST JSON, reject unknown request fields, validate serialized
responses, and return `Cache-Control: no-store`. POST carries structured queries;
it performs no mutation. Invalid requests return a generic 400; provider failures
return a generic 500 without internal details.

| Endpoint | Request | Response |
| --- | --- | --- |
| `/api/data/calendar` | Eastern `{window: {start, end}, filters?, planning?}` | Published events, organizations, and (in planning mode) range-only synthetic exams/external records |
| `/api/data/event` | `{id}` | `{event}`; null for missing, draft, tentative, or canceled records |
| `/api/data/planning` | `{kind: "weekly", window}` or `{kind: "proposal", range: {start, end}}` | Complete analytical events, exams, external records, and organizations |

Date windows use inclusive Eastern start and exclusive end boundaries. Proposal
ranges use offset-bearing instants with the same exclusive-end convention.

Planning requests accept no display filters, visibility switches, source paths,
or dataset selectors. Calendar planning mode ignores discovery restrictions and
applies the existing audience/visibility transformations locally.

Weekly intelligence preserves complete Sunday–Saturday windows, policy-derived
external lookaround, seven additional exam days, and complete matching canonical
identity alternatives across engineering/external layers. Proposal loading
preserves the actual offset-bearing interval and its existing day coverage and
lookahead. No result is paginated or silently truncated. Weekly requests longer
than 366 calendar dates receive 400 before week expansion; all existing calendar
views fit within this bound. Proposal intervals retain their existing semantics.

## Asynchronous consumers

The client request layer validates response data. The query hook aborts obsolete
requests, checks cancellation before publishing either success or failure, and
hides data belonging to another query during render. Retry starts a new request.
Changing display toggles does not refetch or narrow analytical context.

Calendar errors, weekly intelligence errors, proposal errors, and detail errors
have independent status/retry controls. Failed or pending intelligence is never
passed to scheduling calculations or rendered as a no-conflict result. Activity
dots and density results are withheld while their corresponding inputs are
unavailable. The existing four student and five planner views remain unchanged.

Private local exam review continues through its separate guarded server loader.
Its review dataset never crosses these public endpoints; preview rendering makes
no public fixture request. Production denies the private route even when preview
flags are set. Existing synthetic development visual scenarios remain local.

## Verification

The pre-change baseline was 438 unit tests in 32 files. Existing range, discovery,
identity, uncertainty, time and calculation tests remain in place. Added coverage
checks asynchronous query parity, request/response validation, unpublished ID
lookup, transport failure, cancellation, client-import boundaries, empty
references, delayed/out-of-order responses, navigation, recovery, and production
privacy. The PR records final command results and exact test counts.
