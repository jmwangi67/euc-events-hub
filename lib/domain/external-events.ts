import { z } from "zod";
import { easternDate, addCalendarDays } from "../time/eastern";
import {
  academicLevelSchema,
  dateOnlySchema,
  instantSchema,
  sourceSchema,
} from "./models";
export const EXTERNAL_CATEGORIES = {
  thon: "THON scenario",
  homecoming: "Homecoming scenario",
  football: "Football scenario",
  concert: "Major concert scenario",
  festival: "Music festival scenario",
  "academic-break": "Academic break scenario",
  "state-college": "State College event scenario",
  election: "Major election scenario",
  "super-bowl": "Super Bowl scenario",
} as const;
const fields = {
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(
    Object.keys(EXTERNAL_CATEGORIES) as [
      keyof typeof EXTERNAL_CATEGORIES,
      ...(keyof typeof EXTERNAL_CATEGORIES)[],
    ],
  ),
  scope: z.enum(["psu-wide", "campus-local", "national"]),
  analysis: z
    .enum(["broad-context", "audience-targeted", "context-only"])
    .default("context-only"),
  analysisReason: z
    .string()
    .min(1)
    .default("Context only; no analytical audience relationship documented."),
  targetMajorIds: z.array(z.string().min(1)).optional(),
  targetAcademicLevels: z.array(academicLevelSchema).optional(),
  targetClusterIds: z.array(z.string().min(1)).optional(),
  // Explicit source-backed policy metadata; an event title never selects a policy.
  impactPolicy: z.enum(["major-local-music", "academic-break"]).optional(),
  policyRationale: z.string().min(1).optional(),
  geography: z.string().min(1),
  audience: z.string().min(1),
  source: sourceSchema,
  startDate: dateOnlySchema,
  endDate: dateOnlySchema,
};
export const externalEventSchema = z
  .discriminatedUnion("timeKnown", [
    z.object({
      ...fields,
      timeKnown: z.literal(false),
      start: z.never().optional(),
      end: z.never().optional(),
    }),
    z.object({
      ...fields,
      timeKnown: z.literal(true),
      start: instantSchema,
      end: instantSchema,
    }),
  ])
  .superRefine((event, ctx) => {
    if (event.endDate <= event.startDate)
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Date range end is exclusive and must follow start.",
      });
    if (
      event.timeKnown &&
      Number.isFinite(Date.parse(event.start)) &&
      Number.isFinite(Date.parse(event.end)) &&
      (easternDate(event.start) !== event.startDate ||
        addCalendarDays(
          easternDate(new Date(Date.parse(event.end) - 1).toISOString()),
          1,
        ) !== event.endDate)
    )
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Date bounds must cover the known Eastern interval exactly.",
      });
    const national =
      event.category === "election" || event.category === "super-bowl";
    const universityWide = [
      "thon",
      "homecoming",
      "football",
      "academic-break",
    ].includes(event.category);
    if (universityWide !== (event.scope === "psu-wide"))
      ctx.addIssue({
        code: "custom",
        path: ["scope"],
        message: "University-wide categories require explicit PSU-wide scope.",
      });
    if (event.analysis === "broad-context" && event.scope === "campus-local")
      ctx.addIssue({
        code: "custom",
        path: ["analysis"],
        message:
          "Ordinary local context requires explicit audience targeting for analytical eligibility.",
      });
    if (
      event.analysis === "audience-targeted" &&
      !event.targetMajorIds?.length &&
      !event.targetClusterIds?.length
    )
      ctx.addIssue({
        code: "custom",
        path: ["analysis"],
        message: "Audience targeting requires documented majors or clusters.",
      });
    if (national !== (event.scope === "national"))
      ctx.addIssue({
        code: "custom",
        path: ["scope"],
        message: "Category must match its explicitly classified scope.",
      });
    if (event.timeKnown && Date.parse(event.end) <= Date.parse(event.start))
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "End must follow start.",
      });
    if (event.impactPolicy && !event.policyRationale)
      ctx.addIssue({
        code: "custom",
        path: ["policyRationale"],
        message: "A scheduling policy requires its documented rationale.",
      });
    if (
      event.impactPolicy === "major-local-music" &&
      (event.scope !== "campus-local" ||
        !["concert", "festival"].includes(event.category))
    )
      ctx.addIssue({
        code: "custom",
        path: ["impactPolicy"],
        message:
          "The major Local music policy requires an explicitly classified Local concert or festival.",
      });
    if (
      event.impactPolicy === "academic-break" &&
      event.category !== "academic-break"
    )
      ctx.addIssue({
        code: "custom",
        path: ["impactPolicy"],
        message:
          "Early-departure policy requires a documented academic-break record, not an ordinary holiday.",
      });
  });
export type ExternalEvent = z.infer<typeof externalEventSchema>;
