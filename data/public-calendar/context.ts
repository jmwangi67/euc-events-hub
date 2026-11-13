import { externalEventSchema } from "../../lib/domain/external-events";
import type { ExternalEvent } from "../../lib/domain/external-events";
import { addCalendarDays } from "../../lib/time/eastern";
import { resolveEasternLocal } from "../../lib/time/eastern-local";

const registrar =
  "https://www.registrar.psu.edu/academic-calendars/2026-27.cfm";
const bjc = "Bryce Jordan Center, University Park";
const engineering = "https://www.engr.psu.edu/events/";
const stadium = "West Shore Home Field at Beaver Stadium, University Park";
type Category = ExternalEvent["category"];

function context(
  id: string,
  title: string,
  startDate: string,
  url: string,
  category: Category,
  geography: string,
  details: {
    lastDate?: string;
    clock?: string;
    doors?: string;
    note?: string;
    ownerReported?: boolean;
    scope?: ExternalEvent["scope"];
    dateWide?: boolean;
  } = {},
) {
  return {
    id,
    title,
    startDate,
    endDate: addCalendarDays(details.lastDate ?? startDate, 1),
    timeKnown: false,
    category,
    geography,
    scope:
      details.scope ??
      (category === "academic-break" ||
      category === "academic-date" ||
      category === "football" ||
      category === "thon"
        ? "psu-wide"
        : "campus-local"),
    dateWide: details.dateWide,
    reportedStart: details.clock
      ? resolveEasternLocal(startDate, details.clock)
      : undefined,
    doorsOpen: details.doors
      ? resolveEasternLocal(startDate, details.doors)
      : undefined,
    scheduleNote: details.note,
    audience:
      category === "academic-date" || category === "academic-break"
        ? "Penn State regular-session academic context."
        : "Consult the organizer for attendance and access details.",
    source: {
      label: details.ownerReported
        ? "Owner-reported; schedule details unverified"
        : "Organizer or institutional listing",
      url,
      verification: details.ownerReported ? "unverified" : "verified",
    },
  };
}

const academic = [
  ["fall-classes-begin", "Fall classes begin", "2026-08-24"],
  ["fall-registration", "Fall registration deadline", "2026-08-23"],
  ["fall-add", "Fall regular add deadline", "2026-08-30", "", "23:59"],
  ["fall-drop", "Fall regular drop deadline", "2026-08-29", "", "23:59"],
  ["labor-day", "Labor Day · No classes", "2026-09-07"],
  [
    "fall-conflict-filing",
    "Fall final exam conflict filing",
    "2026-09-28",
    "2026-10-25",
  ],
  [
    "fall-late-deadlines",
    "Fall late registration, add and drop deadlines",
    "2026-11-13",
    "",
    "23:59",
  ],
  [
    "thanksgiving",
    "Thanksgiving break · No classes",
    "2026-11-22",
    "2026-11-28",
  ],
  ["fall-withdrawal", "Fall withdrawal deadline", "2026-12-11", "", "17:00"],
  ["fall-classes-end", "Fall classes end", "2026-12-11"],
  ["fall-study-days", "Fall study days", "2026-12-12", "2026-12-13"],
  ["fall-finals", "Fall final examination period", "2026-12-14", "2026-12-18"],
  ["fall-commencement", "Fall commencement", "2026-12-20"],
  ["spring-registration", "Spring registration deadline", "2027-01-10"],
  ["spring-classes-begin", "Spring classes begin", "2027-01-11"],
  ["spring-drop", "Spring regular drop deadline", "2027-01-16", "", "23:59"],
  ["spring-add", "Spring regular add deadline", "2027-01-17", "", "23:59"],
  ["mlk", "Martin Luther King Jr. Day · No classes", "2027-01-18"],
  [
    "spring-conflict-filing",
    "Spring final exam conflict filing",
    "2027-02-15",
    "2027-03-07",
  ],
  ["spring-break", "Spring break · No classes", "2027-03-07", "2027-03-13"],
  [
    "spring-late-deadlines",
    "Spring late registration, add and drop deadlines",
    "2027-04-09",
    "",
    "23:59",
  ],
  [
    "spring-withdrawal",
    "Spring withdrawal deadline",
    "2027-04-30",
    "",
    "17:00",
  ],
  ["spring-classes-end", "Spring classes end", "2027-04-30"],
  ["spring-study-days", "Spring study days", "2027-05-01", "2027-05-02"],
  [
    "spring-finals",
    "Spring final examination period",
    "2027-05-03",
    "2027-05-07",
  ],
  ["spring-commencement", "Spring commencement", "2027-05-07", "2027-05-09"],
].map(([id, title, date, lastDate, clock]) =>
  context(
    `psu-academic-${id}`,
    title,
    date,
    registrar,
    ["labor-day", "thanksgiving", "mlk", "spring-break"].includes(id)
      ? "academic-break"
      : "academic-date",
    "Penn State",
    { lastDate: lastDate || undefined, clock, dateWide: !clock },
  ),
);

