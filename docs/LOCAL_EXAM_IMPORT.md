# Local academic exam import and review (Milestone 2A.0)

This is an offline import/read-only review workflow, not an administrator portal or publication system. Keep real inputs, outputs and validation reports under gitignored `data/local/exams/`. Do not copy them into fixtures, screenshots, tests, `public/`, or Git. The application's normal production/public data remains fictional.

## Supported contract

The authoritative version 1 schema is [`lib/exams/staging.ts`](../lib/exams/staging.ts). JSON has `schemaVersion: 1`, `datasetId`, `termId`, `timeZone: "America/New_York"`, `sources`, `exams` and `sourceNotes`.

Each source has a stable ID/label, optional SHA-256 checksum, independent verification flag, separate planner/public permission flags and notes. Each canonical exam has one stable `id` and complete `claims`; do not create one exam per testing date. A claim contains `courseId`, `termId`, nullable `designation`/`sections`, reviewed audience metadata, source ID/batch/reference/section, `sourceStatus`, `publicationStatus`, notes and one timing variant:

| Timing kind    | Fields                                                                                      | Meaning                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `timed`        | `start`, `end` with explicit offsets; `basis` explicit/source-default; nullable `basisNote` | Source-reported clocks. Default hours require explanation; they are not per-course verification. |
| `date-only`    | `date`                                                                                      | One date with unknown hours.                                                                     |
| `date-options` | `reportedDates`, `additionalPossibleDates`                                                  | One occurrence with alternative dates; possible dates are distinct from reported dates.          |
| `date-window`  | `startDate`, `endDateExclusive`, `additionalPossibleDates`                                  | Date-wide testing window with unknown individual appointment/time.                               |

Every timing variant declares America/New_York. Valid explicit instants support DST and midnight crossing. The unversioned source adapter resolves supplied local clocks through IANA rules and rejects gaps/folds without an explicit instant; it never chooses a repeated clock or a late-exam time automatically. Date windows use calendar dates, not fixed UTC offsets.

Source confirmation (`confirmed`, `reported-unverified`, `requested-unapproved`, `conflicting`) does not grant publication. Workflow (`private-staging`, `draft`, `pending-review`, `approved-for-planner`, `approved-for-public`, `archived`) and source permissions remain independent. Audience metadata has an explicit `reviewed` flag, major IDs and academic levels (`first`, `second`, `third`, `fourth`, `fifth-plus`). Null/empty source mappings remain unreviewed; course numbers never imply enrollment or eligibility.

The supplied unversioned JSON/CSV layout is supported by a compatibility adapter. CSV requires `record_id`, `term_id`, `course_id`, `source_exam_label`, `date_options`, `additional_possible_dates`, `time_kind`, `start_time_et`, `end_time_et`, `source_confirmation`, `publication_status`, `source_reference` and `notes`. Date-option lists use semicolons; standard quoted commas/newlines/quotes are supported. CSV remains private/unverified staging and carries less provenance than the richer JSON package. XLSX, DOCX and PDF extraction are deferred.

## Windows PowerShell: private archive

From the repository root, use Node >=22.13, npm, Git, and Python 3.10+ for the archive's optional sanity validator. These commands assume the owner has the separately supplied archive in Downloads; adjust only that local path as needed.

```powershell
git switch feat/milestone-1c-organization-planner
git pull --ff-only
npm ci
New-Item -ItemType Directory -Force .\data\local\exams\fall-2026 | Out-Null
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\EUC_Fall_2026_Exam_Test_Data_PRIVATE.zip" -DestinationPath .\data\local\exams\fall-2026
git check-ignore data/local/exams/fall-2026/*
python .\data\local\exams\fall-2026\validate_exam_staging.py
npm run exams:validate -- --input data/local/exams/fall-2026/fall_2026_science_exam_private_staging.json
npm run exams:import -- --input data/local/exams/fall-2026/fall_2026_science_exam_private_staging.json --output data/local/exams/fall-2026/staging.v1.json
npm run exams:validate -- --input data/local/exams/fall-2026/staging.v1.json
```

