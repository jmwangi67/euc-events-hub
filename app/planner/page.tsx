import type { Metadata } from "next";
import { OrganizationPlanner } from "../../components/planner/organization-planner";
import { loadReferenceData } from "../../lib/server/data/queries";
import { easternDate } from "../../lib/time/eastern";
import { headers } from "next/headers";
import Link from "next/link";
import { privateExamPreviewAllowed } from "../../lib/exams/preview-policy";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "EUC Events Hub — Organization Planner",
  description:
    "Evaluate local scheduling proposals against fictional event and academic exam constraints.",
};
export default async function PlannerPage() {
  const { majors, organizations, clusters } = await loadReferenceData();
  const previewEnabled = privateExamPreviewAllowed(
    process.env,
    await headers(),
  );
  return (
    <main id="main" className="application-main">
      {previewEnabled && (
        <p>
          <Link className="control" href="/planner/exam-preview">
            Open private academic dataset review
          </Link>
        </p>
      )}
      <OrganizationPlanner
        majors={majors}
        organizations={organizations}
        clusters={clusters}
        initialDate={easternDate(new Date().toISOString())}
      />
    </main>
  );
}
