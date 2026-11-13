import type { Metadata } from "next";
import { OrganizationPlanner } from "../../components/planner/organization-planner";
import { browserFixturesEnabled } from "../../lib/server/data/browser-fixtures";
import { loadReferenceData } from "../../lib/server/data/queries";
import { easternDate } from "../../lib/time/eastern";
import { dateOnlySchema } from "../../lib/domain/models";
import { headers } from "next/headers";
import Link from "next/link";
import { privateExamPreviewAllowed } from "../../lib/exams/preview-policy";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "EUC Events Hub — Organization Planner",
  description:
    "Compare local scheduling proposals with published events and academic context.",
};
export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const requested = dateOnlySchema.safeParse((await searchParams).date);
  const demo = browserFixturesEnabled();
  const { majors, organizations, clusters } = await (
    demo
      ? (await import("../../lib/server/data/browser-fixture-queries"))
          .loadReferenceData
      : loadReferenceData
  )();
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
        demo={demo}
        majors={majors}
        organizations={organizations}
        clusters={clusters}
        initialDate={
          requested.success
            ? requested.data
            : easternDate(new Date().toISOString())
        }
      />
    </main>
  );
}
