import { z } from "zod";
import { easternDate, addCalendarDays } from "../time/eastern";
import { dateOnlySchema, instantSchema, sourceSchema } from "./models";
export const EXTERNAL_CATEGORIES = {
  thon: "THON scenario",
  homecoming: "Homecoming scenario",
  football: "Football scenario",
  concert: "Major concert scenario",
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
  scope: z.enum(["campus-local", "national"]),
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
    if (national !== (event.scope === "national"))
      ctx.addIssue({
        code: "custom",
        path: ["scope"],
        message: "Category must match campus/local or national scope.",
      });
    if (event.timeKnown && Date.parse(event.end) <= Date.parse(event.start))
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "End must follow start.",
      });
  });
export type ExternalEvent = z.infer<typeof externalEventSchema>;
