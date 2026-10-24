# Milestone 2A — EUC-administered academic exam datasets

**Status:** Milestone 2A.0 implemented in PR #5; owner local testing/review pending. Milestones 2A.1–2A.2 remain planned. Full production administration is **not** part of PR #5.

**Owner:** EUC administration (future platform role).  
**Scope:** Semester-based, administrator-managed academic exam records for EUC Events Hub.  
**Dependencies:** Persistent database, individual administrator authentication, authorization/RLS, server-side validation, source-permission review, and audit logging (the existing Milestone 3 foundation).  
**Boundary:** Offline import and an explicitly enabled loopback-only development review are authorized. No public import, database, login, administrator dashboard, live schedule, or source publication is authorized.

## Outcome

After Milestone 2A is implemented, authorized EUC administrators can create a semester, manually enter or bulk-import academic examination schedules, review source uncertainty, publish eligible exam records, correct or archive them, and see the updated exams in the planner **without editing source code or opening a GitHub pull request**.

## Existing prototype integration

The Milestone 1C planner retains synthetic exams, weekly academic summaries, independent experimental exam preparation, Eastern Time handling, source alternatives, and a separate non-exam scheduling model. Its published `Exam` schema still models one date with known or unknown hours. Milestone 2A.0 adds a separate versioned staging model representing **one canonical exam occurrence with multiple possible testing dates**, without fabricating multiple exams or assigning an exact time without evidence.

Do not fold exam data into the six student event categories, count it in non-exam density, alter the uncalibrated exam-preparation equation, or replace `{status: "awaiting-methodology-review", score: null}`.

## Incremental delivery

### 2A.0 — Data contract and offline validation (can begin before backend)

Completed preparation checklist:

- [x] Typed Zod version 1 contract with separate certainty, workflow, source rights and audience review.
- [x] Offline JSON/CSV validation/import, atomic private output, deterministic duplicate reconciliation and idempotent re-import.
- [x] Timed, date-only, date-option, possible-only and date-window representation with one canonical identity.
- [x] Explicit eligibility adapter to the unchanged preparation model; unknown mappings, default hours and multi-date windows remain review-only.
- [x] Separate `/planner/exam-preview` using the existing calendar, enabled only in development with an explicit flag and loopback request.
- [x] Server-only private reads, ignored private files/cache, production tracing exclusions and aggregate artifact audit.
- [x] Private archive validated locally: 84 occurrences, 32 courses, 98 reported date options, one additional possible date; zero invalid/conflicting records and zero preparation-eligible occurrences. These counts are not source verification or publication approval.
- [x] Invented regression cases for uncertainty, DST, duplicates, source conflicts, audience independence and browser accessibility. Public previews contain invented records only.
- [x] [Windows PowerShell setup and contract guide](../LOCAL_EXAM_IMPORT.md), [ADR 006](../decisions/006-local-exam-import-and-review.md), and [synthetic preview/validation report](../previews/planner/exam-import/README.md).
- [ ] Project owner completes local testing and reviews the implementation before further development or merge.

Implemented scope:

- Define a versioned, semester-scoped staging format for individual timed exams, unknown-hour single-day exams, multiple alternative testing dates, optional possible dates, source conflicts, and date-wide exam windows.
- Separate canonical exam occurrence identity from source records, sections, student choice of eTesting date, and imported file identity.
- Preserve source term, filename or institutional source ID, import checksum, reported precision, and field-level explanation.
- Do not infer the exam number from date order, sections from course ID, student enrollment, major applicability, course-level requirements, or time-of-day from unsupported source records.
- Store actual unapproved/restricted materials under gitignored `data/local/` or another access-controlled location. Only genuinely invented synthetic fixtures belong in `data/fixtures/` and this public repository.
- Build tests for a default evening timetable, two-date unknown-hour windows, an additional uncertain third day, requested/unapproved windows, repeated course dates, conflicting sources, duplicate file uploads, dates across Eastern DST boundaries, and no cross-major pooling.
- Keep all imported records **staged**; no public or planner publication is implied.

