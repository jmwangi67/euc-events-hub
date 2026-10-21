import { z } from "zod";

export const eventCategorySchema = z.enum([
  "career-networking",
  "professional-development",
  "technical-workshop",
  "general-body-meeting",
  "competition",
  "social-recreational",
]);
export const eventSubtypeSchema = z.enum([
  "career-fair",
  "corporate-recruiting",
  "networking",
  "research-seminar",
]);
export const legacyCategorySchema = z.enum([
  "corporate-recruiting",
  "networking",
  "career-fair",
  "research",
  "student-organization",
]);

/** Legacy ingestion is lossless. Ambiguous purposes stay visible for review. */
export function migrateLegacyEvent(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const record = input as Record<string, unknown>;
  if (
    ["corporate-recruiting", "networking", "career-fair"].includes(
      String(record.category),
    )
  ) {
    return {
      ...record,
      legacyCategory: record.category,
      category: "career-networking",
      subtype: record.subtype ?? record.category,
    };
  }
  if (
    record.category === "research" ||
    record.category === "student-organization"
  ) {
    return {
      ...record,
      legacyCategory: record.category,
      category: null,
      categoryMappingNote: `Legacy ${record.category} purpose requires review; no public category was inferred.`,
    };
  }
  return input;
}
