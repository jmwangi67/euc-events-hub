import { openPlannerChoices } from "./helpers/planner-controls";
import { test, expect, type Page } from "@playwright/test";
const panel = (page: Page) => page.locator(".conflict-panel");
async function sample(page: Page) {
  await page.goto("/planner");
  await openPlannerChoices(page);
  await page.getByRole("button", { name: "Load sample scenario" }).click();
}
async function interval(
  page: Page,
  date: string,
  start: string,
  end: string,
  endDate = date,
) {
  await page.getByLabel("Start date", { exact: true }).fill(date);
  await page.getByLabel("Start time", { exact: true }).fill(start);
  await page.getByLabel("End date", { exact: true }).fill(endDate);
  await page.getByLabel("End time", { exact: true }).fill(end);
}
const analyze = (page: Page) =>
  page.getByRole("button", { name: "Analyze proposal", exact: true }).click();

test("planner navigation, independent display and explanatory synthetic conflicts", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Student calendar", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page
    .getByRole("link", { name: "Organization planner", exact: true })
    .click();
  await expect(page).toHaveURL(/\/planner$/);
  await openPlannerChoices(page);
  await expect(
    page.getByRole("link", { name: "Organization planner", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Load sample scenario" }).click();
  await expect(page.locator("#audience-summary")).toHaveText(
    "Analyzing for: CHE",
  );
  await analyze(page);
  await expect(panel(page)).toContainText(
    "1 interval overlap · 1 date-level warning",
  );
  await expect(panel(page)).toContainText("explicitly targets");
  await expect(panel(page)).toContainText("Only the exam date is known");
  await expect(panel(page)).toContainText(
    "Verification: Demo data — not verified",
  );
  await page.getByLabel("Show published events", { exact: true }).uncheck();
  await page.getByLabel("Show academic exams", { exact: true }).uncheck();
  await page.getByLabel("Show PSU-wide commitments", { exact: true }).uncheck();
  await page.getByLabel("Show Local commitments", { exact: true }).uncheck();
  await page.getByLabel("Show national commitments", { exact: true }).uncheck();
  await expect(page.locator(".calendar-region .fc-event")).toHaveCount(1); // local proposal only
  await expect(panel(page)).toContainText(
    "1 interval overlap · 1 date-level warning",
  );
  await expect(
    panel(page).getByRole("button", { name: /Bioprocess industry/ }),
  ).toBeVisible();
  await page.getByLabel("Go to date", { exact: true }).fill("2026-12-31");
  await expect(page.locator(".calendar-region .fc-event")).toHaveCount(0);
  await expect(panel(page)).toContainText(
    "1 interval overlap · 1 date-level warning",
  );
  await page
    .getByRole("link", { name: "Student calendar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Hey, find your next event here!",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Search events", { exact: true })).toBeVisible();
});

test("exam overlays preserve unknown clocks and keyboard dialog focus", async ({
  page,
}) => {
  await sample(page);
  await analyze(page);
  await page.getByRole("button", { name: "List", exact: true }).click();
  const trigger = page
    .locator(".calendar-region")
    .getByRole("button", { name: /Academic Exam EXAMPLE-MATH/ });
  await expect(trigger).toContainText("Time unknown");
  await expect(trigger).not.toContainText(/12:00|00:00/);
  for (const key of ["Enter", "Space"]) {
    await trigger.focus();
    await page.keyboard.press(key);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("not a confirmed timed overlap");
    await expect(dialog).toContainText(
      "Verification: Demo data — not verified",
    );
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Close exam details" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
  const event = panel(page).getByRole("button", {
    name: /Bioprocess industry/,
  });
  await event.click();
  await expect(page.getByRole("dialog")).toContainText("4:00–5:00 PM");
  await page.keyboard.press("Escape");
  await expect(event).toBeFocused();
});

test("organization defaults, explicit audience requirement, overrides and known exam times", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByLabel("Example organization", { exact: true })
    .selectOption("example-council");
  await expect(page.locator("#audience-help")).toContainText(
    "No default audience",
  );
  await analyze(page);
  await expect(page.locator(".proposal-form").getByRole("alert")).toContainText(
    "Select at least one planning major",
  );
  await expect(page.locator(".proposal-form").getByRole("alert")).toBeFocused();
  await page
    .getByLabel("Example organization", { exact: true })
    .selectOption("example-design");
  await expect(
    page.getByLabel("Biomedical Engineering (BME)", { exact: true }),
  ).toBeChecked();
  await expect(
    page.getByLabel("Mechanical Engineering (ME)", { exact: true }),
  ).toBeChecked();
  await page
    .getByLabel("Biomedical Engineering (BME)", { exact: true })
    .uncheck();
  await expect(page.locator("#audience-summary")).toHaveText(
    "Analyzing for: ME",
  );
  await interval(page, "2026-10-22", "19:30", "20:00");
  await analyze(page);
  await expect(panel(page)).toContainText("Known-time academic exam overlap");
  await expect(panel(page)).toContainText("EXAMPLE-PHYSICS");
  await expect(panel(page)).toContainText("7:00–8:30 PM");
  await expect(panel(page)).toContainText("Relevant majors: ME");
  await page.getByLabel("Start time", { exact: true }).fill("20:30");
  await page.getByLabel("End time", { exact: true }).fill("21:00");
  await analyze(page);
  await expect(panel(page)).toContainText(
    "No conflicts found in the available sample data",
  );
  await expect(panel(page)).toContainText("does not mean the date is free");
});

test("validates Eastern rollover, spring gaps and explicit fall occurrences", async ({
  page,
}) => {
  await sample(page);
  await interval(page, "2026-10-21", "18:00", "17:00");
  await analyze(page);
  await expect(page.locator(".proposal-form").getByRole("alert")).toContainText(
    "End must be after start",
  );
  await interval(page, "2026-03-08", "02:30", "03:30");
  await analyze(page);
  await expect(page.locator(".proposal-form").getByRole("alert")).toContainText(
    "does not exist in Eastern Time",
  );
  await interval(page, "2026-11-01", "01:30", "01:15");
  await analyze(page);
  await expect(page.locator(".proposal-form").getByRole("alert")).toContainText(
    "occurs twice",
  );
  await page
    .getByLabel("Start repeated-time occurrence", { exact: true })
    .selectOption("first");
  await page
    .getByLabel("End repeated-time occurrence", { exact: true })
    .selectOption("second");
  await analyze(page);
  await expect(page.locator(".proposal-form").getByRole("alert")).toHaveCount(
    0,
  );
  await expect(panel(page)).toContainText("45 min elapsed");
  await interval(page, "2026-10-26", "23:30", "00:30", "2026-10-27");
  await page
    .getByLabel("Biomedical Engineering (BME)", { exact: true })
    .check();
  await analyze(page);
  await expect(panel(page)).toContainText("Late design session");
  await expect(panel(page)).toContainText("Oct 27, 2026");
});

for (const width of [320, 375, 430, 768, 1440]) {
  test(`planner responsive workflow at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 1100 });
    await sample(page);
    await analyze(page);
    await expect(panel(page)).toContainText(
      "1 interval overlap · 1 date-level warning",
    );
    await expect(page.locator(".timezone-label")).toHaveText(
      "All Times Eastern (ET)",
    );
    await expect(page.locator("body")).not.toContainText(/\b(?:EST|EDT)\b/);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `work/planner-${width}.png`,
      fullPage: true,
    });
    const trigger = panel(page).getByRole("button", {
      name: "Academic Exam EXAMPLE-MATH",
      exact: true,
    });
    await trigger.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("dialog")).toBeVisible();
    const box = await page.getByRole("dialog").boundingBox();
    expect(box!.width).toBeLessThan(width);
    await page.screenshot({
      path: `work/planner-exam-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test("exam focus stays in the calendar after responsive rerendering with a duplicate analysis trigger", async ({
  page,
}) => {
  await sample(page);
  await analyze(page);
  const trigger = page
    .locator(".calendar-region")
    .getByRole("button", { name: /Academic Exam EXAMPLE-MATH/ });
  await trigger.focus();
  const original = await trigger.elementHandle();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.setViewportSize({ width: 375, height: 1100 });
  await expect(
    page.locator(".calendar-region .fc-listMonth-view"),
  ).toBeAttached();
  expect(await original!.evaluate((element) => element.isConnected)).toBe(
    false,
  );
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(
    panel(page).getByRole("button", {
      name: "Academic Exam EXAMPLE-MATH",
      exact: true,
    }),
  ).not.toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
