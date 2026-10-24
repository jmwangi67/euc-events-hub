import { examSchema, type Exam } from "../domain/models";
import { easternDate } from "../time/eastern";
import {
  examHasConflict,
  type StagedExam,
  type StagedExamDataset,
} from "./staging";

/** Explicit eligibility boundary; staging/review data never enters mathematics implicitly. */
export function preparationEligibility(
  exam: StagedExam,
  dataset: StagedExamDataset,
) {
  const reasons = new Set<string>();
  if (examHasConflict(exam))
    reasons.add("Conflicting canonical source claims require reconciliation.");
  for (const claim of exam.claims) {
    const source = dataset.sources.find((item) => item.id === claim.sourceId);
    if (claim.sourceStatus !== "confirmed" || !source?.independentlyVerified)
      reasons.add(
        "Source confirmation and independent verification require review.",
      );
    if (
      !source?.permissions.planner ||
      !["approved-for-planner", "approved-for-public"].includes(
        claim.publicationStatus,
      )
    )
      reasons.add(
        "Planner authorization and publication review are incomplete.",
      );
    if (
      !claim.audience.reviewed ||
      !claim.audience.majorIds.length ||
      !claim.audience.academicLevels.length
    )
      reasons.add("Major and academic-year mappings require explicit review.");
    if (!["timed", "date-only"].includes(claim.timing.kind))
      reasons.add(
        "Multiple testing dates remain review-only; no single numerical contribution is fabricated.",
      );
    if (claim.timing.kind === "timed" && claim.timing.basis !== "explicit")
      reasons.add(
        "Source-wide default hours are not a reviewed exact examination time.",
      );
  }
  return { eligible: reasons.size === 0, reasons: [...reasons] };
}
export function toReviewedCanonicalExams(dataset: StagedExamDataset): Exam[] {
  return dataset.exams.flatMap((exam) => {
    if (!preparationEligibility(exam, dataset).eligible) return [];
    return exam.claims.map((claim) => {
      const timing = claim.timing;
      if (timing.kind !== "timed" && timing.kind !== "date-only")
        throw new Error("Incompatible staging timing.");
      const source = dataset.sources.find(
        (item) => item.id === claim.sourceId,
      )!;
      return examSchema.parse({
        id: exam.id,
        courseId: claim.courseId,
        termId: claim.termId,
        sectionScope: claim.sections ?? [],
        relevantMajorIds: claim.audience.majorIds,
        typicalAcademicLevels: claim.audience.academicLevels,
        source: {
          label: `${source.label} · ${claim.sourceReference}`,
          verification: "verified",
        },
        ...(timing.kind === "timed"
          ? {
              timeKnown: true,
              date: easternDate(timing.start),
              start: new Date(timing.start).toISOString(),
              end: new Date(timing.end).toISOString(),
            }
          : { timeKnown: false, date: timing.date }),
      });
    });
  });
}
