"use client";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { EventCalendar } from "../calendar/event-calendar";
import { DetailsDialog } from "../calendar/details-dialog";
import { useCompactCalendar } from "../calendar/use-compact-calendar";
import { preparationEligibility } from "../../lib/exams/canonical";
import {
  examHasConflict,
  possibleDates,
  reportedDates,
  type StagedExamDataset,
} from "../../lib/exams/staging";
import { formatAllDayDate, formatEventTime } from "../../lib/time/eastern";
import type { CalendarView } from "../../lib/domain/calendar-state";
const reviewFilters = {};

export function ExamReview({
  dataset,
  synthetic,
  initialDate,
}: {
  dataset: StagedExamDataset;
  synthetic: boolean;
  initialDate: string;
}) {
  const [date, setDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>("listMonth");
  const [selection, setSelection] = useState<{
    id: string;
    triggerId: string;
  } | null>(null);
  const mobile = useCompactCalendar();
  const onSelect = useCallback(
    (id: string, triggerId: string) => setSelection({ id, triggerId }),
    [],
  );
  const review = useMemo(() => ({ dataset, onSelect }), [dataset, onSelect]);
  const selected = dataset.exams.find((exam) => exam.id === selection?.id);
  const eligibility = selected
    ? preparationEligibility(selected, dataset)
    : null;
  return (
    <>
      <div className="development-notice">
        <p>
          <strong>Private exam data preview — unverified</strong>
          <br />
          Local review only. Not an official published schedule.{" "}
          {synthetic
            ? "All records in this view are invented synthetic test data."
            : "Source-reported records are not independently verified or authorized for publication."}
        </p>
      </div>
      <div className="page-heading">
        <p className="eyebrow">Academic dataset review</p>
        <h1>Review staged examinations</h1>
        <p>
          {dataset.exams.length} canonical exam occurrences · {dataset.termId}.
          Date options are one exam, not separate exams or assigned student
          appointments.
        </p>
      </div>
      <nav className="exam-review-switch" aria-label="Exam dataset">
        <Link className="control" href="/planner">
          Fictional demonstration planner
        </Link>
        <span aria-current="page">
          {synthetic
            ? "Invented review test dataset"
            : "Private staging dataset"}
        </span>
      </nav>
      <p className="field-help">
        Review-only calendar. No staged data is added to the public student
        calendar, preparation model, Other Scheduling Constraints, or non-exam
        density. Displayed date options do not establish all-day occupancy.
      </p>
      <EventCalendar
        date={date}
        view={mobile && view !== "timeGridDay" ? "listMonth" : view}
        mobile={mobile}
        filters={reviewFilters}
        examReview={review}
        onDateChange={setDate}
        onViewChange={setView}
        onEventSelect={() => {}}
        onReset={() => setDate(initialDate)}
      />
      <details className="exam-review-notes">
        <summary>Dataset source notes and publication boundaries</summary>
        <p>
          Source confirmation, independent verification, audience review and
          publication authorization are separate. This development-only view
          performs no publication or approval.
        </p>
        <ul>
          {dataset.sourceNotes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </details>
      {selected && selection && (
        <DetailsDialog
          triggerId={selection.triggerId}
          title={`Academic Exam ${[...new Set(selected.claims.map((claim) => claim.courseId))].join(" / ")}`}
          titleId="staged-exam-title"
          label="Exam review details"
          onClose={() => setSelection(null)}
        >
          <p className="development-notice">
            Private staging review — not an official published schedule.
          </p>
          <p>
            Canonical occurrence: {selected.id}. {selected.claims.length}{" "}
            retained source claim{selected.claims.length === 1 ? "" : "s"}.
            {examHasConflict(selected)
              ? " Conflicting source information requires reconciliation."
              : ""}
          </p>
          {selected.claims.map((claim, i) => {
            const source = dataset.sources.find(
              (item) => item.id === claim.sourceId,
            )!;
            return (
              <section className="exam-review-claim" key={i}>
                <h3>
                  Source claim {i + 1}: {claim.courseId}
                </h3>
                <dl className="event-facts">
                  <div>
                    <dt>Term / designation</dt>
                    <dd>
                      {claim.termId} ·{" "}
                      {claim.designation ?? "Designation not supplied"}
                    </dd>
                  </div>
                  <div>
                    <dt>Reported dates</dt>
                    <dd>
                      {reportedDates(claim.timing)
                        .map(formatAllDayDate)
                        .join("; ")}
                    </dd>
                  </div>
                  {possibleDates(claim.timing).length > 0 && (
                    <div>
                      <dt>Additional possible dates</dt>
                      <dd>
                        <strong>Possible only — not scheduled: </strong>
                        {possibleDates(claim.timing)
                          .map(formatAllDayDate)
                          .join("; ")}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Timing</dt>
                    <dd>
                      {claim.timing.kind === "timed" ? (
                        <>
                          {formatEventTime({
                            allDay: false,
                            start: claim.timing.start,
                            end: claim.timing.end,
                          })}
                          <span className="field-help">
                            {claim.timing.basis === "source-default"
                              ? "Source-wide timetable default; not course-specific time verification."
                              : "Explicit source-reported hours."}{" "}
                            {claim.timing.basisNote}
                          </span>
                        </>
                      ) : (
                        "Testing window — individual exam time unknown. No appointment date or hour is assigned."
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Source status</dt>
                    <dd>
                      {claim.sourceStatus.replaceAll("-", " ")} ·{" "}
                      {source.independentlyVerified
                        ? "Source marked independently verified"
                        : "Not independently verified"}
                    </dd>
                  </div>
                  <div>
                    <dt>Publication / review</dt>
                    <dd>
                      {claim.publicationStatus.replaceAll("-", " ")} · Planner
                      permission:{" "}
                      {source.permissions.planner ? "recorded" : "not granted"}{" "}
                      · Public permission:{" "}
                      {source.permissions.public ? "recorded" : "not granted"}
                    </dd>
                  </div>
                  <div>
                    <dt>Sections</dt>
                    <dd>
                      {claim.sections?.join(", ") || "Unknown; not supplied"}
                    </dd>
                  </div>
                  <div>
                    <dt>Audience relevance</dt>
                    <dd>
                      {claim.audience.reviewed
                        ? `Reviewed majors: ${claim.audience.majorIds.join(", ") || "none"}; academic years: ${claim.audience.academicLevels.join(", ") || "none"}`
                        : "Unreviewed. No major, enrollment or academic-year eligibility is inferred."}
                    </dd>
                  </div>
                  <div>
                    <dt>Source / batch</dt>
                    <dd>
                      {source.label}
                      <span className="field-help">
                        {claim.sourceReference} · Source ID: {claim.sourceId} ·
                        Batch: {claim.importBatchId}
                      </span>
                      {claim.sourceSection && (
                        <span className="field-help">
                          Source section: {claim.sourceSection}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
                <ul>
                  {claim.notes.map((note, j) => (
                    <li key={j}>{note}</li>
                  ))}
                </ul>
              </section>
            );
          })}
          <h3>Preparation eligibility</h3>
          <p>
            {eligibility?.eligible
              ? "Compatible with the existing model after the recorded reviews. This preview still performs no numerical analysis or publication."
              : "Not eligible for numerical preparation."}
          </p>
          <ul>
            {eligibility?.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </DetailsDialog>
      )}
    </>
  );
}
