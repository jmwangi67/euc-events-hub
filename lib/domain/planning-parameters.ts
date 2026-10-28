/** Candidate model strengths, not enrollment shares, study hours or calibrated effects. */
export const DEFAULT_RELEVANCE_WEIGHTS = {
  typical: 1,
  atypical: 0.65,
  unknown: 0.8,
};
export type RelevanceWeights = typeof DEFAULT_RELEVANCE_WEIGHTS;
export function validateRelevanceWeights(weights: RelevanceWeights) {
  if (
    Object.values(weights).some(
      (value) => !Number.isFinite(value) || value < 0 || value > 1,
    )
  )
    throw new RangeError(
      "Relevance strengths must be finite and between zero and one.",
    );
}
