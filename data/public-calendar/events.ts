import { eventSchema } from "../../lib/domain/models";
import type { Event } from "../../lib/domain/models";
import { resolveEasternLocal } from "../../lib/time/eastern-local";

const college = "https://www.engr.psu.edu/events/";
const career = "https://career.engr.psu.edu/events/";
const studentAffairs =
  "https://studentaffairs.psu.edu/career-readiness/career-events/spring-career-day";
const week = "https://career.engr.psu.edu/ecw/index.aspx";

type Timed = Extract<Event, { allDay: false }>;
type Options = Partial<
  Pick<
    Timed,
    | "description"
    | "subtype"
    | "seriesId"
    | "audienceEligibility"
    | "targetMajorIds"
    | "collegeWide"
  >
>;
function timed(
  id: string,
  title: string,
  date: string,
  start: string,
  end: string,
  location: string,
  host: string,
  url: string,
  category: NonNullable<Event["category"]>,
  options: Options = {},
  ownerReported = false,
) {
  return {
    id,
    title,
    location,
    category,
    allDay: false,
    start: resolveEasternLocal(date, start),
    end: resolveEasternLocal(date, end),
    hostOrganizationIds: [host],
    status: "published",
    targeting: options.targetMajorIds?.length ? "explicit" : "unclassified",
    targetMajorIds: [],
    collegeWide: false,
    source: {
      label: ownerReported
        ? "Owner-supplied schedule"
        : "Penn State event listing",
      url: url || undefined,
      verification: ownerReported ? "unverified" : "verified",
    },
    ...options,
  };
}

const coe = "psu-coe";
const careerCategory = "career-networking";
const springSeries = "spring-career-days-2027";
const careerWeek = "engineering-career-week-2027";
const broad = { collegeWide: true };
const showcase = {
  description:
    "Public capstone project showcase. The College of Engineering listing gives the location and hours shown here.",
  collegeWide: true,
};