### 2A.1 — Secure data administration (after Milestone 3 prerequisites)

- Individual EUC administrator accounts and server-enforced roles; no client-only authorization.
- Terms, courses, source documents, imports, canonical exams, date options, section applicability, and course-to-audience mappings persisted in normalized tables.
- Manual create/edit/archive and CSV/XLSX upload. DOCX/PDF-assisted extraction can be added later, with preview and mandatory human reconciliation.
- Import dry run with duplicate detection, row errors, conflicting claims, and a reversible review queue. Idempotent re-imports must not multiply canonical exams.
- Distinct **source confirmation** (`confirmed`, `reported-unverified`, `requested-unapproved`, `conflicting`) and **publication workflow** (`draft`, `in-review`, `approved-for-planner`, `approved-for-public`, `archived`), subject to permission review.
- Maintain immutable audit records of actor, timestamp, before/after values, import batch, source, and publication transitions. Support corrections and rollback.
- A semester upload must never silently overwrite another department's records; record-by-record reconciliation is required.
- On publication, update approved planner exam views from the data service without redeploying code.

### 2A.2 — Exam visualization and synchronization

- Approved-for-planner records feed the planner's exam overlay, exam detail views, weekly summaries and experimental preparation model **only when eligibility and timing certainty support each calculation**.
- Multiple alternative eTesting dates are one occurrence. Never score each possible testing date as a separate exam or automatically sum them. Requested dates and conflicting claims must not masquerade as confirmed exact-time constraints.
- Timed evening exams use explicit offset-bearing instants and Eastern source dates; date-only records remain unknown-time; optional Friday is **possible**, not scheduled.
- Public student-calendar academic-exam overlay is a separately reviewed opt-in feature, not an automatic consequence of uploading an admin dataset.
- Student-organization selection and event-category taxonomy remain unrelated to course/exam records.

## Admin experience (future)

1. Create or select term (for example, Fall 2026).
2. Upload CSV/XLSX or add an exam manually. Display the source, semester, and whether redistribution is allowed.
3. Preview parsed course, occurrence label, date options, possible additional dates, time/time basis, sections, major relevance, certainty, and potential duplicates.
4. Correct errors and reconcile existing records. Keep unknown mappings unknown, not universal.
5. Submit for review; a suitably authorized admin approves planner/public scope separately.
6. Publish, amend or archive. Changes appear in eligible calendars without a developer edit, with audit history.

## Source-informed pilot cases (private staging only)

A provided Fall 2026 science master schedule contains individual PHYS/CHEM/MATH evening-table entries and separate BIOL 114, BIOL 141, BIOL 224 and MATH 110 multi-date course windows. The BIOL 114 request is explicitly unapproved; BIOL 224 may include an additional Friday; the evening-table header supplies a default 6:15–7:30 PM unless noted otherwise. The document is a **test input** and is neither independently verified nor approved for republication. Its raw records and source-derived CSV/JSON must not be committed to the public repository before authorization.

## Acceptance criteria for the eventual implementation

- EUC administrators can manage term datasets without code changes.
- Only authorized admins can change exam/source records; authorization is enforced at the server/database, with tests.
- Unknown, requested, and conflicting date claims are visible as uncertain and do not generate fabricated timed overlaps.
- Multi-date testing windows retain one canonical exam occurrence across all source alternatives.
- Duplicate upload and conflicting version reconciliation are deterministic, auditable, and safe.
- Explicit, reviewed course-to-major and academic-year mappings control relevance; no course-code guessing.
- Existing experiment preparation math and the independent non-exam model remain unchanged; the overall score remains null until separately approved.
- Source rights, publication visibility, input validation, archive/rollback, security, time-zone, and browser accessibility tests pass.
- The project owner reviews milestone scope and UI before implementation/merge.

## Deferred beyond this milestone

- OCR-based automatic publication without human review.
- Penn State SSO integration unless separately approved.
- Instructor/student personal exam schedules or student-specific enrollment imports.
- Attendance predictions, numerical overall scheduling scores, or candidate-date rankings.
- Public reuse or redistribution of source-provided schedules without permission.
