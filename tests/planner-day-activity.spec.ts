import { test, expect, type Page } from "@playwright/test";
import {
  openPlannerChoices,
  openPlannerAnalysis,
} from "./helpers/planner-controls";
async function sample(page: Page) {
  await page.goto("/planner");
  await openPlannerChoices(page);
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
}
const dot = (page: Page, date: string) =>
  page.locator(`.fc .day-activity-indicator[data-activity-date="${date}"]`);
async function capture(page: Page, name: string) {
  await page
    .locator(".calendar-region")
    .screenshot({ path: `work/dots-${name}.png` });
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("daily activity is beneath every Week date and large analysis blocks are below the grid and closed", async ({
  page,
}) => {
  await sample(page);
  await page.getByRole("button", { name: "1 Week", exact: true }).click();
  const headers = page.locator(".fc-col-header-cell");
  await expect(headers).toHaveCount(7);
  for (const header of await headers.all()) {
    const dots = header.locator(".day-activity-indicator");
    await expect(dots).toBeVisible();
    await expect(dots).toHaveAttribute("role", "img");
    await expect(dots).toHaveAttribute(
      "aria-label",
      /of 5 activity dots.*PSU-wide and national.*not availability or a scheduling score/,
    );
    await expect(dots.locator(".activity-dot")).toHaveCount(5);
    const date = header.locator(".planner-date-label");
    expect((await dots.boundingBox())!.y).toBeGreaterThanOrEqual(
      (await date.boundingBox())!.y + (await date.boundingBox())!.height,
    );
    expect(
      (await dots.locator(".day-activity-dots").boundingBox())!.height,
    ).toBeLessThanOrEqual(10);
    expect((await dots.boundingBox())!.height).toBeLessThanOrEqual(24);
  }
  const grid = (await page.locator(".calendar-surface").boundingBox())!;
  expect(
    (await page.locator(".calendar-week-actions").boundingBox())!.y,
  ).toBeGreaterThanOrEqual(grid.y + grid.height);
  await expect(page.locator(".pressure-preview")).toBeHidden();
  await expect(page.locator(".overall-pressure-pending")).toBeHidden();
  await expect(
    page.locator(".calendar-week-actions .weekly-counts"),
  ).toHaveCount(0);
  await capture(page, "week");
  await openPlannerAnalysis(page);
  await expect(
    page.getByRole("region", { name: "Exam Preparation", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".overall-pressure-pending")).toHaveAttribute(
    "data-overall-status",
    "awaiting-methodology-review",
  );
  const currentGrid = (await page.locator(".calendar-surface").boundingBox())!;
  expect(
    (await page.locator(".pressure-preview").boundingBox())!.y,
  ).toBeGreaterThanOrEqual(currentGrid.y + currentGrid.height);
});

test("activity reflects visible filters and changes filled dots without changing the independent analysis", async ({
  page,
}) => {
  await sample(page);
  await page.getByRole("button", { name: "1 Week", exact: true }).click();
  const monday = dot(page, "2026-10-19");
  await expect(monday).toHaveAttribute("data-activity-count", "2");
  await expect(monday).toHaveAttribute("data-activity-filled", "2");
  const reasons = await page
    .locator(".calendar-guidance-details")
    .textContent();
  await capture(page, "filter-before");
  await openPlannerChoices(page);
  await page.getByLabel("Show published events", { exact: true }).uncheck();
  await expect(monday).toHaveAttribute("data-activity-count", "1");
  await expect(monday.locator(".filled")).toHaveCount(1);
  await capture(page, "filter-after");
  await page.getByLabel("Show academic exams", { exact: true }).uncheck();
  await expect(monday).toHaveAttribute("data-activity-filled", "0");
  await expect(monday.locator(".filled")).toHaveCount(0);
  expect(await page.locator(".calendar-guidance-details").textContent()).toBe(
    reasons,
  );
});

test("PSU-wide and national events still contribute when every calendar layer is hidden", async ({
  page,
}) => {
  await sample(page);
  await page.getByLabel("Go to date", { exact: true }).fill("2026-10-25");
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await openPlannerChoices(page);
  for (const label of [
    "Show University Events",
    "Show published events",
    "Show academic exams",
    "Show Local commitments",
    "Show PSU-wide commitments",
    "Show national commitments",
  ]) {
    const control = page.getByLabel(label, { exact: true });
    await control.uncheck();
  }
  await expect(page.locator(".fc-event[data-calendar-event-id]")).toHaveCount(
    0,
  );
  await expect(dot(page, "2026-10-25")).toHaveAttribute(
    "data-activity-count",
    "2",
  );
  await expect(dot(page, "2026-10-25").locator(".filled")).toHaveCount(2);
  const context = page.locator(".planner-day-context");
  await context.locator(":scope > summary").click();
  await expect(context.locator("li")).toHaveCount(2);
  await expect(context).toContainText("Example Homecoming weekend");
  await expect(context).toContainText("Example Super Bowl scenario");
  await expect(context).toContainText(
    "Included even while its calendar layer is hidden",
  );
  await capture(page, "always-scopes");
});

test("Month and 2 Weeks use per-date dots, uniform tighter gaps and the existing integrated week details", async ({
  page,
}) => {
  await sample(page);
  const cells = page.locator(".fc-daygrid-day");
  await expect(
    page.locator(".fc-daygrid-day .day-activity-indicator"),
  ).toHaveCount(await cells.count());
  for (const cell of await cells.all()) {
    const date = await cell.getAttribute("data-date");
    await expect(cell.locator(".day-activity-indicator")).toHaveAttribute(
      "data-activity-date",
      date!,
    );
  }
  for (const date of ["2026-10-21", "2026-10-25"]) {
    const crowded = page.locator(`.fc-daygrid-day[data-date="${date}"]`);
    const boxes = await crowded
      .locator(".fc-daygrid-event:visible")
      .evaluateAll((nodes) =>
        nodes
          .map((n) => ({
            top: n.getBoundingClientRect().top,
            bottom: n.getBoundingClientRect().bottom,
          }))
          .sort((a, b) => a.top - b.top),
      );
    expect(boxes.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].top - boxes[i - 1].bottom).toBeGreaterThanOrEqual(3);
      expect(boxes[i].top - boxes[i - 1].bottom).toBeLessThanOrEqual(6);
    }
  }
  await expect(page.locator(".weekly-summary-column")).toBeVisible();
  await capture(page, "month-spacing");
  await page.getByRole("button", { name: "2 Weeks", exact: true }).click();
  await expect(
    page.locator(".fc-daygrid-day .day-activity-indicator"),
  ).toHaveCount(14);
  await expect(
    page.locator(".weekly-summary-column .weekly-summary-cell"),
  ).toHaveCount(2);
  await capture(page, "two-weeks");
});

