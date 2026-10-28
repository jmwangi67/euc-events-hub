import { z } from "zod";
import {
  dateOnlySchema,
  eventSchema,
  examSchema,
  majorSchema,
  organizationSchema,
  organizationClusterSchema,
  eventCategorySchema,
  instantSchema,
} from "../domain/models";
import { externalEventSchema } from "../domain/external-events";

const ids = z.array(z.string().min(1).max(200)).max(100);
export const dateWindowSchema = z
  .object({
    start: dateOnlySchema,
    end: dateOnlySchema,
  })
  .strict()
  .refine((v) => v.end > v.start, "Window end must follow start.");
export type DateWindow = z.infer<typeof dateWindowSchema>;
export const eventFiltersSchema = z
  .object({
    audience: z
      .discriminatedUnion("mode", [
        z.object({ mode: z.literal("all") }).strict(),
        z.object({ mode: z.literal("recommended"), majorIds: ids }).strict(),
      ])
      .optional(),
    organizationIds: ids.optional(),
    categories: z.array(eventCategorySchema).optional(),
    clusterIds: ids.optional(),
    universityOnly: z.boolean().optional(),
    search: z.string().max(200).optional(),
  })
  .strict();
// Readonly collections keep callers independent of transport/storage ownership.
export type EventFilters = {
  audience?: import("../domain/relevance").MajorSelection;
  organizationIds?: readonly string[];
  categories?: readonly z.infer<typeof eventCategorySchema>[];
  clusterIds?: readonly string[];
  universityOnly?: boolean;
  search?: string;
};
export const referenceDataSchema = z
  .object({
    majors: z.array(majorSchema),
    organizations: z.array(organizationSchema),
    clusters: z.array(organizationClusterSchema),
  })
  .strict();
export type ReferenceData = z.infer<typeof referenceDataSchema>;
export const calendarQuerySchema = z
  .object({
    window: dateWindowSchema,
    filters: eventFiltersSchema.optional(),
    planning: z.boolean().default(false),
  })
  .strict();
export const calendarDataSchema = z
  .object({
    events: z.array(eventSchema),
    exams: z.array(examSchema),
    externalEvents: z.array(externalEventSchema),
    organizations: z.array(organizationSchema),
  })
  .strict();
export type CalendarData = z.infer<typeof calendarDataSchema>;
export const eventQuerySchema = z
  .object({ id: z.string().min(1).max(200) })
  .strict();
export const eventResponseSchema = z
  .object({ event: eventSchema.nullable() })
  .strict();
export const proposalRangeSchema = z
  .object({ start: instantSchema, end: instantSchema })
  .strict()
  .refine(
    (v) => Date.parse(v.end) > Date.parse(v.start),
    "End must follow start.",
  );
export const planningQuerySchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("weekly"),
      // Calendar views need at most six weeks. Bound public summary expansion,
      // rejecting oversized queries rather than returning incomplete intelligence.
      window: dateWindowSchema.refine(
        (window) =>
          Date.parse(window.end) - Date.parse(window.start) <= 366 * 86400000,
        "Weekly queries must span at most 366 calendar dates.",
      ),
    })
    .strict(),
  z
    .object({ kind: z.literal("proposal"), range: proposalRangeSchema })
    .strict(),
]);
export const planningContextSchema = calendarDataSchema;
