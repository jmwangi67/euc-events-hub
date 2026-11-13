import { StudentCalendar } from "../components/calendar/student-calendar";
import { browserFixturesEnabled } from "../lib/server/data/browser-fixtures";
import { loadReferenceData } from "../lib/server/data/queries";
import { studentOrganizations } from "../lib/domain/hosting";
import { parseCalendarState } from "../lib/domain/calendar-state";
import { easternDate } from "../lib/time/eastern";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (value?.length) params.set(key, value[0]);
  }
  const demo = browserFixturesEnabled();
  const { majors, organizations, clusters } = await (
    demo
      ? (await import("../lib/server/data/browser-fixture-queries"))
          .loadReferenceData
      : loadReferenceData
  )();
  const state = parseCalendarState(
    params,
    easternDate(new Date().toISOString()),
    {
      majorIds: majors.map((major) => major.id),
      organizationIds: studentOrganizations(organizations).map((org) => org.id),
      clusterIds: clusters.map((cluster) => cluster.id),
    },
  );
  return (
    <main id="main" className="application-main">
      <StudentCalendar
        initialState={state}
        demo={demo}
        clusters={clusters}
        majors={majors}
        organizations={organizations}
      />
    </main>
  );
}
