import type { EventFilters } from "../../lib/data/fixtures";
import type { CalendarView } from "../../lib/domain/calendar-state";
import type { PlannerCalendarView } from "../../lib/domain/planner-calendar-state";
import type { Exam } from "../../lib/domain/models";
import type { Proposal } from "../../lib/domain/planning";
import type { PlanningAudience } from "../../lib/domain/planning-audience";
export type PlanningCalendarOptions = {
  audience: PlanningAudience;
  proposal: Proposal | null;
  showEvents: boolean;
  showUniversityEvents: boolean;
  showExams: boolean;
  showPsuWide: boolean;
  showCampusLocal: boolean;
  showNational: boolean;
  showDensity?: boolean;
  onExamSelect: (exam: Exam) => void;
  onProposalSelect: () => void;
};
type BaseProps = {
  /** Synthetic, development-only visual scenarios; never used by public routes. */
  previewItems?: import("@fullcalendar/core").EventInput[];
  date: string;
  filters: EventFilters;
  onDateChange: (date: string) => void;
  onEventSelect: (id: string) => void;
  onReset: () => void;
  mobile: boolean;
};
export type EventCalendarProps = BaseProps &
  (
    | {
        planning?: undefined;
        examReview?: {
          dataset: import("../../lib/exams/staging").StagedExamDataset;
          onSelect: (id: string, triggerId: string) => void;
        };
        view: CalendarView;
        onViewChange: (view: CalendarView) => void;
      }
    | {
        planning: PlanningCalendarOptions;
        examReview?: never;
        view: PlannerCalendarView;
        onViewChange: (view: PlannerCalendarView) => void;
      }
  );
