import { test, expect, type Page, type Locator } from "@playwright/test";
import { openPlannerChoices } from "./helpers/planner-controls";

async function sample(page: Page) {
  await page.goto("/planner");
  await openPlannerChoices(page);
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
}
const cell = (page: Page, date = "2026-10-21") =>
  page.locator(`.fc-daygrid-day[data-date="${date}"]`);
const cases = [
  ["2026-10-18", 0, "Free"],
  ["2026-10-26", 1, "Open"],
  ["2026-10-19", 2, "Light"],
  ["2026-10-24", 3, "Moderate"],
  ["2026-10-25", 4, "Heavy"],
  ["2026-10-21", 5, "Extreme"],
] as const;

async function indicatorGeometry(indicator: Locator) {
  const label = indicator.locator(".day-activity-label");
  const dots = indicator.locator(".day-activity-dots");
  const row = (await dots.boundingBox())!,
    word = (await label.boundingBox())!;
  expect(
    Math.abs(row.x + row.width / 2 - (word.x + word.width / 2)),
  ).toBeLessThan(1);
  expect(word.y + word.height).toBeLessThanOrEqual(row.y);
  expect(row.height).toBeLessThanOrEqual(8);
  expect(word.height).toBe(12);
  const circles = await dots.locator(".activity-dot").evaluateAll((nodes) =>
    nodes.map((n) => {
      const b = n.getBoundingClientRect(),
        s = getComputedStyle(n);
      return {
        x: b.x,
        width: b.width,
        height: b.height,
        border: s.borderTopWidth,
        radius: s.borderRadius,
        sizing: s.boxSizing,
      };
    }),
  );
  expect(circles).toHaveLength(5);
  for (const [i, circle] of circles.entries()) {
    expect(circle.width).toBe(6);
    expect(circle.height).toBe(6);
    expect(circle.border).toBe("1px");
    expect(circle.radius).toBe("50%");
    expect(circle.sizing).toBe("border-box");
    if (i) expect(circle.x - circles[i - 1].x).toBe(9);
  }
}
async function preview(page: Page, name: string) {
  await page
    .locator(".calendar-region")
    .screenshot({ path: `work/refinement-${name}.png` });
}

test("all six labels have equal circular dots, accessible counts and the requested color mapping", async ({
  page,
}) => {
  await sample(page);
  const colors = [
    null,
    "rgb(21, 128, 61)",
    "rgb(21, 128, 61)",
    "rgb(161, 98, 7)",
    "rgb(194, 65, 12)",
    "rgb(185, 28, 28)",
  ];
  for (const [date, filled, level] of cases) {
    const indicator = cell(page, date).getByRole("img");
    await expect(indicator).toHaveAttribute(
      "data-activity-filled",
      String(filled),
    );
    await expect(indicator.locator(".day-activity-label")).toHaveText(level);
    await expect(indicator).toHaveAccessibleName(
      new RegExp(
        `Busyness: ${level}, ${filled} of 5 activity dots.*not availability or a scheduling score`,
      ),
    );
    await expect(indicator.locator(".activity-dot.filled")).toHaveCount(filled);
    await expect(indicator.locator(".activity-dot:not(.filled)")).toHaveCount(
      5 - filled,
    );
    await indicatorGeometry(indicator);
    for (const empty of await indicator
      .locator(".activity-dot:not(.filled)")
      .all()) {
      await expect(empty).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(empty).toHaveCSS("border-top-color", "rgb(71, 85, 105)");
    }
    if (filled)
      await expect(indicator.locator(".filled").first()).toHaveCSS(
        "background-color",
        colors[filled]!,
      );
    const header = cell(page, date).locator(".fc-daygrid-day-top");
    const hb = (await header.boundingBox())!,
      ib = (await indicator.boundingBox())!;
    expect(Math.abs(hb.x + hb.width / 2 - (ib.x + ib.width / 2))).toBeLessThan(
      1,
    );
    const dateBox = (await cell(page, date)
      .locator(".planner-cell-date > span")
      .first()
      .boundingBox())!;
    expect(dateBox.y + dateBox.height).toBeLessThanOrEqual(ib.y);
    for (const event of await cell(page, date)
      .locator(".fc-daygrid-event:visible")
      .all())
      expect((await event.boundingBox())!.y).toBeGreaterThanOrEqual(
        ib.y + ib.height,
      );
  }
  await expect(cell(page).getByRole("img")).toHaveAttribute(
    "data-activity-count",
    "8",
  );
  for (const selector of [".fc-daygrid-day-top", ".fc-daygrid-day-number"]) {
    for (const header of await page.locator(`.fc-day-other ${selector}`).all())
      await expect(header).toHaveCSS("opacity", "1");
  }
  await preview(page, "month");
});

