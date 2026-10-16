import { StudentCalendar } from "../components/calendar/student-calendar";
import { getMajors, getOrganizations } from "../lib/data/fixtures";
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
  const majors = getMajors();
  const organizations = getOrganizations();
  const state = parseCalendarState(
    params,
    easternDate(new Date().toISOString()),
    {
      majorIds: majors.map((major) => major.id),
      organizationIds: organizations.map((org) => org.id),
    },
  );
  return (
    <main id="main" className="application-main">
      <StudentCalendar
        initialState={state}
        majors={majors}
        organizations={organizations}
      />
    </main>
  );
}
