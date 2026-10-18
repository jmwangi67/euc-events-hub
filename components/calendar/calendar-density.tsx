import type {
  NonExamDay,
  NonExamDensitySegment,
} from "../../lib/domain/non-exam-scheduling";
import { nonExamDensityLabel } from "../../lib/domain/non-exam-scheduling";
import { sourceLabel, verificationLabel } from "../../lib/domain/source-labels";
import {
  addCalendarDays,
  formatAllDayDate,
  formatEventTime,
} from "../../lib/time/eastern";
import type { EventInput } from "@fullcalendar/core";

/** Background-only FullCalendar items never enter discovery counts or focus order. */
export function densityCalendarItems(
  segments: readonly NonExamDensitySegment[],
): EventInput[] {
  return segments
    .filter((segment) => segment.maximumConcurrent > 0)
    .map((segment) => ({
      id: `density:${segment.start}:${segment.end}`,
      start: segment.start,
      end: segment.end,
      display: "background",
      allDay: false,
      editable: false,
      classNames: ["scheduling-density-background", `density-${segment.band}`],
      extendedProps: { kind: "density" },
    }));
}

export function EventScopeLegend() {
  return (
    <section className="calendar-legend" aria-label="Event Scope">
      <h3>Event Scope</h3>
      <ul>
        <li>
          <span className="scope-swatch scope-engineering" aria-hidden="true" />
          Engineering
        </li>
        <li>
          <span className="scope-swatch scope-psu" aria-hidden="true" />
          PSU-wide
        </li>
        <li>
          <span className="scope-swatch scope-national" aria-hidden="true" />
          National
        </li>
        <li>
          <span className="scope-swatch scope-local" aria-hidden="true" />
          Local
        </li>
      </ul>
    </section>
  );
}

export function SchedulingDensityLegend({
  segments,
}: {
  segments?: readonly NonExamDensitySegment[];
}) {
  return (
    <section
      className="calendar-legend density-legend"
      aria-label="Scheduling Density"
    >
      <h3>Scheduling Density</h3>
      <ul>
        {(["none", "one", "two", "three-plus"] as const).map((band, index) => (
          <li key={band}>
            <span
              className={`density-swatch density-${band}`}
              aria-hidden="true"
            />
            {index === 3 ? "3+" : index} simultaneous{" "}
            {index === 1 ? "commitment" : "commitments"}
          </li>
        ))}
      </ul>
      <p className="field-help">
        Observed known-time non-exam commitment density: the maximum in any
        selected major × academic-level subgroup. Subgroups are not added
        together. Documented all-day commitments are listed separately; unknown
        hours stay as date-level cautions. These counts are not attendance
        estimates or pressure scores.
      </p>
      {segments && (
        <details className="density-interval-details">
          <summary>View known-time density intervals</summary>
          <ul>
            {segments
              .filter((segment) => segment.maximumConcurrent > 0)
              .map((segment) => (
                <li key={`${segment.start}:${segment.end}`}>
                  {formatEventTime({
                    allDay: false,
                    start: segment.start,
                    end: segment.end,
                  })}
                  : {nonExamDensityLabel(segment.maximumConcurrent)} in the most
                  affected subgroup.
                </li>
              ))}
            {!segments.some((segment) => segment.maximumConcurrent > 0) && (
              <li>No eligible known-time commitments in this range.</li>
            )}
          </ul>
        </details>
      )}
    </section>
  );
}

