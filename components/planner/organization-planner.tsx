"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Major, Organization, Exam } from "../../lib/domain/models";
import type { CalendarView } from "../../lib/domain/calendar-state";
import {
  analyzeProposal,
  planningAudience,
  proposalSchema,
  type Proposal,
} from "../../lib/domain/planning";
import { getEventById } from "../../lib/data/fixtures";
import { getProposalContext } from "../../lib/data/planner";
import { easternDate } from "../../lib/time/eastern";
import {
  easternLocalCandidates,
  resolveEasternLocal,
  type LocalOccurrence,
} from "../../lib/time/eastern-local";
import { EVENT_CATEGORIES } from "../../lib/domain/event-categories";
import { EventCalendar } from "../calendar/event-calendar";
import { EventDetails } from "../calendar/event-details";
import { useCompactCalendar } from "../calendar/use-compact-calendar";
import { ConflictPanel } from "./conflict-panel";
import { ExamDetails } from "./exam-details";

type Draft = {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  category: string;
  startOccurrence: LocalOccurrence | "";
  endOccurrence: LocalOccurrence | "";
};
const emptyDraft = (date: string): Draft => ({
  title: "",
  startDate: date,
  startTime: "17:00",
  endDate: date,
  endTime: "18:00",
  category: "",
  startOccurrence: "",
  endOccurrence: "",
});
export function OrganizationPlanner({
  majors,
  organizations,
  initialDate,
}: {
  majors: Major[];
  organizations: Organization[];
  initialDate: string;
}) {
  const initialOrg =
    organizations.find((org) => org.defaultMajorIds.length) ?? organizations[0];
  const [organizationId, setOrganizationId] = useState(initialOrg.id);
  const [majorIds, setMajorIds] = useState(() => planningAudience(initialOrg));
  const [draft, setDraft] = useState(() => emptyDraft(initialDate));
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [date, setDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>("dayGridMonth");
  const [showEvents, setShowEvents] = useState(true);
  const [showExams, setShowExams] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const mobile = useCompactCalendar();
  const activeView = mobile && view !== "timeGridDay" ? "listMonth" : view;
  const selectedEvent = selectedId ? getEventById(selectedId) : undefined;
  const audienceLabel = majors
    .filter((m) => majorIds.includes(m.id))
    .map((m) => m.abbreviation)
    .join(", ");
  const organization = organizations.find((org) => org.id === organizationId)!;
  const filters = useMemo(
    () => ({ audience: { mode: "recommended" as const, majorIds } }),
    [majorIds],
  );
  const conflicts = useMemo(() => {
    if (!proposal) return [];
    const context = getProposalContext(proposal);
    return analyzeProposal(
      proposal,
      context.events,
      context.exams,
      organizations,
    );
  }, [proposal, organizations]);
  const focusProposal = useCallback(() => titleInput.current?.focus(), []);
  const restoreDisplay = useCallback(() => {
    setShowEvents(true);
    setShowExams(true);
  }, []);
  const planning = useMemo(
    () => ({
      majorIds,
      proposal,
      showEvents,
      showExams,
      onExamSelect: setSelectedExam,
      onProposalSelect: focusProposal,
    }),
    [majorIds, proposal, showEvents, showExams, focusProposal],
  );
  useEffect(() => {
    if (Object.keys(errors).length) errorSummary.current?.focus();
  }, [errors]);
  const updateDraft = (patch: Partial<Draft>) => {
    setDraft((current) => ({
      ...current,
      ...patch,
      ...("startDate" in patch || "startTime" in patch
        ? { startOccurrence: "" as const }
        : {}),
      ...("endDate" in patch || "endTime" in patch
        ? { endOccurrence: "" as const }
        : {}),
    }));
    setProposal(null);
    setErrors({});
  };
  const ambiguous = (endpoint: "start" | "end") => {
    try {
      return (
        easternLocalCandidates(
          draft[`${endpoint}Date`],
          draft[`${endpoint}Time`],
        ).length > 1
      );
    } catch {
      return false;
    }
  };
  function analyze(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!draft.title.trim()) nextErrors.title = "Enter a proposed event title.";
    if (!majorIds.length)
      nextErrors.audience = "Select at least one planning major.";
    let start = "",
      end = "";
    try {
      start = resolveEasternLocal(
        draft.startDate,
        draft.startTime,
        draft.startOccurrence || undefined,
      );
    } catch (error) {
      nextErrors.start = (error as Error).message;
    }
    try {
      end = resolveEasternLocal(
        draft.endDate,
        draft.endTime,
        draft.endOccurrence || undefined,
      );
    } catch (error) {
      nextErrors.end = (error as Error).message;
    }
    const result = proposalSchema.safeParse({
      title: draft.title,
      start,
      end,
      category: draft.category || undefined,
      majorIds,
    });
    if (start && end && !result.success)
      for (const issue of result.error.issues)
        nextErrors[
          issue.path[0] === "majorIds" ? "audience" : String(issue.path[0])
        ] = issue.message;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !result.success) {
      setProposal(null);
      return;
    }
    setProposal(result.data);
    setDate(easternDate(result.data.start));
  }
  function sample() {
    const org = organizations.find((org) => org.id === "example-process")!;
    setOrganizationId(org.id);
    setMajorIds(planningAudience(org));
    setDraft({
      ...emptyDraft("2026-10-21"),
      title: "Sample organization workshop",
      startTime: "16:30",
      endTime: "17:30",
      category: "technical-workshop",
    });
    setProposal(null);
    setErrors({});
    setDate("2026-10-21");
  }
  return (
    <>
      <div className="development-notice">
        <p>
          <strong>Synthetic planner prototype.</strong> Fictional events and
          exams only. Nothing is saved, approved, or submitted.
        </p>
        <button className="text-button" onClick={sample}>
          Load sample scenario
        </button>
      </div>
      <div className="page-heading">
        <p className="eyebrow">Organization planning</p>
        <h1>Find a time for your audience</h1>
        <p>
          Compare a local proposal with recorded event and academic constraints.
        </p>
      </div>
      <div className="planner-layout">
        <form
          className="proposal-form"
          onSubmit={analyze}
          noValidate
          aria-labelledby="proposal-title"
        >
          <h2 id="proposal-title">Your local scenario</h2>
          <p className="field-help">
            All input times are Eastern. Selecting an organization does not
            verify representation.
          </p>
          {Object.keys(errors).length > 0 && (
            <div
              className="planner-errors"
              role="alert"
              tabIndex={-1}
              ref={errorSummary}
            >
              <h3>Check the proposal</h3>
              <ul>
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          <label className="planner-field">
            Synthetic organization
            <select
              className="control"
              aria-label="Synthetic organization"
              value={organizationId}
              onChange={(e) => {
                const org = organizations.find(
                  (org) => org.id === e.target.value,
                )!;
                setOrganizationId(org.id);
                setMajorIds(planningAudience(org));
                setProposal(null);
                setErrors({});
              }}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset
            className="planning-audience"
            aria-describedby="audience-help audience-summary"
          >
            <legend>Planning audience</legend>
            <p className="field-help" id="audience-help">
              {organization.defaultMajorIds.length
                ? "Starts with the organization’s documented majors. Adjust for this proposal."
                : "No default audience is documented. Select the majors you intend to reach before analysis."}
            </p>
            {majors.map((major) => (
              <label className="choice" key={major.id}>
                <input
                  type="checkbox"
                  checked={majorIds.includes(major.id)}
                  onChange={() => {
                    setMajorIds((ids) =>
                      ids.includes(major.id)
                        ? ids.filter((id) => id !== major.id)
                        : [...ids, major.id],
                    );
                    setProposal(null);
                    setErrors({});
                  }}
                />
                {major.name} ({major.abbreviation})
              </label>
            ))}
            <p
              id="audience-summary"
              className="audience-summary"
              aria-live="polite"
            >
              Analyzing for:{" "}
              <strong>{audienceLabel || "Select a planning audience"}</strong>
            </p>
          </fieldset>
          <label className="planner-field">
            Proposed event title
            <input
              ref={titleInput}
              className="control"
              value={draft.title}
              maxLength={160}
              required
              aria-invalid={!!errors.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
            />
          </label>
          {(["start", "end"] as const).map((endpoint) => (
            <fieldset
              className="proposal-endpoint"
              key={endpoint}
              aria-describedby={
                errors[endpoint] ? `${endpoint}-error` : undefined
              }
            >
              <legend>{endpoint === "start" ? "Starts" : "Ends"}</legend>
              <div className="proposal-date-time">
                <label className="planner-field">
                  {endpoint === "start" ? "Start" : "End"} date
                  <input
                    className="control"
                    type="date"
                    required
                    value={draft[`${endpoint}Date`]}
                    aria-invalid={!!errors[endpoint]}
                    aria-describedby={
                      errors[endpoint] ? `${endpoint}-error` : undefined
                    }
                    onChange={(e) =>
                      updateDraft({ [`${endpoint}Date`]: e.target.value })
                    }
                  />
                </label>
                <label className="planner-field">
                  {endpoint === "start" ? "Start" : "End"} time
                  <input
                    className="control"
                    type="time"
                    required
                    value={draft[`${endpoint}Time`]}
                    aria-invalid={!!errors[endpoint]}
                    aria-describedby={
                      errors[endpoint] ? `${endpoint}-error` : undefined
                    }
                    onChange={(e) =>
                      updateDraft({ [`${endpoint}Time`]: e.target.value })
                    }
                  />
                </label>
              </div>
              {ambiguous(endpoint) && (
                <label className="planner-field">
                  {endpoint === "start" ? "Start" : "End"} repeated-time
                  occurrence
                  <select
                    aria-label={`${endpoint === "start" ? "Start" : "End"} repeated-time occurrence`}
                    aria-describedby={`${endpoint}-fold-help`}
                    className="control"
                    value={draft[`${endpoint}Occurrence`]}
                    onChange={(e) =>
                      updateDraft({
                        [`${endpoint}Occurrence`]: e.target.value as
                          LocalOccurrence | "",
                      })
                    }
                  >
                    <option value="">Choose an occurrence</option>
                    <option value="first">First occurrence</option>
                    <option value="second">
                      Second occurrence (one hour later)
                    </option>
                  </select>
                  <span className="field-help" id={`${endpoint}-fold-help`}>
                    The Eastern clock repeats this time during the fall
                    transition.
                  </span>
                </label>
              )}
              {errors[endpoint] && (
                <p className="field-error" id={`${endpoint}-error`}>
                  {errors[endpoint]}
                </p>
              )}
            </fieldset>
          ))}
          <label className="planner-field">
            Category (optional)
            <select
              className="control"
              aria-label="Category (optional)"
              value={draft.category}
              onChange={(e) => updateDraft({ category: e.target.value })}
            >
              <option value="">Not specified</option>
              {Object.entries(EVENT_CATEGORIES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="control planner-analyze" type="submit">
            Analyze proposal
          </button>
          <p className="field-help">
            Editing the proposal or its audience clears the previous analysis.
            For overnight events, set the following end date.
          </p>
        </form>
        <div className="planner-workspace">
          <ConflictPanel
            proposal={proposal}
            conflicts={conflicts}
            majors={majors}
            onEventSelect={setSelectedId}
            onExamSelect={setSelectedExam}
          />
          <section className="planner-context" aria-labelledby="context-title">
            <div className="planner-section-heading">
              <div>
                <p className="eyebrow">Planning context</p>
                <h2 id="context-title">Events and academic exams</h2>
              </div>
            </div>
            <fieldset className="planner-display">
              <legend>Calendar display only</legend>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={showEvents}
                  onChange={(e) => setShowEvents(e.target.checked)}
                />
                Show published events
              </label>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={showExams}
                  onChange={(e) => setShowExams(e.target.checked)}
                />
                Show academic exams
              </label>
            </fieldset>
            <p className="field-help">
              Visibility and calendar navigation do not change the proposal’s
              analysis. Academic exams use a distinct border and explicit
              labels; unknown times remain date-level entries.
            </p>
            <EventCalendar
              date={date}
              view={activeView}
              filters={filters}
              mobile={mobile}
              onDateChange={setDate}
              onViewChange={setView}
              onEventSelect={setSelectedId}
              onReset={restoreDisplay}
              planning={planning}
            />
          </section>
        </div>
      </div>
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          majors={majors}
          organizations={organizations}
          onClose={() => setSelectedId(null)}
        />
      )}
      {selectedExam && (
        <ExamDetails
          exam={selectedExam}
          majors={majors}
          onClose={() => setSelectedExam(null)}
        />
      )}
    </>
  );
}