const arenaAthletics = [
  [
    "cleveland-state",
    "Penn State vs Cleveland State",
    "2026-11-02",
    "17:00",
    "psu-vs-cleveland-state",
    "16:00",
  ],
  [
    "canisius",
    "Penn State vs Canisius",
    "2026-11-02",
    "19:30",
    "psu-vs-canisius",
    "18:30",
  ],
  [
    "chattanooga",
    "Penn State vs Chattanooga",
    "2026-11-05",
    "18:00",
    "psu-vs-chattanooga",
    "17:00",
  ],
  [
    "mercyhurst",
    "Penn State vs Mercyhurst",
    "2026-11-12",
    "18:30",
    "psu-vs-mercyhurst",
    "17:30",
  ],
  [
    "new-haven",
    "Penn State vs New Haven",
    "2026-11-15",
    "16:30",
    "psu-vs-newhaven",
    "15:30",
  ],
  [
    "iu-indy",
    "Penn State vs IU Indy",
    "2026-11-18",
    "18:30",
    "psu-vs-iuindy",
    "17:30",
  ],
  [
    "ualbany",
    "Penn State vs UAlbany",
    "2026-12-01",
    "19:00",
    "psu-vs-ualbany",
    "18:00",
  ],
  [
    "james-madison",
    "Penn State vs James Madison",
    "2026-12-02",
    "18:00",
    "psu-vs-james-madison",
    "17:00",
  ],
  [
    "nebraska",
    "Penn State vs Nebraska",
    "2026-12-08",
    "20:00",
    "psu-vs-canisius-6",
    "19:00",
  ],
  ["army", "Penn State vs Army", "2026-12-10", "18:00", "psu-vs-army", "17:00"],
  [
    "west-virginia-wrestling",
    "Penn State Wrestling vs West Virginia",
    "2026-12-13",
    "12:00",
    "psu-vs-west-virginia",
    "11:00",
  ],
  [
    "ut-martin",
    "Penn State vs UT Martin",
    "2026-12-16",
    "18:30",
    "psu-vs-utmartin",
    "17:30",
  ],
  [
    "oregon",
    "Penn State vs Oregon",
    "2027-01-02",
    "14:00",
    "psu-vs-oregon",
    "13:00",
  ],
  [
    "rutgers-january",
    "Penn State vs Rutgers",
    "2027-01-08",
    "18:00",
    "psu-vs-rutgers-1",
    "17:00",
  ],
  [
    "northwestern",
    "Penn State vs Northwestern",
    "2027-01-10",
    "12:00",
    "psu-vs-northwestern",
    "11:00",
  ],
  [
    "michigan-wrestling",
    "Penn State Wrestling vs Michigan",
    "2027-01-15",
    "19:00",
    "psu-vs-michigan-1",
    "18:00",
  ],
  [
    "purdue",
    "Penn State vs Purdue",
    "2027-01-20",
    "18:30",
    "psu-vs-purdue",
    "17:30",
  ],
  [
    "maryland-january",
    "Penn State vs Maryland",
    "2027-01-30",
    "12:00",
    "psu-vs-maryland",
    "11:00",
  ],
  [
    "indiana",
    "Penn State vs Indiana",
    "2027-02-02",
    "17:00",
    "psu-vs-indiana",
    "",
    "The venue lists doors at 6 PM, after its listed 5 PM start. Door time needs confirmation.",
  ],
  [
    "iowa-wrestling",
    "Penn State Wrestling vs Iowa",
    "2027-02-05",
    "20:00",
    "psu-vs-iowa",
    "19:00",
  ],
  [
    "ohio-state",
    "Penn State vs Ohio State",
    "2027-02-06",
    "12:00",
    "psu-vs-ohiostate",
    "11:00",
  ],
  [
    "maryland-february",
    "Penn State vs Maryland",
    "2027-02-07",
    "13:00",
    "psu-vs-maryland-1",
    "12:00",
  ],
  [
    "washington",
    "Penn State vs Washington",
    "2027-02-17",
    "19:00",
    "psu-vs-washington",
    "18:00",
  ],
  [
    "michigan",
    "Penn State vs Michigan",
    "2027-02-23",
    "18:00",
    "psu-vs-michigan",
    "17:00",
  ],
  [
    "rutgers-march",
    "Penn State vs Rutgers",
    "2027-03-07",
    "15:00",
    "psu-vs-rutgers",
    "14:00",
  ],
] as const;

const arena = [
  [
    "breaking-benjamin",
    "Breaking Benjamin",
    "2027-02-26",
    "18:30",
    "concert",
    "https://bjc.psu.edu/events/detail/breaking-benjamin",
    "17:30",
  ],
  [
    "globetrotters",
    "Harlem Globetrotters: Rivalry Tour",
    "2027-03-02",
    "19:00",
    "athletic-event",
    "https://bjc.psu.edu/events/detail/harlem-globetrotters-2027",
    "18:00",
  ],
  [
    "winter-jam",
    "Winter Jam 2027",
    "2027-03-20",
    "18:00",
    "concert",
    "https://bjc.psu.edu/events/detail/winter-jam",
    "17:00",
    "Admission by donation at the door; no advance ticket required.",
  ],
  [
    "price-is-right",
    "The Price Is Right Live",
    "2027-04-21",
    "19:30",
    "state-college",
    "https://bjc.psu.edu/events/detail/the-price-is-right-live",
    "18:30",
  ],
  [
    "phoebe-bridgers",
    "Phoebe Bridgers",
    "2027-03-19",
    "19:30",
    "concert",
    "https://bjc.psu.edu/events/detail/phoebe-bridgers",
    "18:00",
  ],
] as const;