Validation is atomic. Malformed input returns field/row paths and no partial output. Successful diagnostics report only aggregate occurrence/date/course counts, duplicate/conflict counts, missing sections/audiences and numerical eligibility. A canonical conflict stays one occurrence with retained claims; it does not become a confirmed timestamp. Context notes never become exams. The dataset is neither independently verified nor approved by a successful validation.

To validate the CSV independently:

```powershell
npm run exams:validate -- --input data/local/exams/fall-2026/fall_2026_science_exam_private_staging.csv --dataset-id local-csv-review
```

For another semester, use a new directory/dataset/term and the same contract/commands; no semester schedule is compiled into the application. A repeat import does not multiply IDs. To reconcile an incoming version with existing staging, use `exams:import --input <incoming-private-json> --merge <existing-private-json> --output <private-output-json>`. Different terms and conflicting source metadata are rejected. Distinct conflicting timing claims are retained for review; no claim silently overwrites another. There is no automated source-rights or approval transition.

## Enable the local preview

```powershell
$env:EUC_PRIVATE_EXAM_PREVIEW = "1"
$env:EUC_EXAM_PREVIEW_DATASET = "private"
$env:EUC_EXAM_DATASET_PATH = "data/local/exams/fall-2026/staging.v1.json"
npm run dev -- --hostname 127.0.0.1
```

Open **http://127.0.0.1:3000/planner/exam-preview**. `/planner` is the unchanged fictional demonstration; its local-only link opens the separate dataset review. The review's **Fictional demonstration planner** link switches back. No mixed mode is implemented. Source files are read on the server for this explicitly enabled local review; the owner's local browser receives the records to inspect. Do not expose/tunnel the development server or share private screenshots/traces. Remote/proxied hosts and all production requests are denied.

The banner reads **Private exam data preview — unverified**. Range counts are unique canonical occurrences, even when several date-option segments are shown. Reported dates, additional possible dates, default-hour basis, unapproved/conflicting status, sections, audience review, source/batch identity and workflow are available in the details dialog. Enter/Space opens details; Escape closes and restores focus. Date-only placement is labeled Date options, not a claimed all-day commitment.

For safe public screenshots or UI regression testing, stop the server and use the explicitly separate invented dataset:

```powershell
$env:EUC_EXAM_PREVIEW_DATASET = "synthetic"
npm run dev -- --hostname 127.0.0.1
```

The UI labels these records invented. Automated development browser tests force this mode and never read the owner's source. Screenshots committed to the gallery contain invented records only.

## Disable, build and audit

Stop the dev server with Ctrl+C, then:

```powershell
Remove-Item Env:EUC_PRIVATE_EXAM_PREVIEW -ErrorAction SilentlyContinue
Remove-Item Env:EUC_EXAM_PREVIEW_DATASET -ErrorAction SilentlyContinue
Remove-Item Env:EUC_EXAM_DATASET_PATH -ErrorAction SilentlyContinue
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run exams:audit-build -- --input data/local/exams/fall-2026/staging.v1.json
npx playwright install chromium
npm run test:browser
npm run test:exam-preview
git diff --check
git ls-files data/local
```

The last command must print no private files. The aggregate audit checks distinctive canonical/source identity markers and private file-tracing references in `.next`; it must report zero violating files. Private development caches live separately in ignored `data/local/exams/.next-preview`, and production tracing excludes `data/local/**/*`. The production route is unavailable even if someone accidentally leaves the preview flag set. There is no production data endpoint or NEXT_PUBLIC flag.

## Preparation and next milestones

Private/unreviewed, requested, conflicting, multi-date and source-default-hour records remain review-only. `toReviewedCanonicalExams` is an explicit adapter for future integration after all required source, permission, workflow and audience reviews. Compatible explicit single-time claims use the unchanged experimental formula; reviewed single unknown dates retain the existing bounded result without an invented point. Duplicate sources do not add an exam twice; major × academic-year cells remain separate. Imported exams never enter Other Scheduling Constraints or non-exam density, and the overall score stays null.

Milestone 2A.1 still needs the database and individual EUC administrator authentication/authorization prerequisites, source-rights checks, editable terms/courses/imports, review/approval queues, audit/rollback and upload management. Publication and calendar synchronization are deferred. The owner must complete local testing and review before further development or merging PR #5.
