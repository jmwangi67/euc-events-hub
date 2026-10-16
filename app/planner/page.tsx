import type { Metadata } from "next";
import { OrganizationPlanner } from "../../components/planner/organization-planner";
import { getMajors, getOrganizations } from "../../lib/data/fixtures";
import { easternDate } from "../../lib/time/eastern";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "EUC Events Hub — Organization Planner",
  description:
    "Evaluate local scheduling proposals against fictional event and academic exam constraints.",
};
export default function PlannerPage() {
  return (
    <main id="main" className="application-main">
      <OrganizationPlanner
        majors={getMajors()}
        organizations={getOrganizations()}
        initialDate={easternDate(new Date().toISOString())}
      />
    </main>
  );
}
