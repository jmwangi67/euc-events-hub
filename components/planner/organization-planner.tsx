"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type {
  Major,
  Organization,
  Exam,
  AcademicLevel,
} from "../../lib/domain/models";
import type { PlannerCalendarView } from "../../lib/domain/planner-calendar-state";
import {
  planningAudience,
  proposalSchema,
  type Proposal,
} from "../../lib/domain/planning";
import { getEventById } from "../../lib/data/fixtures";
import { studentOrganizations } from "../../lib/domain/hosting";
import { getProposalIntelligenceContext } from "../../lib/data/planner";
import { analyzePlanningProposal } from "../../lib/domain/proposal-analysis";
import { ProposalFactors } from "./proposal-factors";
import { SelectionDropdown } from "../filters/selection-dropdown";
import { plannerControlCount } from "../../lib/domain/planner-control-summary";
import { AudienceControls } from "./audience-controls";
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
import {
  ALL_LEVELS,
  ACADEMIC_LEVELS,
} from "../../lib/domain/planning-audience";
import { getOrganizationClusters } from "../../lib/data/weekly-planning";
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
  const studentOrgs = useMemo(
    () => studentOrganizations(organizations),
    [organizations],
  );
  const initialOrg =
    studentOrgs.find((org) => org.defaultMajorIds.length) ?? studentOrgs[0];
  const [organizationId, setOrganizationId] = useState(initialOrg.id);
  const [majorIds, setMajorIds] = useState(() => planningAudience(initialOrg));
  const [academicLevels, setAcademicLevels] = useState<AcademicLevel[]>([
    ...ALL_LEVELS,
  ]);
  const [clusterIds, setClusterIds] = useState<string[]>([]);
  const clusters = useMemo(() => getOrganizationClusters(), []);
  const audience = useMemo(
    () => ({ majorIds, academicLevels, clusterIds }),
    [majorIds, academicLevels, clusterIds],
  );
  const [draft, setDraft] = useState(() => emptyDraft(initialDate));
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [date, setDate] = useState(initialDate);
  const [view, setView] = useState<PlannerCalendarView>("dayGridMonth");
  const [showEvents, setShowEvents] = useState(true);
  const [showUniversityEvents, setShowUniversityEvents] = useState(true);
  const [showExams, setShowExams] = useState(true);
  const [showPsuWide, setShowPsuWide] = useState(true);
  const [showCampusLocal, setShowCampusLocal] = useState(true);
  const [showNational, setShowNational] = useState(true);
  const [showDensity, setShowDensity] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const mobile = useCompactCalendar();
  const activeView = mobile && view !== "timeGridDay" ? "listMonth" : view;
  const selectedEvent = selectedId ? getEventById(selectedId) : undefined;
  const organization = studentOrgs.find((org) => org.id === organizationId)!;
  const filters = useMemo(
    () => ({ audience: { mode: "recommended" as const, majorIds } }),
    [majorIds],
  );
  const proposalContext = useMemo(
    () =>
      proposal
        ? { ...getProposalIntelligenceContext(proposal), organizations }
        : null,
    [proposal, organizations],
  );
  const proposalAnalysis = useMemo(
    () =>
      proposal && proposalContext
        ? analyzePlanningProposal(proposal, proposalContext)
        : null,
    [proposal, proposalContext],
  );
  const focusProposal = useCallback(() => titleInput.current?.focus(), []);
  const restoreDisplay = useCallback(() => {
    setShowEvents(true);
    setShowUniversityEvents(true);
    setShowExams(true);
    setShowPsuWide(true);
    setShowCampusLocal(true);
    setShowNational(true);
  }, []);
  const planning = useMemo(
    () => ({
      audience,
      proposal,
      showEvents,
      showUniversityEvents,
      showExams,
      showPsuWide,
      showCampusLocal,
      showNational,
      showDensity,
      onExamSelect: setSelectedExam,
      onProposalSelect: focusProposal,
    }),
    [
      audience,
      proposal,
      showEvents,
      showUniversityEvents,
      showExams,
      showPsuWide,
      showCampusLocal,
      showNational,
      showDensity,
      focusProposal,
    ],
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
    if (!academicLevels.length)
      nextErrors.levels = "Select at least one academic level.";
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
      academicLevels,
      clusterIds,
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
    const org = studentOrgs.find((org) => org.id === "example-process")!;
    setOrganizationId(org.id);
    setMajorIds(planningAudience(org));
    setAcademicLevels([...ALL_LEVELS]);
    setClusterIds([]);
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
  const activeFilterCount = plannerControlCount(
    audience,
    [
      showEvents,
      showUniversityEvents,
      showExams,
      showPsuWide,
      showCampusLocal,
      showNational,
    ],
    showDensity,
  );
  return (
    <>
      <div className="development-notice">
        <p>
          <strong>Demo planner — not a real schedule.</strong> Fictional events
          and exams only. Nothing is saved, approved, or submitted.
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
      <details className="planner-controls" open>
        <summary>
          <strong>Filters &amp; Audience</strong>
          <span className="planner-filter-count">
            {activeFilterCount} active{" "}
            {activeFilterCount === 1 ? "filter" : "filters"}
          </span>
          <span className="planner-collapsed-summary">
            {majorIds
              .map(
                (id) =>
                  majors.find((major) => major.id === id)?.abbreviation ?? id,
              )
              .join(", ") || "No majors"}{" "}
            ·{" "}
            {academicLevels.length === ALL_LEVELS.length
              ? "All years"
              : academicLevels
                  .map((level) => ACADEMIC_LEVELS[level])
                  .join(", ") || "No academic years"}{" "}
            · {clusterIds.length} analytical clusters
            {clusterIds.length > 0
              ? ` (${clusters
                  .filter((cluster) => clusterIds.includes(cluster.id))
                  .map((cluster) => cluster.name)
                  .join(", ")})`
              : ""}{" "}
            ·{" "}
            {
              [
                showEvents,
                showUniversityEvents,
                showExams,
                showPsuWide,
                showCampusLocal,
                showNational,
              ].filter((value) => !value).length
            }{" "}
            hidden calendar layers
            {[
              showEvents,
              showUniversityEvents,
              showExams,
              showPsuWide,
              showCampusLocal,
              showNational,
            ].some((value) => !value)
              ? ` (${[
                  ["Published events", showEvents],
                  ["University Events", showUniversityEvents],
                  ["Academic exams", showExams],
                  ["PSU-wide", showPsuWide],
                  ["Local", showCampusLocal],
                  ["National", showNational],
                ]
                  .filter(([, visible]) => !visible)
                  .map(([label]) => label)
                  .join(", ")})`
              : ""}
            {showDensity ? " · Density on" : ""}. Proposal host:{" "}
            {organization.name}.
          </span>
        </summary>
        <p className="field-help">
          Audience selections affect analysis. Calendar display controls affect
          visibility only. Proposal host identifies who is planning; it does not
          filter calendar hosts.
        </p>
        <div className="planner-controls-grid">
          <label className="planner-field">
            Example organization
            <select
              className="control"
              aria-label="Example organization"
              value={organizationId}
              onChange={(e) => {
                const org = studentOrgs.find(
                  (org) => org.id === e.target.value,
                )!;
                setOrganizationId(org.id);
                setMajorIds(planningAudience(org));
                setProposal(null);
                setErrors({});
              }}
            >
              {studentOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <span className="field-help">
              Student organizations only. University units remain event hosts.
            </span>
          </label>
          <AudienceControls
            majors={majors}
            organization={organization}
            clusters={clusters}
            selection={{ majorIds, academicLevels, clusterIds }}
            onChange={(patch) => {
              if (patch.majorIds) setMajorIds(patch.majorIds);
              if (patch.academicLevels) setAcademicLevels(patch.academicLevels);
              if (patch.clusterIds) setClusterIds(patch.clusterIds);
              setProposal(null);
              setErrors({});
            }}
          />
          <SelectionDropdown
            title="Calendar layers"
            summary={`${[showEvents, showEvents && showUniversityEvents, showExams, showPsuWide, showCampusLocal, showNational].filter(Boolean).length} visible${showDensity ? " · density on" : ""}`}
          >
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
                  checked={showUniversityEvents}
                  disabled={!showEvents}
                  onChange={(e) => setShowUniversityEvents(e.target.checked)}
                />
                Show University Events
              </label>
              <p className="field-help">
                University-hosted and co-hosted published events. Published
                events must also be enabled. This does not change analysis.
              </p>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={showExams}
                  onChange={(e) => setShowExams(e.target.checked)}
                />
                Show academic exams
              </label>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={showPsuWide}
                  onChange={(e) => setShowPsuWide(e.target.checked)}
                />
                Show PSU-wide commitments
              </label>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={showCampusLocal}
                  onChange={(e) => setShowCampusLocal(e.target.checked)}
                />
                Show Local commitments
              </label>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={showNational}
                  onChange={(e) => setShowNational(e.target.checked)}
                />
                Show national commitments
              </label>
            </fieldset>
            <label className="choice density-toggle">
              <input
                type="checkbox"
                checked={showDensity}
                onChange={(e) => setShowDensity(e.target.checked)}
              />
              Show scheduling density
            </label>
            <p className="field-help">
              Density shows factual non-exam overlaps for the selected audience,
              not attendance pressure. Turning the overlay off leaves scheduling
              cautions and analysis intact.
            </p>
            <p className="field-help">
              Visibility and calendar navigation do not change the proposal’s
              analysis. Academic exams use a distinct border and explicit
              labels; unknown times remain date-level entries.
            </p>
          </SelectionDropdown>
        </div>
      </details>
      <div className="planner-layout">
        <details className="proposal-disclosure" open>
          <summary>Local proposal · Unsaved scenario</summary>
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
        </details>
        <div className="planner-workspace">
          <ConflictPanel
            proposal={proposal}
            conflicts={proposalAnalysis?.conflicts ?? []}
            majors={majors}
            onEventSelect={setSelectedId}
            onExamSelect={setSelectedExam}
          />
          {proposalAnalysis && proposalContext && (
            <ProposalFactors
              analysis={proposalAnalysis}
              context={proposalContext}
            />
          )}
          <section className="planner-context" aria-labelledby="context-title">
            <div className="planner-section-heading">
              <div>
                <p className="eyebrow">Planning context</p>
                <h2 id="context-title">Events and academic exams</h2>
              </div>
            </div>
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
          planningClusters={clusters}
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
