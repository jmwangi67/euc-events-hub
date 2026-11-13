import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  loadReferenceData,
  readCalendar,
  readEvent,
  readPlanningContext,
} from "./queries";
import { possibleDates, reportedDates } from "../../exams/staging";

const window = { start: "2026-08-01", end: "2027-10-01" };

it("publishes one occurrence per reviewed exam and no private source metadata", async () => {
  const { publicExams, events, externalEvents } = await readCalendar({
    window,
  });
  const claims = publicExams!.exams.flatMap((item) => item.claims);
  expect(new Set(publicExams!.exams.map((item) => item.id)).size).toBe(84);
  expect(new Set(claims.map((claim) => claim.courseId)).size).toBe(32);
  expect(claims.flatMap((claim) => reportedDates(claim.timing))).toHaveLength(
    98,
  );
  expect(claims.flatMap((claim) => possibleDates(claim.timing))).toHaveLength(
    1,
  );
  expect(
    claims.filter((claim) => claim.sourceStatus === "requested-unapproved"),
  ).toHaveLength(4);
  expect(
    claims.every(
      (claim) =>
        claim.sections === null &&
        !claim.audience.reviewed &&
        claim.publicationStatus === "approved-for-public",
    ),
  ).toBe(true);
  expect(
    publicExams!.sources.every(
      (source) =>
        !source.checksum &&
        !source.independentlyVerified &&
        !source.notes.length,
    ),
  ).toBe(true);
  expect(publicExams!.sourceNotes).toEqual([]);
  expect(
    [...events, ...externalEvents].every(
      (item) => item.source.verification !== "synthetic",
    ),
  ).toBe(true);
  expect(new Set([...events, ...externalEvents].map(({ id }) => id)).size).toBe(
    events.length + externalEvents.length,
  );
  const refs = await loadReferenceData();
  expect(
    refs.organizations.every((org) => !org.id.startsWith("example-")),
  ).toBe(true);
  expect(await readEvent({ id: "example-welcome" })).toEqual({ event: null });
});

it("keeps eligible preparation and non-exam calculations independent from provisional display", async () => {
  const selected = { start: "2026-11-18", end: "2026-11-21" };
  const weekly = await readPlanningContext({
    kind: "weekly",
    window: selected,
  });
  expect(weekly.exams).toEqual([]);
  expect(
    weekly.publicExams!.exams.some((item) =>
      item.claims.some((claim) => claim.courseId === "BIOL 224"),
    ),
  ).toBe(true);
  const proposal = await readPlanningContext({
    kind: "proposal",
    range: {
      start: "2026-11-20T18:00:00-05:00",
      end: "2026-11-20T19:00:00-05:00",
    },
  });
  expect(proposal.exams).toEqual([]);
  expect(proposal.publicExams).toBeUndefined();
});

it("honors search, host and major filters while keeping unknown end times", async () => {
  const filtered = await readCalendar({
    window,
    filters: {
      organizationIds: ["psu-asce"],
      audience: { mode: "recommended", majorIds: ["ce"] },
    },
  });
  expect(filtered.events.map((event) => event.id)).toEqual([
    "asce-job-reception-2027",
  ]);
  expect(filtered.externalEvents).toEqual([]);
  const arena = await readCalendar({
    window,
    filters: { search: "Winter Jam" },
  });
  expect(arena.externalEvents).toMatchObject([
    {
      timeKnown: false,
      reportedStart: "2027-03-20T22:00:00.000Z",
      doorsOpen: "2027-03-20T21:00:00.000Z",
    },
  ]);
  expect(arena.externalEvents[0]).not.toHaveProperty("end");
  expect(arena.publicExams!.exams).toEqual([]);
});