for (const view of ["Month", "2 Weeks"])
  test(`${view} only offers overflow for additional hidden cards, including filter rerenders`, async ({
    page,
  }) => {
    await sample(page);
    await page.getByRole("button", { name: view, exact: true }).click();
    const cards = cell(page).locator(".fc-daygrid-event:visible");
    const more = cell(page).locator(".fc-daygrid-more-link");
    await expect(cards).toHaveCount(4);
    await expect(more).toHaveText("+4 more");
    await more.focus();
    await page.keyboard.press("Enter");
    const popup = page.locator(".fc-popover");
    await expect(popup.locator("[data-calendar-event-id]")).toHaveCount(8);
    const shown = await cards.evaluateAll((ns) =>
      ns.map((n) => (n as HTMLElement).dataset.calendarEventId),
    );
    const all = await popup
      .locator("[data-calendar-event-id]")
      .evaluateAll((ns) =>
        ns.map((n) => (n as HTMLElement).dataset.calendarEventId),
      );
    expect(all.filter((id) => !shown.includes(id))).toHaveLength(4);
    const hidden = popup.locator('[data-calendar-event-id="example-social"]');
    await hidden.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("dialog")).toContainText(
      "Design community game night",
    );
    await page.keyboard.press("Escape");
    await expect(hidden).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await openPlannerChoices(page);
    await page.getByLabel("Show published events", { exact: true }).uncheck();
    await expect(cards).toHaveCount(4);
    await expect(more).toHaveText("+1 more");
    await page
      .getByLabel("Show national commitments", { exact: true })
      .uncheck();
    await expect(cards).toHaveCount(4);
    await expect(more).toHaveCount(0);
    await page
      .getByLabel("Show PSU-wide commitments", { exact: true })
      .uncheck();
    await expect(cards).toHaveCount(3);
    await expect(more).toHaveCount(0);
    // Hidden broad-scope records still count toward dots, never toward overflow.
    await expect(cell(page).getByRole("img")).toHaveAttribute(
      "data-activity-count",
      "5",
    );
    const concert = cell(page).locator(
      '[data-calendar-event-id="external:scenario-concert"]',
    );
    await concert.click();
    await expect(page.getByRole("dialog")).toContainText(
      "Example major concert",
    );
    await page.keyboard.press("Escape");
    await expect(concert).toBeFocused();
    // Shorter filtered rows must still fit the independent summary controls.
    const summary = page.locator(".weekly-summary-cell").filter({
      has: page.locator('[data-calendar-event-id="week:2026-10-18"]'),
    });
    const details = summary.locator(".weekly-summary-trigger > .field-help");
    const focus = summary.locator(".focus-week-control");
    await expect
      .poll(async () => {
        const a = (await details.boundingBox())!,
          b = (await focus.boundingBox())!;
        return b.y - (a.y + a.height);
      })
      .toBeGreaterThanOrEqual(4);
    await preview(page, `fits-${view === "Month" ? "month" : "two-weeks"}`);
    await page
      .getByRole("button", { name: "Next date range", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Previous date range", exact: true })
      .click();
    await expect(cards).toHaveCount(3);
    await expect(more).toHaveCount(0);
    await openPlannerChoices(page);
    await page.getByLabel("Show published events", { exact: true }).check();
    await page.getByLabel("Show national commitments", { exact: true }).check();
    await page.getByLabel("Show PSU-wide commitments", { exact: true }).check();
    await expect(cards).toHaveCount(4);
    await expect(more).toHaveText("+4 more");
    await preview(page, `dense-${view === "Month" ? "month" : "two-weeks"}`);
  });

test("hourly overflow disappears when all three overlapping events fit and returns for a genuinely hidden event", async ({
  page,
}) => {
  await sample(page);
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await openPlannerChoices(page);
  await page.getByLabel("Show national commitments", { exact: true }).uncheck();
  await page.getByLabel("Show Local commitments", { exact: true }).uncheck();
  const events = page.locator(
    ".fc-timegrid-col-events [data-calendar-event-id]",
  );
  await expect(events).toHaveCount(4); // One earlier event, three overlapping evening events.
  await expect(page.locator(".fc-timegrid-more-link")).toHaveCount(0);
  await page.getByLabel("Show national commitments", { exact: true }).check();
  const more = page.locator(".fc-timegrid-more-link");
  await expect(more).toHaveText("+1 more");
  await more.focus();
  await page.keyboard.press("Space");
  const hidden = page.locator(".fc-popover [data-calendar-event-id]");
  await expect(hidden).toHaveCount(1);
  const id = await hidden.getAttribute("data-calendar-event-id");
  await expect(
    page.locator(`.fc-timegrid-col-events [data-calendar-event-id="${id}"]`),
  ).toHaveCount(0);
  await hidden.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(hidden).toBeFocused();
});

for (const width of [320, 375, 430, 768, 1024, 1440])
  test(`label and dots stay centered without overlap at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 });
    await sample(page);
    for (const indicator of await page
      .locator(".fc .day-activity-indicator")
      .all())
      await indicatorGeometry(indicator);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await preview(page, `responsive-${width}`);
    await page.getByRole("button", { name: "Day", exact: true }).click();
    const indicator = page.locator(".fc-col-header .day-activity-indicator");
    await indicatorGeometry(indicator);
    const b = (await indicator.boundingBox())!,
      header = (await page.locator(".fc-col-header-cell").boundingBox())!;
    expect(
      Math.abs(b.x + b.width / 2 - (header.x + header.width / 2)),
    ).toBeLessThan(1);
    await expect(
      page.getByRole("button", { name: "Previous day", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".timezone-label")).toHaveText(
      "All Times Eastern (ET)",
    );
    await preview(page, `day-${width}`);
  });
