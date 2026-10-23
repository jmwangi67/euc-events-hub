import { test, expect } from "@playwright/test";
import { openPlannerChoices } from "./helpers/planner-controls";

const studentIds = [
  "example-council",
  "example-process",
  "example-design",
  "psu-bmes",
  "psu-swe",
];
const event = (page: import("@playwright/test").Page, id: string) =>
  page.locator(`.calendar-region [data-calendar-event-id="${id}"]`).first();

for (const width of [320, 375, 768, 1440]) {
  test(`student-only organizations and independent University Events discovery at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?date=2026-11-16&view=listMonth&organizations=psu-bme");
    await expect(page.locator(".fc-event")).toHaveCount(10);
    if (width < 1024)
      await page.getByRole("button", { name: /Show filters/ }).click();
    const organizations = page
      .locator(".filters-panel .filter-group")
      .filter({ has: page.locator("summary", { hasText: "Organizations" }) });
    await expect(organizations.getByRole("checkbox")).toHaveCount(5);
    for (const name of [
      "Penn State College of Engineering",
      "Penn State Department of Biomedical Engineering",
      "Penn State Department of Materials Science and Engineering",
      "Example community host — classification unavailable",
    ])
      await expect(organizations.getByLabel(name, { exact: true })).toHaveCount(
        0,
      );
    await expect(
      organizations.getByLabel("Society of Women Engineers", { exact: true }),
    ).toBeVisible();
    await expect(
      organizations.getByRole("checkbox", {
        name: /Biomedical Engineering Society/,
      }),
    ).toBeVisible();

    const university = page.getByLabel("University Events", { exact: true });
    await university.check();
    await expect(page.locator(".fc-event")).toHaveCount(7);
    await expect(page).toHaveURL(/university=1/);
    await expect(page).not.toHaveURL(/organizations=/);
    await expect(event(page, "discovery-bme")).toBeVisible();
    await expect(event(page, "discovery-student")).toHaveCount(0);
    await expect(
      event(page, "discovery-cohost").locator(".hosting-badge svg"),
    ).toHaveCount(2);
    await page.reload();
    if (width < 1024)
      await page.getByRole("button", { name: /Show filters/ }).click();
    await expect(university).toBeChecked();
    await page.goBack();
    await expect(university).not.toBeChecked();
    await expect(page.locator(".fc-event")).toHaveCount(10);
    await page.goForward();
    await expect(university).toBeChecked();
    await page
      .getByLabel("Biomedical Engineering (BME)", { exact: true })
      .check();
    await expect(event(page, "discovery-matse")).toBeVisible();
    const trigger = event(page, "discovery-matse");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toContainText(
      "Penn State Department of Materials Science and Engineering",
    );
    await expect(page.getByRole("dialog")).toContainText(
      "Penn State College of Earth and Mineral Sciences",
    );
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await organizations
      .getByRole("checkbox", { name: /Biomedical Engineering Society/ })
      .check();
    await expect(page.locator(".fc-event")).toHaveCount(2);
    await expect(event(page, "discovery-dept-cohost")).toBeVisible();
    await page
      .getByRole("button", { name: "Clear filters", exact: true })
      .first()
      .click();
    await expect(university).not.toBeChecked();
    await expect(page.locator(".fc-event")).toHaveCount(10);
    await university.check();
    for (const name of [
      "Majors",
      "Student organization clusters",
      "Event Categories",
    ]) {
      const group = page.locator(".filters-panel .filter-group").filter({
        has: page.locator("summary", { hasText: new RegExp(name, "i") }),
      });
      if (await group.evaluate((el) => (el as HTMLDetailsElement).open))
        await group.locator("summary").click();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `work/membership-student-${width}.png`,
      fullPage: true,
    });
    if (width < 1024) {
      await page.getByRole("button", { name: /Hide filters/ }).click();
      await expect(page.locator(".filter-count")).toHaveText("1 active filter");
    }
  });

  test(`planner student-only proposal host and display-only university layer at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/planner");
    await page
      .getByRole("button", { name: "Load sample scenario", exact: true })
      .click();
    await openPlannerChoices(page);
    const selector = page.getByLabel("Example organization", { exact: true });
    expect(
      await selector
        .locator("option")
        .evaluateAll((options) =>
          options.map((option) => (option as HTMLOptionElement).value),
        ),
    ).toEqual(studentIds);
    await selector.selectOption("psu-bmes");
    await expect(selector).toHaveValue("psu-bmes");
    await selector.selectOption("example-process");
    await page
      .getByLabel("Biomedical Engineering (BME)", { exact: true })
      .check();
    await page.getByLabel("Start date", { exact: true }).fill("2026-11-16");
    await page.getByLabel("End date", { exact: true }).fill("2026-11-16");
    await page.getByLabel("Start time", { exact: true }).fill("13:15");
    await page.getByLabel("End time", { exact: true }).fill("13:45");
    await page
      .getByRole("button", { name: "Analyze proposal", exact: true })
      .click();
    await expect(page.locator(".conflict-panel")).toContainText(
      "Biomedical design tools",
    );
    const analysis = await page.locator(".proposal-factors").innerText();
    const conflicts = await page.locator(".conflict-panel").innerText();
    const uni = page.getByLabel("Show University Events", { exact: true });
    await expect(uni).toBeChecked();
    await expect(event(page, "discovery-bme")).toBeVisible();
    await uni.uncheck();
    await expect(event(page, "discovery-bme")).toHaveCount(0);
    await expect(event(page, "discovery-cohost")).toHaveCount(0);
    await expect(event(page, "discovery-student")).toBeVisible();
    await expect(page.locator(".proposal-factors")).toHaveText(analysis, {
      useInnerText: true,
    });
    await expect(page.locator(".conflict-panel")).toHaveText(conflicts, {
      useInnerText: true,
    });
    await expect(selector).toHaveValue("example-process");
    await uni.check();
    await expect(event(page, "discovery-bme")).toBeVisible();
    await expect(
      event(page, "discovery-cohost").locator(".hosting-badge svg"),
    ).toHaveCount(2);
    await event(page, "discovery-bme").click();
    await expect(page.getByRole("dialog")).toContainText(
      "Penn State Department of Biomedical Engineering",
    );
    await page.keyboard.press("Escape");
    await expect(event(page, "discovery-bme")).toBeFocused();
    await uni.uncheck();
    const panel = page.locator(".planner-controls");
    await panel.locator(":scope > summary").click();
    await expect(panel.locator(".planner-collapsed-summary")).toContainText(
      "University Events",
    );
    await expect(page.locator(".proposal-factors")).toHaveText(analysis, {
      useInnerText: true,
    });
    await panel.locator(":scope > summary").click();
    await expect(uni).not.toBeChecked();
    await uni.check();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `work/membership-planner-${width}.png`,
      fullPage: true,
    });
  });
}
