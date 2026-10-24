import { openPlannerChoices } from "./helpers/planner-controls";
import { test, expect, type Page } from "@playwright/test";
async function sample(page: Page) {
  await page.goto("/planner");
  await openPlannerChoices(page);
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
}
async function analyze(page: Page) {
  await page
    .getByRole("button", { name: "Analyze proposal", exact: true })
    .click();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function aligned(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const rows = [
          ...document.querySelectorAll(".fc-daygrid-body > table > tbody > tr"),
        ];
        const summaries = [
          ...document.querySelectorAll(
            ".weekly-summary-column .weekly-summary-cell",
          ),
        ];
        return (
          rows.length === summaries.length &&
          rows.every(
            (row, index) =>
              Math.abs(
                row.getBoundingClientRect().top -
                  summaries[index].getBoundingClientRect().top,
              ) < 2 &&
              Math.abs(
                row.getBoundingClientRect().height -
                  summaries[index].getBoundingClientRect().height,
              ) < 2,
          )
        );
      }),
    )
    .toBe(true);
}
test("planner has five distinct views with hourly grids only in 1 Week and Day", async ({
  page,
}) => {
  await sample(page);
  await analyze(page);
  for (const [name, selector, hourly] of [
    ["Month", ".fc-dayGridMonth-view", false],
    ["2 Weeks", ".fc-dayGridTwoWeeks-view", false],
    ["1 Week", ".fc-timeGridWeek-view", true],
    ["Day", ".fc-timeGridDay-view", true],
    ["List", ".fc-listMonth-view", false],
  ] as const) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator(".fc-timegrid-body")).toHaveCount(hourly ? 1 : 0);
    await expect(page.locator(".pressure-preview")).toHaveCount(hourly ? 1 : 0);
    await expect(page.locator(".experimental-day-preparation")).toHaveCount(0);
    if (hourly)
      await expect(page.locator(".overall-pressure-pending")).toContainText(
        "Awaiting methodology review",
      );
    if (name === "Month" || name === "2 Weeks") await aligned(page);
    if (name === "List") {
      await expect(page.locator(".fc-list-day").first()).toContainText(
        "Monday, October 19",
      );
      expect(
        await page
          .locator(".fc-list-day")
          .evaluateAll((headers) =>
            headers.every((header) => Boolean(header.textContent?.trim())),
          ),
      ).toBe(true);
    }
    await noOverflow(page);
    await page.locator(".calendar-region").screenshot({
      path: `work/refined-${name.replaceAll(" ", "-").toLowerCase()}-1440.png`,
    });
  }
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Week", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "2 Weeks", exact: true }),
  ).toHaveCount(0);
});
test("two weeks uses two Sunday–Saturday rows across years and navigates by a fortnight", async ({
  page,
}) => {
  await sample(page);
  await page.getByLabel("Go to date", { exact: true }).fill("2026-12-31");
  await page.getByRole("button", { name: "2 Weeks", exact: true }).click();
  await expect(
    page.locator(".fc-daygrid-body > table > tbody > tr"),
  ).toHaveCount(2);
  await expect(page.locator(".fc-col-header-cell")).toHaveCount(7);
  await expect(
    page.locator(".weekly-summary-column .weekly-summary-cell"),
  ).toHaveCount(2);
  await expect(page.locator(".fc-timegrid-body")).toHaveCount(0);
  await expect(
    page.locator('.fc-daygrid-day[data-date="2026-12-27"]'),
  ).toBeVisible();
  await expect(
    page.locator('.fc-daygrid-day[data-date="2027-01-09"]'),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Next date range", exact: true })
    .click();
  await expect(
    page.locator('.fc-daygrid-day[data-date="2027-01-10"]'),
  ).toBeVisible();
  await aligned(page);
});
test("BME + CHE preparation is per subgroup and unmapped exams add no numerical burden", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByLabel("Biomedical Engineering (BME)", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Upperclassmen", exact: true })
    .click();
  await page.getByLabel("Start date", { exact: true }).fill("2026-10-27");
  await page.getByLabel("End date", { exact: true }).fill("2026-10-27");
  await analyze(page);
  await page
    .getByLabel("Inspect experimental proposal preparation", { exact: true })
    .check();
  const factors = page.locator(".proposal-factors");
  await expect(factors).toContainText("BME · Third year");
  await expect(factors).toContainText("CHE · Third year");
  await expect(factors).toContainText(
    "Cells are never added or population averaged",
  );
  await factors
    .getByText("Advanced methodology & sources", { exact: true })
    .click();
  await factors
    .getByText("Inspect all distinct subgroup estimates (2 groups)", {
      exact: true,
    })
    .first()
    .click();
  const bme = factors
    .locator(".preparation-cell")
    .filter({ has: page.getByRole("heading", { name: /BME · Third year/ }) })
    .first();
  await expect(bme).toContainText("EXAMPLE-UPPER-BIOMEDICAL");
  await expect(bme).not.toContainText("EXAMPLE-UPPER-PROCESS");
  const che = factors
    .locator(".preparation-cell")
    .filter({ has: page.getByRole("heading", { name: /CHE · Third year/ }) })
    .first();
  await expect(che).toContainText("EXAMPLE-UPPER-PROCESS");
  await expect(che).not.toContainText("EXAMPLE-UPPER-BIOMEDICAL");
  await sample(page);
  await analyze(page);
  await expect(
    page.locator(".proposal-factors .audience-uncertainty"),
  ).toContainText("EXAMPLE-UNMAPPED-COURSE");
  await expect(
    page.locator(".proposal-factors .audience-uncertainty"),
  ).toContainText("no numerical preparation");
});
test("eligibility explanations and preparation stay independent of display layers", async ({
  page,
}) => {
  await sample(page);
  await analyze(page);
  await expect(page.locator(".proposal-factors")).toContainText(
    "Context only, excluded from analytical factors: Example major concert",
  );
  await page.getByRole("button", { name: "1 Week", exact: true }).click();
  await expect(page.locator(".overall-pressure-pending")).toHaveAttribute(
    "data-overall-status",
    "awaiting-methodology-review",
  );
  await expect(page.locator(".preparation-value")).toHaveCount(0);
  await page
    .getByLabel("Preview experimental exam preparation", { exact: true })
    .check();
  const values = await page.locator(".preparation-value").allTextContents();
  await expect(page.locator(".pressure-preview")).toContainText(
    "Preparation for next week",
  );
  for (const label of [
    "Show published events",
    "Show academic exams",
    "Show PSU-wide commitments",
    "Show Local commitments",
    "Show national commitments",
  ])
    await page.getByLabel(label, { exact: true }).uncheck();
  await expect(page.locator(".preparation-value")).toHaveText(values);
  await expect(page.locator(".proposal-factors")).toContainText(
    "Example major concert",
  );
  await expect(page.locator(".overall-pressure-pending")).not.toContainText(
    /Overall.*\d+\s*\/\s*10|Low pressure|Moderate pressure|High pressure/,
  );
  expect(
    (await page.locator(".preparation-value").allTextContents()).join(" "),
  ).not.toMatch(/\d+\.\d/);
  await page
    .locator(".planner-display")
    .screenshot({ path: "work/refined-visibility-hidden.png" });
  await page
    .locator(".calendar-region")
    .screenshot({ path: "work/refined-preparation-enabled-1440.png" });
});
test("Sunday week controls provide logical keyboard access and restore focus across compact resizing", async ({
  page,
}) => {
  await sample(page);
  const trigger = page.getByRole("button", {
    name: /^View 1 Week: Oct 18, 2026/,
  });
  await trigger.focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible();
  await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
    "2026-10-18",
  );
  const summary = page.getByRole("button", {
    name: /^Weekly summary: Oct 18, 2026/,
  });
  await expect(summary).toHaveAttribute(
    "aria-label",
    /College-wide.*PSU-wide.*audience-uncertain/,
  );
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.setViewportSize({ width: 375, height: 1100 });
  await expect(page.locator(".fc-listMonth-view")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(summary).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(summary).toBeFocused();
});
test("compact weekly summaries are reachable above the chronological list and empty weeks are concise", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 1100 });
  await sample(page);
  const summaries = page.locator(".compact-weekly-summaries");
  const list = page.locator(".fc-listMonth-view");
  expect((await summaries.boundingBox())!.y).toBeLessThan(
    (await list.boundingBox())!.y,
  );
  await expect(
    summaries.getByRole("button", { name: /Weekly summary: Oct 18, 2026/ }),
  ).toBeVisible();
  await page
    .getByLabel("Show weekly summary for", { exact: true })
    .selectOption("2026-10-04");
  await expect(summaries.locator(".weekly-counts")).toHaveCount(0);
  expect(
    (await summaries.locator(".weekly-summary-cell").boundingBox())!.height,
  ).toBeLessThan(130);
  await page
    .getByLabel("Show weekly summary for", { exact: true })
    .selectOption("2026-10-18");
  await expect(summaries.locator(".weekly-counts")).toBeVisible();
});
for (const width of [320, 375, 430, 768, 1024, 1280, 1440])
  test(`refined planner no overflow and aligned summaries at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1100 });
    await sample(page);
    await analyze(page);
    await noOverflow(page);
    if (width >= 1024) await aligned(page);
    else await expect(page.locator(".weekly-summary-column")).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `work/refined-planner-${width}.png`,
      fullPage: true,
    });
    await page
      .locator(".calendar-region")
      .screenshot({ path: `work/refined-calendar-${width}.png` });
    expect(errors).toEqual([]);
  });
test("five- and six-row months remain aligned after filtering and resizing", async ({
  page,
}) => {
  await sample(page);
  await expect(
    page.locator(".weekly-summary-column .weekly-summary-cell"),
  ).toHaveCount(5);
  await aligned(page);
  await page.getByLabel("Go to date", { exact: true }).fill("2026-08-15");
  await expect(
    page.locator(".weekly-summary-column .weekly-summary-cell"),
  ).toHaveCount(6);
  await aligned(page);
  await page.setViewportSize({ width: 1024, height: 1100 });
  await aligned(page);
  await noOverflow(page);
  await page.getByLabel("Show academic exams", { exact: true }).uncheck();
  await aligned(page);
  await page.setViewportSize({ width: 768, height: 1100 });
  await expect(page.locator(".weekly-summary-column")).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await aligned(page);
  await noOverflow(page);
});
test("200 percent equivalent browser reflow retains keyboard controls and compact grouping", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 720, height: 550 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await sample(page);
  await noOverflow(page);
  await expect(page.locator(".fc-listMonth-view")).toBeVisible();
  await page.getByRole("button", { name: "Day", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".fc-timeGridDay-view")).toBeVisible();
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(
    page.locator(".mobile-calendar .fc-list-day").first(),
  ).toContainText("Monday, October 19");
  await noOverflow(page);
  await page.screenshot({
    path: "work/refined-reflow-200.png",
    fullPage: true,
  });
  await context.close();
});
