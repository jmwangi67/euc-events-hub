import { z } from "zod";
import { DISPLAY_TIME_ZONE } from "../time/constants";

const id = z.string().trim().min(1);
export const dateOnlySchema = z.iso.date();
// Explicit offsets make timed values independent of the runtime time zone.
export const instantSchema = z.iso
  .datetime({ offset: true })
  .refine(
    (value) => Number.isFinite(Date.parse(value)),
    "Timestamp must represent a valid instant.",
  );
const httpUrl = z.url({ protocol: /^https?$/ });
const verification = z.enum(["synthetic", "unverified", "verified"]);
export const sourceSchema = z.object({
  label: z.string().min(1),
  url: httpUrl.optional(),
  verification,
});

export const majorSchema = z.object({
  id,
  name: z.string().min(1),
  abbreviation: z.string().min(1),
});
export const academicLevelSchema = z.enum([
  "first",
  "second",
  "third",
  "fourth",
  "fifth-plus",
]);
export const organizationClusterSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
});
export const organizationSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string().optional(),
  defaultMajorIds: z.array(id),
  classification: z.string().optional(),
  networkIds: z.array(id).default([]),
  clusterIds: z.array(id).optional(),
});
export const eventCategorySchema = z.enum([
  "corporate-recruiting",
  "technical-workshop",
  "professional-development",
  "networking",
  "career-fair",
  "student-organization",
  "research",
  "competition",
]);
const eventFields = {
  id,
  title: z.string().min(1),
  description: z.string().optional(),
  seriesId: id.optional(),
  hostOrganizationIds: z.array(id).min(1),
  targetMajorIds: z.array(id),
  targeting: z.enum(["explicit", "inherited", "unclassified"]),
  collegeWide: z.boolean(),
  category: eventCategorySchema,
  tags: z.array(z.string().min(1)).default([]),
  audienceEligibility: z.string().optional(),
  targetAcademicLevels: z.array(academicLevelSchema).optional(),
  targetClusterIds: z.array(id).optional(),
  status: z.enum(["draft", "published", "tentative", "canceled"]),
  location: z.string().optional(),
  virtualMeetingUrl: httpUrl.optional(),
  registrationUrl: httpUrl.optional(),
  source: sourceSchema,
};
export const eventSchema = z
  .discriminatedUnion("allDay", [
    z.object({
      ...eventFields,
      allDay: z.literal(false),
      start: instantSchema,
      end: instantSchema,
    }),
    z.object({
      ...eventFields,
      allDay: z.literal(true),
      start: dateOnlySchema,
      end: dateOnlySchema,
    }),
  ])
  .superRefine((event, ctx) => {
    const ordered = event.allDay
      ? event.end > event.start
      : Date.parse(event.end) > Date.parse(event.start);
    if (!ordered)
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "End must follow start; all-day end dates are exclusive.",
      });
    if (event.targeting !== "explicit" && event.targetMajorIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["targetMajorIds"],
        message: "Only explicit targeting assigns event major IDs.",
      });
    }
    if (
      event.targeting === "explicit" &&
      !event.collegeWide &&
      !event.targetMajorIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["targetMajorIds"],
        message:
          "Explicit targeting needs an audience or college-wide classification.",
      });
    }
  });
const examFields = {
  id,
  courseId: id,
  termId: id,
  date: dateOnlySchema,
  sectionScope: z.array(z.string().min(1)),
  relevantMajorIds: z.array(id),
  typicalAcademicLevels: z.array(academicLevelSchema).optional(),
  courseScope: z.enum(["general-stem", "major-specific"]).optional(),
  source: sourceSchema,
};
export const examSchema = z
  .discriminatedUnion("timeKnown", [
    z.object({
      ...examFields,
      timeKnown: z.literal(false),
      start: z.never().optional(),
      end: z.never().optional(),
    }),
    z.object({
      ...examFields,
      timeKnown: z.literal(true),
      start: instantSchema,
      end: instantSchema,
    }),
  ])
  .superRefine((exam, ctx) => {
    if (exam.timeKnown) {
      // Format validation errors must remain Zod issues, not Intl exceptions.
      if (
        !Number.isFinite(Date.parse(exam.start)) ||
        !Number.isFinite(Date.parse(exam.end))
      )
        return;
      if (Date.parse(exam.end) <= Date.parse(exam.start))
        ctx.addIssue({
          code: "custom",
          path: ["end"],
          message: "End must follow start.",
        });
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: DISPLAY_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(exam.start));
      if (date !== exam.date)
        ctx.addIssue({
          code: "custom",
          path: ["date"],
          message: "Exam date must match the Eastern start date.",
        });
    }
  });
export type Major = z.infer<typeof majorSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Exam = z.infer<typeof examSchema>;
export type EventCategory = z.infer<typeof eventCategorySchema>;

export type AcademicLevel = z.infer<typeof academicLevelSchema>;
export type OrganizationCluster = z.infer<typeof organizationClusterSchema>;