test("Day has only day-specific context and local arrows preserve keyboard focus across dates and boundaries", async ({
  page,
}) => {
  await sample(page);
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.locator(".calendar-week-actions")).toHaveCount(0);
  await expect(page.locator(".weekly-summary-column")).toHaveCount(0);
  const context = page.locator(".planner-day-context");
  await expect(context.locator(":scope > summary")).toContainText(
    "Oct 21, 2026",
  );
  await context.locator(":scope > summary").focus();
  await page.keyboard.press("Enter");
  await expect(context).toContainText(
    "Example Event: Bioprocess industry discussion",
  );
  await expect(context).not.toContainText("Engineering welcome");
  await capture(page, "day-context");
  const prev = page.getByRole("button", { name: "Previous day", exact: true }),
    next = page.getByRole("button", { name: "Next day", exact: true });
  const grid = (await page.locator(".calendar-surface").boundingBox())!;
  const header = (await page.locator(".fc-col-header").boundingBox())!;
  for (const arrow of [prev, next]) {
    const bounds = (await arrow.boundingBox())!;
    expect(bounds.y).toBeGreaterThanOrEqual(grid.y);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(
      header.y + header.height + 1,
    );
  }
  expect((await prev.boundingBox())!.x - grid.x).toBeLessThan(8);
  expect(
    grid.x +
      grid.width -
      (await next.boundingBox())!.x -
      (await next.boundingBox())!.width,
  ).toBeLessThan(8);
  await next.focus();
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
    "2026-10-22",
  );
  await expect(next).toBeFocused();
  await expect(context.locator("summary")).toContainText("Oct 22, 2026");
  await prev.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
    "2026-10-21",
  );
  await expect(prev).toBeFocused();
  await page.getByLabel("Go to date", { exact: true }).fill("2026-12-31");
  await next.click();
  await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
    "2027-01-01",
  );
  await prev.click();
  await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
    "2026-12-31",
  );
});

for (const width of [320, 375, 430, 768, 1024, 1440])
  test(`daily headers and edge arrows remain aligned and accessible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 });
    await sample(page);
    if (width < 1024) {
      const headers = page.locator(".fc-list-day");
      await expect(
        headers.first().locator(".day-activity-indicator"),
      ).toBeVisible();
      for (const h of await headers.all()) {
        const labelledBy = await h
          .locator("th")
          .getAttribute("aria-labelledby");
        await expect(h.locator(`[id="${labelledBy}"]`)).toHaveText(/October/);
      }
    }
    await noOverflow(page);
    await page.getByRole("button", { name: "Day", exact: true }).click();
    const dots = page.locator(".fc-col-header .day-activity-indicator");
    await expect(dots).toHaveCount(1);
    const prev = page.getByRole("button", {
        name: "Previous day",
        exact: true,
      }),
      next = page.getByRole("button", { name: "Next day", exact: true });
    const d = (await dots.boundingBox())!,
      a = (await prev.boundingBox())!,
      b = (await next.boundingBox())!;
    expect(a.x + a.width).toBeLessThan(d.x);
    expect(b.x).toBeGreaterThan(d.x + d.width);
    await prev.focus();
    await page.keyboard.press("Space");
    await expect(prev).toBeFocused();
    await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
      "2026-10-20",
    );
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(next).toBeFocused();
    await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
      "2026-10-21",
    );
    const event = page
      .locator('[data-calendar-event-id="example-industry"]')
      .first();
    await event.focus();
    for (const key of ["Enter", "Space"]) {
      await page.keyboard.press(key);
      await expect(page.getByRole("dialog")).toContainText(
        "Bioprocess industry discussion",
      );
      await page.keyboard.press("Escape");
      await expect(event).toBeFocused();
    }
    await expect(event.locator(".fc-event-main")).toHaveCSS(
      "overflow",
      "hidden",
    );
    await noOverflow(page);
    await capture(page, `day-${width}`);
  });

test("empty mobile List still exposes the always-counted broad-scope activity without unhiding cards", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 1100 });
  await sample(page);
  await page.getByLabel("Go to date", { exact: true }).fill("2026-10-25");
  await openPlannerChoices(page);
  for (const label of [
    "Show published events",
    "Show academic exams",
    "Show Local commitments",
    "Show PSU-wide commitments",
    "Show national commitments",
  ])
    await page.getByLabel(label, { exact: true }).uncheck();
  await expect(page.locator(".fc-list-event")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Planning calendar with academic exams" }),
  ).toContainText("No visible planning items");
  await expect(
    page.locator('.empty-activity-dates [data-activity-date="2026-10-25"]'),
  ).toHaveAttribute("data-activity-count", "2");
  await noOverflow(page);
  await capture(page, "empty-list-broad-scopes");
});