export function CalendarSchedulingGuidance({
  days,
  showDensity,
  list,
}: {
  days: readonly NonExamDay[];
  showDensity: boolean;
  list: boolean;
}) {
  const cautioned = days.filter((day) => day.primaryCaution);
  const priority = {
    "avoid-scheduling": 3,
    "scheduling-caution": 2,
    "review-conflicts": 1,
  };
  const highest = cautioned
    .map((day) => day.primaryCaution!)
    .sort(
      (a, b) =>
        Number(a.contextOnly) - Number(b.contextOnly) ||
        priority[b.guidance] - priority[a.guidance],
    )[0];
  const sameCaution = (day: NonExamDay) =>
    day.primaryCaution?.id === highest?.id &&
    day.primaryCaution?.guidance === highest?.guidance &&
    day.primaryCaution?.label === highest?.label;
  const start = highest ? cautioned.find(sameCaution)!.date : undefined;
  let end = start;
  for (const day of cautioned) {
    if (end && day.date === addCalendarDays(end, 1) && sameCaution(day))
      end = day.date;
  }
  const densityDays =
    showDensity && list ? days.filter((day) => day.maximumConcurrent > 0) : [];
  const badgeDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year:
      days[0]?.date.slice(0, 4) !== days.at(-1)?.date.slice(0, 4)
        ? "numeric"
        : undefined,
  });
  if (!highest && !densityDays.length) return null;
  return (
    <section
      className="calendar-scheduling-guidance"
      aria-label="Calendar scheduling guidance"
    >
      <h3>Scheduling guidance</h3>
      {highest && (
        <>
          <div
            className={`calendar-primary-caution caution-${highest.contextOnly ? "context" : highest.guidance}`}
          >
            <strong>
              <span aria-hidden="true">
                {highest.guidance === "avoid-scheduling" && !highest.contextOnly
                  ? "⛔"
                  : "⚠"}
              </span>{" "}
              {highest.label}
            </strong>
            <span>
              {highest.title} · {formatAllDayDate(start!)}
              {end !== start ? ` – ${formatAllDayDate(end!)}` : ""}
            </span>
            {highest.timingUncertain && (
              <span>Hours uncertain; review date-level guidance.</span>
            )}
          </div>
          <details className="calendar-guidance-details">
            <summary>
              View all scheduling reasons and sources for {cautioned.length}{" "}
              {cautioned.length === 1 ? "date" : "dates"}
            </summary>
            <ul>
              {cautioned.map((day) => (
                <li key={day.date} data-guidance-date={day.date}>
                  <details
                    className={`day-caution caution-${day.primaryCaution!.contextOnly ? "context" : day.primaryCaution!.guidance}`}
                  >
                    <summary>
                      <span className="guidance-date">
                        {formatAllDayDate(day.date)}
                      </span>
                      <span className="guidance-primary">
                        {day.primaryCaution!.label}
                      </span>
                      <span className="guidance-reason-count">
                        {day.cautions.length > 1
                          ? `${day.cautions.length} reasons`
                          : "Reason and source"}
                      </span>
                    </summary>
                    <ul className="day-caution-reasons">
                      {day.cautions.map((caution) => (
                        <li key={caution.id}>
                          <strong>
                            {caution.label} · {caution.title}
                          </strong>
                          <p>{caution.reason}</p>
                          {caution.timingUncertain && (
                            <p>
                              Timing is uncertain; no timed density is inferred.
                            </p>
                          )}
                          {caution.contextOnly && (
                            <p>
                              Context only; excluded from analytical scheduling
                              density.
                            </p>
                          )}
                          <p className="field-help">
                            {caution.sources
                              .map(
                                (source) =>
                                  `${sourceLabel(source)} · ${verificationLabel(source.verification)}`,
                              )
                              .join("; ")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
      {densityDays.length > 0 && (
        <ul className="density-date-labels">
          {densityDays.map((day) => (
            <li
              key={day.date}
              className="density-day-badge"
              data-density-band={day.band}
              aria-label={`${formatAllDayDate(day.date)}: peak known-time subgroup density, ${nonExamDensityLabel(day.maximumConcurrent)}`}
            >
              <span className="guidance-date">
                {badgeDate.format(new Date(`${day.date}T00:00:00Z`))}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {day.maximumConcurrent >= 3 ? "3+" : day.maximumConcurrent}{" "}
                timed max
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
