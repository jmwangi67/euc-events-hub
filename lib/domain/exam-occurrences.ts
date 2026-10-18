import type { Exam } from "./models";
/** A common occurrence can have several curated audience mappings; never add it twice. */
export function examOccurrences(exams: readonly Exam[]) {
  // Stable full-record order also makes the representative/provenance independent of ingestion order.
  const ordered = exams
    .map((exam) => ({
      exam,
      key: JSON.stringify([
        exam.id,
        exam.date,
        exam.timeKnown,
        exam.start,
        exam.end,
        exam.courseId,
        exam.termId,
        exam.relevantMajorIds,
        exam.typicalAcademicLevels,
        exam.sectionScope,
        exam.courseScope,
        exam.source.label,
        exam.source.url,
        exam.source.verification,
      ]),
    }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const records = new Map<string, Exam>();
  const alternatives = new Map<string, Map<string, Exam>>();
  const conflictingIds = new Set<string>();
  for (const { exam, key } of ordered) {
    if (!alternatives.has(exam.id)) alternatives.set(exam.id, new Map());
    alternatives.get(exam.id)!.set(key, exam);
    const previous = records.get(exam.id);
    if (!previous) {
      records.set(exam.id, exam);
      continue;
    }
    if (
      previous.date !== exam.date ||
      previous.timeKnown !== exam.timeKnown ||
      previous.start !== exam.start ||
      previous.end !== exam.end
    ) {
      conflictingIds.add(exam.id);
      continue;
    }
    records.set(exam.id, {
      ...previous,
      relevantMajorIds: [
        ...new Set([...previous.relevantMajorIds, ...exam.relevantMajorIds]),
      ],
      typicalAcademicLevels:
        previous.typicalAcademicLevels?.length &&
        exam.typicalAcademicLevels?.length
          ? [
              ...new Set([
                ...previous.typicalAcademicLevels,
                ...exam.typicalAcademicLevels,
              ]),
            ]
          : undefined,
      sectionScope: [
        ...new Set([...previous.sectionScope, ...exam.sectionScope]),
      ],
    });
  }
  const identityConflicts = [...conflictingIds].map((id) => ({
    id,
    alternatives: [...alternatives.get(id)!.values()],
  }));
  return {
    exams: [...records.values()].filter((exam) => !conflictingIds.has(exam.id)),
    // Compatibility representatives for uncertainty displays, never resolved timing or preparation inputs.
    identityUncertainExams: identityConflicts.map(
      (group) => group.alternatives[0],
    ),
    identityConflicts,
    sourceRecords: ordered.map(({ exam }) => ({
      examId: exam.id,
      source: exam.source,
    })),
  };
}
