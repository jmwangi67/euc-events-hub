import type { Major, Event, Exam } from "../../lib/domain/models";
import type { PlanningConflict, Proposal } from "../../lib/domain/planning";
import { formatEventTime } from "../../lib/time/eastern";
import { examTimeLabel } from "../calendar/planner-events";

type Props = {
  proposal: Proposal | null;
  conflicts: PlanningConflict[];
  majors: Major[];
  onEventSelect: (id: string) => void;
  onExamSelect: (exam: Exam) => void;
};
export function ConflictPanel({
  proposal,
  conflicts,
  majors,
  onEventSelect,
  onExamSelect,
}: Props) {
  const exact = conflicts.filter((c) => c.kind !== "exam-date-warning").length;
  const warnings = conflicts.length - exact;
  return (
    <section className="conflict-panel" aria-labelledby="conflicts-title">
      <div className="planner-section-heading">
        <div>
          <p className="eyebrow">Scheduling analysis</p>
          <h2 id="conflicts-title">Recorded constraints</h2>
        </div>
        {proposal && (
          <p className="planner-count" role="status">
            {exact} interval {exact === 1 ? "overlap" : "overlaps"} · {warnings}{" "}
            date-level {warnings === 1 ? "warning" : "warnings"}
          </p>
        )}
      </div>
      {!proposal ? (
        <p className="planner-placeholder">
          Enter your local scenario and select Analyze proposal to check the
          available sample data.
        </p>
      ) : (
        <>
          <p className="analysis-proposal">
            <strong>{proposal.title}</strong>
            <span>{formatEventTime({ allDay: false, ...proposal })}</span>
          </p>
          {!conflicts.length ? (
            <p role="status" className="planner-placeholder">
              No conflicts found in the available sample data. This does not
              mean the date is free; coverage may be incomplete.
            </p>
          ) : (
            <ul className="conflict-list">
              {conflicts.map((conflict) => {
                const event =
                  conflict.kind === "event-overlap"
                    ? (conflict.record as Event)
                    : null;
                const exam = event ? null : (conflict.record as Exam);
                return (
                  <li
                    key={conflict.id}
                    className={`conflict-item ${conflict.kind === "exam-date-warning" ? "date-warning" : "interval-overlap"}`}
                  >
                    <p className="constraint-kind">
                      {event
                        ? event.allDay
                          ? "Recorded all-day interval overlap"
                          : "Known-time event overlap"
                        : exam?.timeKnown
                          ? "Known-time academic exam overlap"
                          : "Date-level academic warning · Time unknown"}
                    </p>
                    <h3>
                      <button
                        className="constraint-title"
                        data-calendar-event-id={event?.id ?? `exam:${exam!.id}`}
                        onClick={() =>
                          event ? onEventSelect(event.id) : onExamSelect(exam!)
                        }
                      >
                        {event?.title ?? `Academic exam: ${exam!.courseId}`}
                      </button>
                    </h3>
                    <p className="constraint-time">
                      {event ? formatEventTime(event) : examTimeLabel(exam!)}
                    </p>
                    <p>{conflict.reason}</p>
                    <p>
                      <strong>Relevant majors:</strong>{" "}
                      {majors
                        .filter((m) => conflict.majorIds.includes(m.id))
                        .map((m) => m.abbreviation)
                        .join(", ")}
                    </p>
                    {!event && !exam!.timeKnown && (
                      <p className="constraint-uncertainty">
                        Only the exam date is known. A timed conflict cannot be
                        confirmed.
                      </p>
                    )}
                    {event?.targeting === "inherited" && (
                      <p className="constraint-uncertainty">
                        The host audience is inferred; actual attendance is
                        unknown.
                      </p>
                    )}
                    {exam && !exam.sectionScope.length && (
                      <p className="constraint-uncertainty">
                        Section coverage has not been provided.
                      </p>
                    )}
                    <p className="constraint-source">
                      Source:{" "}
                      {conflict.record.source.url ? (
                        <a
                          href={conflict.record.source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {conflict.record.source.label} (opens a new tab)
                        </a>
                      ) : (
                        conflict.record.source.label
                      )}{" "}
                      · Verification: {conflict.record.source.verification}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <p className="planner-coverage">
        Exam coverage and course-to-major mappings are incomplete. Unclassified
        events are not assumed relevant. These records describe possible
        scheduling constraints, not attendance predictions or a reservation.
      </p>
    </section>
  );
}
