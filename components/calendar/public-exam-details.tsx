import type { StagedExam, StagedExamDataset } from "../../lib/exams/staging";
import {
  examHasConflict,
  possibleDates,
  reportedDates,
} from "../../lib/exams/staging";
import { formatAllDayDate, formatEventTime } from "../../lib/time/eastern";
import { DetailsDialog } from "./details-dialog";

const statuses = {
  confirmed: "Confirmed by source",
  "reported-unverified": "Source-reported, not independently verified",
  "requested-unapproved": "Tentative · Requested, not approved",
  conflicting: "Conflicting source information",
} as const;

export function PublicExamDetails({
  exam,
  dataset,
  triggerId,
  onClose,
}: {
  exam: StagedExam;
  dataset: StagedExamDataset;
  triggerId: string;
  onClose: () => void;
}) {
  return (
    <DetailsDialog
      triggerId={triggerId}
      titleId="public-exam-title"
      label="Exam details"
      title={`Academic Exam ${[...new Set(exam.claims.map((claim) => claim.courseId))].join(" / ")}`}
      onClose={onClose}
    >
      <p>
        Fall 2026 schedule pilot. Date options belong to one exam occurrence.
      </p>
      {examHasConflict(exam) && <p>Conflicting source information.</p>}
      {exam.claims.map((claim, index) => {
        const source = dataset.sources.find(
          (item) => item.id === claim.sourceId,
        );
        const possible = possibleDates(claim.timing);
        return (
          <section key={index} className="exam-review-claim">
            <dl className="event-facts">
              <div>
                <dt>Status</dt>
                <dd>{statuses[claim.sourceStatus]}</dd>
              </div>
              {claim.designation && (
                <div>
                  <dt>Exam designation</dt>
                  <dd>{claim.designation}</dd>
                </div>
              )}
              <div>
                <dt>
                  {claim.timing.kind === "date-options" ||
                  claim.timing.kind === "date-window"
                    ? "Alternative testing dates"
                    : "Reported date"}
                </dt>
                <dd>
                  {reportedDates(claim.timing).map(formatAllDayDate).join(", ")}
                </dd>
              </div>
              {possible.length > 0 && (
                <div>
                  <dt>Possible additional date</dt>
                  <dd>
                    {possible.map(formatAllDayDate).join(", ")} · Unscheduled
                  </dd>
                </div>
              )}
              <div>
                <dt>Time</dt>
                <dd>
                  {claim.timing.kind === "timed" ? (
                    <>
                      {formatEventTime({
                        allDay: false,
                        start: claim.timing.start,
                        end: claim.timing.end,
                      })}
                      {claim.timing.basis === "source-default" &&
                        " · Source-wide default, course-specific time unverified"}
                    </>
                  ) : (
                    "Time unknown. No individual appointment date or hour supplied."
                  )}
                </dd>
              </div>
              <div>
                <dt>Sections and audience</dt>
                <dd>Sections, major relevance and academic year unknown.</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  {source?.label} · {claim.sourceReference}
                </dd>
              </div>
            </dl>
          </section>
        );
      })}
      <p>These source claims are excluded from numerical exam preparation.</p>
    </DetailsDialog>
  );
}
