# ADR 006: Versioned exam staging and private local review

Status: Authorized by the owner's Milestone 2A.0 request. Source publication and owner local acceptance remain pending.
Date: 2026-10-23

## Scope and boundaries

Add offline JSON/CSV import, validation, canonical staging and a read-only development review. Retain the existing Next.js/TypeScript/Zod/FullCalendar architecture. No database, login, administrative role, upload endpoint, public API, publication action, live schedule or production administration is added. The three newer roadmap commits through `a9a219b` are preserved. ADRs 003–005 and all existing scheduling mathematics remain intact.

The existing planner loads fictional fixtures in client code and its published `Exam` contract has one known or unknown date. Private multi-date source claims therefore use a **separate `/planner/exam-preview` review route** with the existing `EventCalendar` wrapper and native details dialog. `/planner` retains the fictional demonstration and links to the review only when explicitly enabled locally. The two datasets are never silently combined. Private staging is not injected into the public student calendar or the existing planner's analyses.

## Version 1 contract and reconciliation

`lib/exams/staging.ts` owns the strict Zod contract. Each dataset has a version, stable dataset/term identity, explicit America/New_York zone, independent source identities/checksums/permissions and canonical exam occurrences. One occurrence has a stable ID and one or more complete source claims. Each claim retains course, supplied designation, sections or null, separately reviewed audience mappings, timing, source/batch/reference, source confirmation, publication workflow and notes.

Timing variants are explicit offset-bearing instants (explicit or explained source-default hours), a single unknown-hour date, reported date options plus distinct possible dates, or a date-wide window with an exclusive end. Invalid dates, impossible intervals, repeated/overlapping options, unknown references and mixed term identities fail validation atomically. The term identifier is explicit; dates/eligibility are not inferred from a course or term-name pattern. Future curated term calendars may add authoritative semester boundary validation.

Normalization deterministically groups canonical IDs, deduplicates exact claims and retains distinct provenance or conflicting alternatives. Re-import is idempotent. Different term datasets cannot overwrite each other; conflicting source metadata must be reconciled. Range queries return one canonical occurrence if any reported or possible date intersects. Semantic timing comparison uses instants, while original source timestamps/offsets remain in staging. Context notes are preserved separately and never become invented exams.

The source-package compatibility adapter uses field structure, not semester/course/date constants. Its legacy inputs are deliberately unverified/private. CSV imports preserve the supplied clocks and date-option columns; richer source notes, checksums and nullable mappings are available in JSON. New integrations should use version 1 rather than relying on an unversioned source layout. No late-hour, section, ordinal, enrollment, major or academic-year inference is performed.

## Review and numerical eligibility are separate

Source confirmation has confirmed, reported-unverified, requested-unapproved and conflicting states. Publication workflow separately has private-staging, draft, pending-review, approved-for-planner, approved-for-public and archived. Independent source verification and explicit planner/public permissions are separate again. Importing or viewing never promotes any of these states.

The review shows all staged records, including unknown audiences and unapproved/conflicting dates. The existing academic-exam colors are reused. Date-only segments appear in the Date options band, with reported dates and distinct possible-only labels/borders. Several rendered segments can refer to the same canonical occurrence; the range counter counts unique occurrences, not segments. All source alternatives and unknown sections/appointments remain inspectable. Native dialogs retain keyboard activation, Escape and focus restoration. A Strict Mode effect-replay close notification is ignored when the native dialog has already reopened.

`toReviewedCanonicalExams` is the explicit future integration boundary. It requires reconciled claims, confirmed/independently verified sources, planner permission, approved workflow and reviewed nonempty major/year mappings. Multi-date windows and source-default clocks remain review-only. Compatible explicit single-time records convert to the existing `Exam` shape, normalizing canonical instants to UTC without changing staging offsets. Reviewed unknown-hour single dates may use the existing bounded model, never a fabricated point estimate. Existing canonical deduplication and original major/year relationships remain in force. Synthetic tests exercise the established curve, exact cutoffs, audience-cell separation and non-exam independence. No new preparation formula is introduced; the overall score remains null.

## Private storage and runtime guards

- Inputs, normalized output, source files and private reports stay in gitignored `data/local/exams/`. CLI output requires ignored/untracked storage. Filesystem checks reject traversal and symlink escapes; import writes atomically after complete validation.
- The CLI reports aggregate diagnostics, not private records. It uses the existing TypeScript compiler in disposable ignored scratch output; no new runtime dependency is required.
- Private reads are server-only, after checking `NODE_ENV=development`, `EUC_PRIVATE_EXAM_PREVIEW=1` and loopback request/forwarding/origin values. Production/test always deny reads, even with the flag set. The owner must bind the dev server to 127.0.0.1. These local protections are not production authentication or a supported public/tunneled review service.
- The route is dynamic, non-indexable and unavailable in production. No private JSON is statically imported and no NEXT_PUBLIC flag is used. Only an explicitly enabled local response transfers review data to the owner's browser.
- Private development output is isolated under `data/local/exams/.next-preview`; normal production output stays in `.next`. Next-generated type paths follow that private cache. Private/scratch directories are excluded from lint. Dynamic guarded filesystem operations explicitly opt out of production tracing; tracing also excludes `data/local/**/*`, including future standalone packaging.
- A local aggregate build audit checks distinctive canonical IDs/source checksums and private file-tracing references. Production browser tests supply preview flags and still require 404/no review link. Development browser tests force invented data, so public failure artifacts cannot capture the private archive.

## Deferred work and acceptance

Milestone 2A.1 still requires a persistent normalized data service, individual administrator authentication, server/database authorization, source-rights review, audit/rollback, manual editing, review/approval transitions, and CSV/XLSX upload management. Published dataset synchronization and a multi-date numerical methodology require their respective future approvals. This milestone provides no production administration or automatic publication.

See [local setup, contract and PowerShell commands](../LOCAL_EXAM_IMPORT.md), [milestone checklist](../milestones/2A-ACADEMIC-EXAM-ADMINISTRATION.md), and the [synthetic preview gallery](../previews/planner/exam-import/README.md) for actual validation results. Owner local testing/review is required before further development or merge.
