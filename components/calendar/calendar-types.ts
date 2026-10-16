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
  showExams: boolean;
  showPsuWide: boolean;
  showCampusLocal: boolean;
  showNational: boolean;
  onExamSelect: (exam: Exam) => void;
  onProposalSelect: () => void;
};
type BaseProps = {
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
        view: CalendarView;
        onViewChange: (view: CalendarView) => void;
      }
    | {
        planning: PlanningCalendarOptions;
        view: PlannerCalendarView;
        onViewChange: (view: PlannerCalendarView) => void;
      }
  );
