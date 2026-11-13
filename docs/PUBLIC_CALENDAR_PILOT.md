# Real-data calendar pilot

The ordinary student calendar and organization planner use the curated data under `data/public-calendar/`. The public pilot runs from versioned data with the existing asynchronous calendar, event and planning endpoints. The default server needs neither a database nor private local files.

## Updating records

1. Open the organizer listing and verify the identity, Eastern date, available clocks, venue and audience. Record the source URL beside the curated record. For EUC tabling, record the owner-approved schedule with its verification status.
2. Edit `events.ts` for an engineering or organization occurrence with a known interval. Use `context.ts` for institutional dates, athletics, venue events and listings without an end time. A known start and optional doors are stored separately from the date used to place the card. Academic deadlines are context. Include the source status and any unresolved detail in the record.
3. Preserve the canonical ID across corrections. Model separate dated sessions under one series when relevant. Merge cross-listings into an existing occurrence. For a verified cancellation or change, update the occurrence and retain the organizer reference.
4. Run `npm test`, `npm run build`, and `npm run test:browser`. Use `npm run test:browser:fixtures` for the isolated UI regression scenarios and `npm run test:exam-preview` for the local staging review.

## Fall 2026 examination export

The original archive was validated into staging schema version 1. It contains 84 canonical occurrences across 32 courses, 98 reported date options and one possible date. Seventy claims have source-default 6:15–7:30 PM Eastern hours, 14 have unknown hours, and four testing windows are requested and unapproved. All section and audience mappings are unknown. The input recorded zero conflicts between claims and zero numerically eligible occurrences.

The archive's local-only staging directions predate the owner's express public pilot approval for non-personal schedule facts. The archive readme ties broader use to owner/publication authorization, and the package contained no separate redistribution license or prohibition. The original DOCX was unavailable. The curated export carries canonical IDs, course and designation where supplied, timing variants, approval uncertainty and a generalized source reference. It omits the raw files, internal source IDs, source checksum, original file name, free-form notes and any private references. Publication and independent verification are separate. The preparation adapter remains governed by the original eligibility rules and receives zero of these claims. Institutional deadlines come from the Registrar. For example, the archive's December 19 graduation note is superseded here by the Registrar's December 20 Fall commencement date.

Reproduce from the reviewed archive with the existing import command and this export step:

```powershell
npm run exams:import -- --input data/local/exams/fall-2026/fall_2026_science_exam_private_staging.json --output data/local/exams/fall-2026/staging.v1.json
node scripts/export-public-exams.mjs data/local/exams/fall-2026/staging.v1.json
npx --no-install prettier --write data/public-calendar/fall-2026-exams.json
```

The export checks the normalized input hash against the reviewed dataset. If the source changes, review the new file and projection before updating the approval in the exporter. The normal build reads only the versioned export. No individual schedules, student names, enrollment or appointments are present.

## Source decisions

- The Registrar verified the Fall 2026 and Spring 2027 regular-session academic markers. The pilot uses exclusive end dates internally, including for final-exam periods and breaks. [Registrar](https://www.registrar.psu.edu/academic-calendars/2026-27.cfm)
- The career week overview expands to three occurrences. The official employer listing places interviews at the Bank of America Career Services Center. The ASCE and chemical engineering receptions are separate verified schedule entries. The chemical engineering host comes from the owner, while the college verifies Heritage Hall. [Career Week](https://career.engr.psu.edu/ecw/index.aspx), [interviews](https://career.engr.psu.edu/ecw/employers/), [engineering events](https://www.engr.psu.edu/events/), [career events](https://career.engr.psu.edu/events/), [Spring Career Days](https://studentaffairs.psu.edu/career-readiness/career-events/spring-career-day)
- The current engineering listing places the public Fall Capstone Showcase in 129 ABC HUB-Robeson Center on December 10, 1–3:30 PM. An older Learning Factory page listed the Bryce Jordan Center with date TBD. The proposed virtual date range and sponsor sessions are excluded. [Engineering events](https://www.engr.psu.edu/events/), [Learning Factory](https://lf.psu.edu/students/lf-capstone/design-kickoff-showcase/)
- The Bryce Jordan Center snapshot includes every listing exposed by its public pagination on November 13, plus four November listings from its calendar. The multi-show Hot Wheels listing becomes three occurrences. Commencement is represented by the institutional marker and the distinct engineering ceremony. THON is represented once. Indiana's published door time follows its listed tipoff and is flagged for confirmation. Unknown end times remain absent. [BJC listings](https://bjc.psu.edu/events), [BJC calendar](https://bjc.psu.edu/events/calendar/2026/11), [Indiana](https://bjc.psu.edu/events/detail/psu-vs-indiana), [Hot Wheels](https://bjc.psu.edu/events/detail/hot-wheels-monster-trucks-live)
- The Spring Involvement Fair's January 12–13 schedule was not confirmed by the available current Student Affairs listing and is held out. The official Movin’ On festival page confirms April 30 at IM Fields, gates at 3:30 PM, end at 10:30 PM, and admission for ages 18+ with ID. The performance start is unlisted. The LineLeap page confirms the Holiday Crawl identity and date; its hours are shown only as an owner report and admission details need verification. [Student Affairs](https://studentaffairs.psu.edu/student-life/student-orgs/manage-org), [Movin' On](https://www.movinon.org/festival), [LineLeap](https://tickets.lineleap.com/venues/YSYsTazlgLCBKHmKuv48)
- The verified 2026 home football schedule is supplemented with the three posted 2027 home dates. The 2027 schedule shows kickoff times and the remainder of the conference schedule as pending. [2026 schedule](https://gopsusports.com/sports/football/schedule/season/2026), [2027 schedule](https://gopsusports.com/sports/football/schedule/season/2027)

## Production fixture removal

The former synthetic provider remains available to tests and explicitly enabled local development. The server checks development mode before honoring the fixture flag. The production browser suite starts with fixture and preview flags set, verifies the public API still serves only curated data, and verifies the private preview and both development routes return 404.

| Former production data | Isolation |
| --- | --- |
| 14 fictional event IDs from `data/fixtures/index.ts`, including the open-topic example | Unit and isolated browser fixtures |
| 10 discovery event IDs from `data/fixtures/discovery.ts` | Unit and isolated browser fixtures |
| 7 fictional exam IDs from `data/fixtures/index.ts` | Unit and isolated browser fixtures |
| 12 external scenarios and 2 fictional clusters from `data/fixtures/planning-context.ts` | Unit and isolated browser fixtures |
| 4 example organization IDs from `data/fixtures/index.ts` | Unit and isolated browser fixtures |
| Sample proposal and sample-date shortcuts | Explicit fixture-mode controls |

The published student and planner query path uses sourced registry entries and preserves the existing verified hosts and majors. Curated context records with unknown hours or no attendance audience remain outside precise overlap and preparation calculations. Weekly details list reported exams separately from the analytical commitment total. Missing exam records do not establish that a student has no exam.