export const publicEvents = eventSchema.array().parse([
  ...[
    ["2026-11-09", "16:00"],
    ["2026-11-12", "16:00"],
    ["2026-12-01", "14:00"],
    ["2026-12-02", "16:00"],
  ].map(([date, end]) =>
    timed(
      `euc-tabling-${date}`,
      "EUC Outreach Tabling",
      date,
      "10:00",
      end,
      "ECoRE · Exact location pending",
      "psu-euc",
      "",
      "social-recreational",
      {
        ...broad,
        seriesId: "euc-outreach-tabling-fall-2026",
        description:
          "Meet EUC, ask about leadership opportunities, and share feedback through What Could Be Improved?",
      },
      true,
    ),
  ),
  ...["2027-01-27", "2027-01-28"].map((date) =>
    timed(
      `${springSeries}-${date}`,
      "Spring Career Days",
      date,
      "11:00",
      "16:00",
      "HUB-Robeson Center, University Park",
      "psu-career-services",
      studentAffairs,
      careerCategory,
      {
        ...broad,
        seriesId: springSeries,
        subtype: "career-fair",
        audienceEligibility: "University-wide; students and recent alumni.",
      },
    ),
  ),
  timed(
    "engineering-networking-reception-2027",
    "Engineering Networking Reception",
    "2027-02-09",
    "18:00",
    "20:30",
    "Presidents Hall, The Penn Stater",
    coe,
    week,
    careerCategory,
    {
      ...broad,
      seriesId: careerWeek,
      subtype: "networking",
      audienceEligibility: "Open to Penn State engineering students.",
    },
  ),
  timed(
    "engineering-career-fair-2027",
    "Engineering Career Fair",
    "2027-02-10",
    "13:00",
    "18:00",
    "Presidents and Deans Halls, The Penn Stater",
    coe,
    "https://career.engr.psu.edu/ecw/students/fair.aspx",
    careerCategory,
    {
      ...broad,
      seriesId: careerWeek,
      subtype: "career-fair",
      audienceEligibility: "Free and open to all engineering students.",
    },
  ),
  timed(
    "engineering-interviews-2027",
    "Engineering Career Week Interviews",
    "2027-02-11",
    "08:30",
    "16:30",
    "Bank of America Career Services Center",
    coe,
    "https://career.engr.psu.edu/ecw/employers/",
    careerCategory,
    {
      seriesId: careerWeek,
      subtype: "corporate-recruiting",
      audienceEligibility:
        "Employer interviews by arrangement. This is the published program window.",
    },
  ),
  timed(
    "asce-job-reception-2027",
    "ASCE Civil Engineering Job Reception",
    "2027-02-02",
    "11:00",
    "14:00",
    "Alumni Hall, HUB-Robeson Center",
    "psu-asce",
    career,
    careerCategory,
    {
      subtype: "networking",
      targetMajorIds: ["ce"],
      audienceEligibility:
        "The listing invites civil engineering students. The department also covers environmental engineering.",
    },
  ),
  timed(
    "chemical-engineering-reception-2027",
    "Chemical Engineering Networking Reception",
    "2027-02-10",
    "19:00",
    "21:00",
    "Heritage Hall, HUB-Robeson Center",
    "psu-oxe",
    college,
    careerCategory,
    {
      subtype: "networking",
      targetMajorIds: ["che"],
      description:
        "Omega Chi Epsilon is the owner-reported host. The College of Engineering lists the date, hours and venue.",
    },
  ),
  timed(
    "learning-factory-showcase-fall-2026",
    "Learning Factory Capstone Showcase",
    "2026-12-10",
    "13:00",
    "15:30",
    "129 ABC HUB-Robeson Center",
    coe,
    college,
    "professional-development",
    showcase,
  ),
  ...[
    "2026-10-27",
    "2026-10-28",
    "2026-11-03",
    "2026-11-04",
    "2026-11-10",
    "2026-11-11",
    "2026-11-17",
    "2026-11-18",
  ].map((date) =>
    timed(
      `career-drop-in-${date}`,
      "Engineering Career Drop-In",
      date,
      "11:00",
      "13:00",
      "ECoRE first-floor lobby",
      coe,
      career,
      careerCategory,
      {
        ...broad,
        seriesId: "engineering-career-drop-in-fall-2026",
        description: "Drop-in career advice for engineering students.",
      },
    ),
  ),
  timed(
    "critical-infrastructure-controls-seminar-2026",
    "How Safe Is Safe Enough? Critical Infrastructure Control Systems",
    "2026-11-13",
    "13:25",
    "14:35",
    "108 Chambers Building",
    coe,
    college,
    "professional-development",
    { subtype: "research-seminar" },
  ),
  timed(
    "henkel-recruiting-2026",
    "An Evening with Henkel",
    "2026-11-16",
    "18:00",
    "18:45",
    "Online",
    coe,
    career,
    careerCategory,
    { ...broad, subtype: "corporate-recruiting" },
  ),
  timed(
    "job-search-international-2026",
    "Job Search Strategy for International Students",
    "2026-11-17",
    "16:00",
    "17:00",
    "Online",
    coe,
    career,
    "professional-development",
    {
      ...broad,
      audienceEligibility: "International students across engineering majors.",
    },
  ),
  timed(
    "cmu-quant-finance-presentation-2026",
    "Carnegie Mellon Computational Finance Program Presentation",
    "2026-11-18",
    "16:00",
    "17:00",
    "103 Bank of America Career Services Center",
    coe,
    career,
    "professional-development",
    {
      audienceEligibility: "The listing names AIE, CMPSC, DTSCE and IE majors.",
    },
  ),
  timed(
    "lockheed-martin-industrial-2026",
    "Discover Lockheed Martin: Production and Industrial Engineering",
    "2026-11-18",
    "19:00",
    "20:00",
    "Online",
    coe,
    career,
    careerCategory,
    {
      subtype: "corporate-recruiting",
      audienceEligibility: "The listing highlights industrial engineering.",
    },
  ),
  timed(
    "wireless-sensing-seminar-2026",
    "Training-Free Diffusion for Wireless Sensing",
    "2026-11-20",
    "13:25",
    "14:35",
    "108 Chambers Building",
    coe,
    college,
    "professional-development",
    { subtype: "research-seminar" },
  ),
  timed(
    "pittsburgh-connect-2026",
    "Pittsburgh Connect: Penn State Student Networking Summit",
    "2026-11-23",
    "11:00",
    "14:00",
    "Pittsburgh, PA",
    coe,
    career,
    careerCategory,
    { ...broad, subtype: "networking" },
  ),
  timed(
    "dynamic-spectrum-seminar-2026",
    "Risk-Informed and Privacy-Preserving Dynamic Spectrum Sharing",
    "2026-12-04",
    "13:25",
    "14:35",
    "108 Chambers Building",
    coe,
    college,
    "professional-development",
    { subtype: "research-seminar" },
  ),
  ...[
    "2026-09-04",
    "2026-10-02",
    "2026-11-06",
    "2026-12-04",
    "2027-01-15",
    "2027-02-05",
    "2027-03-05",
    "2027-04-02",
  ].map((date) =>
    timed(
      `engineering-research-engagement-${date}`,
      "Engineering Research Engagement Information Session",
      date,
      "09:00",
      "10:00",
      "Online",
      coe,
      "https://www.engr.psu.edu/events/event-detail.aspx?EventID=6471c7a0-72f1-42b8-a28d-a",
      "professional-development",
      { ...broad, seriesId: "engineering-research-engagement-2026-27" },
    ),
  ),
  timed(
    "wra-open-house-2027",
    "Whitman, Requardt & Associates Open House",
    "2027-03-03",
    "11:00",
    "14:00",
    "ECoRE second-floor student lounge",
    coe,
    career,
    careerCategory,
    {
      subtype: "corporate-recruiting",
      targetMajorIds: ["ce", "me"],
      audienceEligibility:
        "The listing names architectural, civil, electrical and mechanical engineering.",
    },
  ),
  timed(
    "nj-transit-apply-2027",
    "NJ Transit Coffee Chat: How to Apply",
    "2027-01-06",
    "12:00",
    "12:45",
    "Online",
    coe,
    career,
    careerCategory,
    { ...broad, subtype: "corporate-recruiting" },
  ),
]);
