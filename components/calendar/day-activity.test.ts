import { createElement } from "react";
import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DayActivityDots } from "./day-activity";
import type { DisplayDay } from "./display-busyness";

it.each([
  [0, "Free"],
  [1, "Open"],
  [2, "Light"],
  [3, "Moderate"],
  [4, "Heavy"],
  [5, "Extreme"],
  [7, "Extreme"],
] as const)(
  "describes %i recorded commitments as %s without changing the count",
  (count, level) => {
    const day: DisplayDay = {
      date: "2026-10-21",
      items: Array.from({ length: count }, (_, i) => ({
        id: String(i),
        title: `Fictional activity ${i}`,
        timeLabel: "All day",
        visible: true,
      })),
      filled: Math.min(5, count),
    };
    const before = JSON.stringify(day);
    const html = renderToStaticMarkup(createElement(DayActivityDots, { day }));
    expect(html).toContain(
      `Busyness: ${level}, ${day.filled} of 5 activity dots`,
    );
    expect(html).toContain(`${count} calendar commitment`);
    expect(html).toContain(
      "PSU-wide and national events always included, even when hidden",
    );
    expect(html).toContain("not availability or a scheduling score");
    expect(html).toContain(
      `class="day-activity-label" aria-hidden="true">${level}`,
    );
    expect(html.match(/class="activity-dot(?: filled)?"/g)).toHaveLength(5);
    expect(html.match(/class="activity-dot filled"/g) ?? []).toHaveLength(
      day.filled,
    );
    expect(html.match(/viewBox="0 0 8 8" width="8" height="8"/g)).toHaveLength(
      5,
    );
    expect(
      html.match(/<circle cx="4" cy="4" r="3.5" stroke-width="1"/g),
    ).toHaveLength(5);
    expect(JSON.stringify(day)).toBe(before);
  },
);
