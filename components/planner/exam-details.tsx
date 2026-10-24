"use client";
import type { Exam, Major } from "../../lib/domain/models";
import { ACADEMIC_LEVELS } from "../../lib/domain/planning-audience";
import {
  academicExamTitle,
  sourceLabel,
  verificationLabel,
} from "../../lib/domain/source-labels";
import { DetailsDialog } from "../calendar/details-dialog";
import { examTimeLabel } from "../calendar/planner-events";
export function ExamDetails({
  exam,
  majors,
  onClose,
}: {
  exam: Exam;
  majors: Major[];
  onClose: () => void;
}) {
  return (
    <DetailsDialog
      triggerId={`exam:${exam.id}`}
      title={academicExamTitle(exam.courseId)}
      titleId="exam-detail-title"
      label="Exam details"
      onClose={onClose}
    >
      <p className="example-note">
        {exam.source.verification === "synthetic"
          ? "Fictional academic example; not an official exam schedule."
          : exam.source.verification === "unverified"
            ? "Unverified academic information. Confirm with the course organizer."
            : "Source marked verified. Confirm current details with the course organizer."}
      </p>
      <p className="detail-time">{examTimeLabel(exam)}</p>
      {!exam.timeKnown && (
        <p className="planner-warning">
          Time unknown. This is a date-level constraint, not a confirmed timed
          overlap. No start or end time has been assigned.
        </p>
      )}
      {!exam.relevantMajorIds.length && (
        <p className="planner-warning">
          Audience mapping unknown. This record is retained as an academic
          caution and contributes no numerical preparation to any selected major
          or academic level. Enrollment and affected groups are not established.
        </p>
      )}
      <dl className="event-facts">
        <div>
          <dt>Relevant majors</dt>
          <dd>
            {majors
              .filter((m) => exam.relevantMajorIds.includes(m.id))
              .map((m) => m.abbreviation)
              .join(", ") || "Not provided"}
          </dd>
        </div>
        <div>
          <dt>Typical academic levels (approximate)</dt>
          <dd>
            {exam.typicalAcademicLevels
              ?.map((level) => ACADEMIC_LEVELS[level])
              .join(", ") || "Unknown; conservatively included"}
            . Students outside the typical sequence remain relevant.
          </dd>
        </div>
        <div>
          <dt>Course sections</dt>
          <dd>
            {exam.sectionScope.join(", ") || "Section coverage not provided"}
          </dd>
        </div>
        <div>
          <dt>Academic term</dt>
          <dd>{exam.termId}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>
            {exam.source.url ? (
              <a href={exam.source.url} target="_blank" rel="noreferrer">
                {sourceLabel(exam.source)} (opens a new tab)
              </a>
            ) : (
              sourceLabel(exam.source)
            )}
            <span className="field-help">
              Verification: {verificationLabel(exam.source.verification)}
            </span>
          </dd>
        </div>
      </dl>
      <p className="field-help">
        Course-to-major relevance is approximate. Exam coverage may be
        incomplete; a missing record does not mean no exam is scheduled.
      </p>
    </DetailsDialog>
  );
}
