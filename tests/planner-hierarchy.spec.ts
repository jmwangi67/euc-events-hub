import { test, expect } from "@playwright/test";
import { openPlannerChoices } from "./helpers/planner-controls";
for (const width of [320, 375, 430, 768, 1024, 1440])
  test(`planner hierarchy and frame at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/planner");
    await openPlannerChoices(page);
    await page
      .getByRole("button", { name: "Load sample scenario", exact: true })
      .click();
    await page.getByLabel("Go to date", { exact: true }).fill("2026-10-24");
    await expect(page.locator(".density-cell-count")).toHaveCount(0);
    await expect(page.locator(".planner-calendar .calendar-surface")).toHaveCSS(
      "border-top-width",
      "2px",
    );
    await expect(page.locator("[data-event-icon]").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width >= 1024) {
      const home = page
        .locator('[data-calendar-event-id="external:scenario-homecoming"]')
        .first();
      await expect(home).not.toContainText("Time unknown");
      await expect(
        page.locator('.fc-daygrid-day[data-date="2026-10-23"]'),
      ).toHaveCSS("border-left-color", "rgb(181, 193, 207)");
      await expect(page.locator(".calendar-surface")).toHaveCSS(
        "border-top-color",
        "rgb(140, 155, 173)",
      );
      await expect(page.locator(".fc-scrollgrid")).toHaveCSS(
        "border-top-width",
        "0px",
      );
      await expect(
        page
          .locator('.fc-daygrid-day[data-date="2026-10-23"] .fc-daygrid-event')
          .first(),
      ).toHaveAttribute(
        "data-calendar-event-id",
        "external:scenario-homecoming",
      );
      expect((await home.boundingBox())!.width).toBeGreaterThan(
        (await page
          .locator('.fc-daygrid-day[data-date="2026-10-23"]')
          .boundingBox())!.width * 1.7,
      );
      const segments = page.locator(
        '[data-calendar-event-id="external:scenario-homecoming"]',
      );
      expect(await segments.count()).toBe(2); // Friday–Saturday, then Sunday across week boundary.
      await expect(home.locator('[data-event-icon="calendar"]')).toBeVisible();
      await page
        .locator(".calendar-region")
        .screenshot({ path: `work/hierarchy-month-off-${width}.png` });
      await page
        .getByRole("checkbox", { name: "Show scheduling density", exact: true })
        .check();
      await expect(page.locator(".density-swatch")).toHaveCount(4);
      await expect(page.locator(".density-cell-count")).toHaveCount(0);
      await page
        .locator(".calendar-region")
        .screenshot({ path: `work/hierarchy-month-on-${width}.png` });
      await page.getByRole("button", { name: "2 Weeks", exact: true }).click();
      await page
        .locator(".calendar-region")
        .screenshot({ path: `work/hierarchy-two-weeks-${width}.png` });
      const nav = page.getByRole("button", {
        name: /^Focus this week in calendar: Oct 18, 2026/,
      });
      await expect(nav).not.toHaveAttribute("aria-haspopup", "dialog");
      await nav.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible();
      await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
        "2026-10-18",
      );
      const summary = page.getByRole("button", {
        name: /^Weekly summary: Oct 18, 2026/,
      });
      await expect(summary).toContainText("Weekly summary details");
      await summary.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(summary).toBeFocused();
      await page
        .locator(".calendar-region")
        .screenshot({ path: `work/hierarchy-week-${width}.png` });
      await page.getByRole("button", { name: "Month", exact: true }).click();
      await page.getByLabel("Go to date", { exact: true }).fill("2026-10-01");
      await page
        .getByRole("button", {
          name: /^Focus this week in calendar: Sep 27, 2026/,
        })
        .click();
      await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
        "2026-09-27",
      );
      await page.getByRole("button", { name: "Month", exact: true }).click();
      await page.getByLabel("Go to date", { exact: true }).fill("2026-12-31");
      await page
        .getByRole("button", {
          name: /^Focus this week in calendar: Dec 27, 2026/,
        })
        .click();
      await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
        "2026-12-27",
      );
    } else
      await page
        .locator(".calendar-region")
        .screenshot({ path: `work/hierarchy-mobile-${width}.png` });
  });
