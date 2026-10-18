import {
  preparationLabel,
  preparationSegments,
} from "./preparation-presentation";
import styles from "./preparation.module.css";

export function PreparationRange({
  range,
  label = "Experimental relative preparation estimate",
}: {
  range: [number, number] | null;
  label?: string;
}) {
  const segments = preparationSegments(range);
  const value = (n: number) => Number(n.toFixed(3));
  const description =
    segments && range
      ? range[0] === range[1]
        ? `${label}: ${value(range[0])} out of 10. No uncertainty interval.`
        : `${label}: ${value(range[0])} to ${value(range[1])} out of 10. Solid to the lower bound; stripes show uncertainty up to the upper bound, not probability.`
      : `${label}: unavailable. No numerical estimate.`;
  return (
    <div className={styles.range} data-preparation-range="true">
      <p className={`preparation-value ${styles.value}`}>
        <span>{label}</span>
        <strong>
          {segments && range ? preparationLabel(range) : "Unavailable"}
        </strong>
      </p>
      <div className={styles.track} role="img" aria-label={description}>
        {segments ? (
          <>
            <span
              className={styles.solid}
              style={{ width: `${segments.solid}%` }}
              data-range-part="solid"
            />
            {segments.uncertainty > 0 && (
              <span
                className={styles.uncertainty}
                style={{ width: `${segments.uncertainty}%` }}
                data-range-part="uncertainty"
              />
            )}
            <span
              className={styles.unfilled}
              style={{ width: `${segments.unfilled}%` }}
              data-range-part="unfilled"
            />
          </>
        ) : (
          <span className={styles.unavailable}>No numerical estimate</span>
        )}
      </div>
    </div>
  );
}