const football = [
  ["2026-09-05", "Marshall", "15:30"],
  ["2026-09-19", "Buffalo", "12:00"],
  ["2026-09-26", "Wisconsin", "17:00"],
  ["2026-10-10", "USC", "19:30"],
  ["2026-11-07", "Purdue", "16:15"],
  ["2026-11-14", "Minnesota", "19:00"],
  ["2026-11-21", "Rutgers", "15:30"],
  ["2027-09-04", "Syracuse", ""],
  ["2027-09-11", "Maine", ""],
  ["2027-09-18", "Temple", ""],
].map(([date, opponent, clock]) =>
  context(
    `psu-football-${date}`,
    `Penn State Football vs ${opponent}`,
    date,
    `https://gopsusports.com/sports/football/schedule/season/${date.slice(0, 4)}`,
    "football",
    stadium,
    { clock },
  ),
);

export const publicContext = externalEventSchema.array().parse([
  ...academic,
  ...football,
  ...arenaAthletics.map(([id, title, date, clock, slug, doors, note]) =>
    context(
      `bjc-${id}`,
      title,
      date,
      `https://bjc.psu.edu/events/detail/${slug}`,
      "athletic-event",
      bjc,
      { clock, doors, note },
    ),
  ),
  ...arena.map(([id, title, date, clock, category, url, doors, note]) =>
    context(
      `bjc-${id}`,
      title,
      date,
      url ?? "https://bjc.psu.edu/events",
      category,
      bjc,
      { clock, doors, note },
    ),
  ),
  ...[
    ["2027-04-03", "12:00"],
    ["2027-04-03", "19:00"],
    ["2027-04-04", "14:00"],
  ].map(([date, clock]) =>
    context(
      `bjc-hot-wheels-${date}-${clock.replace(":", "")}`,
      "Hot Wheels Monster Trucks Live",
      date,
      "https://bjc.psu.edu/events/detail/hot-wheels-monster-trucks-live",
      "campus-event",
      bjc,
      {
        clock,
        note: "Separate main show. The venue lists pre-show and VIP times separately.",
      },
    ),
  ),
  {
    ...context(
      "thon-2027",
      "THON Weekend",
      "2027-02-19",
      "https://www.psu.edu/news/campus-life/story/thon-weekend-2027-be-held-feb-19-21",
      "thon",
      bjc,
      { lastDate: "2027-02-21", dateWide: true },
    ),
    subtype: "thon",
    analysis: "broad-context",
    analysisReason:
      "Campus-wide student philanthropy with the existing THON planning policy.",
  },
  context(
    "super-bowl-lxi",
    "Super Bowl LXI",
    "2027-02-14",
    "https://operations.nfl.com/calendar-events/nfl-important-dates",
    "super-bowl",
    "SoFi Stadium, Inglewood, California",
    { scope: "national" },
  ),
  context(
    "fall-engineering-commencement-2026",
    "College of Engineering Commencement",
    "2026-12-20",
    "https://bjc.psu.edu/events/detail/penn-state-fall-commencement-2026",
    "academic-date",
    bjc,
    { clock: "13:00" },
  ),
  context(
    "engineers-study-abroad-2026",
    "Engineers Study Abroad Information Session",
    "2026-11-16",
    engineering,
    "campus-event",
    "Online",
    { clock: "13:00" },
  ),
  context(
    "find-summer-research-2026",
    "How to Find Summer Research Opportunities",
    "2026-11-16",
    engineering,
    "campus-event",
    "Online",
    { clock: "16:00" },
  ),
  context(
    "johnson-engineering-showcase-2027",
    "Johnson & Johnson Engineering Showcase",
    "2027-04-24",
    engineering,
    "campus-event",
    "Raritan, New Jersey",
    {
      note: "For selected applicants; the listing gives January 22 as the application date.",
    },
  ),
  context(
    "holiday-crawl-2026",
    "LineLeap PSU Holiday Crawl",
    "2026-12-05",
    "https://tickets.lineleap.com/venues/YSYsTazlgLCBKHmKuv48",
    "state-college",
    "State College",
    {
      note: "Independent bar event. The organizer listing confirms the date. Owner-reported hours are noon through 2 AM the following day; the organizer did not confirm those hours. Check age and entry requirements with the organizer.",
    },
  ),
  {
    ...context(
      "movin-on-2027",
      "Movin’ On",
      "2027-04-30",
      "https://www.movinon.org/festival",
      "festival",
      "IM Fields",
      {
        doors: "15:30",
        note: "Free admission for ages 18+ with a Penn State student ID or government-issued ID.",
      },
    ),
    reportedEnd: resolveEasternLocal("2027-04-30", "22:30"),
  },
]);
