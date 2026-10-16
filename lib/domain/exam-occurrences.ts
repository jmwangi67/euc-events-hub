import type { Exam } from "./models";
/** A common occurrence can have several curated audience mappings; never add it twice. */
export function examOccurrences(exams: readonly Exam[]) {
  const records = new Map<string, Exam>();
  const conflictingIds = new Set<string>();
  for (const exam of exams) {
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
  return {
    exams: [...records.values()].filter((exam) => !conflictingIds.has(exam.id)),
    identityUncertainExams: [...records.values()].filter((exam) =>
      conflictingIds.has(exam.id),
    ),
    sourceRecords: exams.map((exam) => ({
      examId: exam.id,
      source: exam.source,
    })),
  };
}
