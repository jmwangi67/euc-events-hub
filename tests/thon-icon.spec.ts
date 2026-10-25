import { test, expect } from "@playwright/test";
import { openPlannerChoices } from "./helpers/planner-controls";
test("dedicated THON mark is blue, compact on Month and larger in List/details", async ({
  page,
}) => {
  await page.goto("/planner");
  await openPlannerChoices(page);
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
  await page.getByLabel("Go to date", { exact: true }).fill("2026-10-30");
  const thon = page
    .locator('[data-calendar-event-id="external:scenario-thon"]')
    .first();
  const mark = thon.locator('[data-event-icon="thon"]');
  await expect(mark).toBeVisible();
  await expect(mark).toHaveCSS("color", "rgb(30, 64, 124)");
  await expect(mark).toHaveCSS("width", "13px");
  await expect(mark.locator("path")).toHaveCount(4);
  const alignment = await mark.evaluate((el) => {
    const icon = el.getBoundingClientRect();
    const text = el
      .closest(".event-title")!
      .querySelector(".event-title-text")!;
    const t = text.getBoundingClientRect();
    return Math.abs(
      icon.y +
        icon.height / 2 -
        t.y -
        parseFloat(getComputedStyle(text).lineHeight) / 2,
    );
  });
  expect(alignment).toBeLessThan(2);
  await thon.screenshot({ path: "work/thon-alignment.png" });
  await expect(
    page.locator(
      '[data-calendar-event-id="external:scenario-homecoming"] [data-event-icon="thon"]',
    ),
  ).toHaveCount(0);
  await thon.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("External event details", { exact: true }),
  ).toBeVisible();
  await expect(dialog.locator('[data-event-icon="thon"]')).toHaveCSS(
    "width",
    "16px",
  );
  await page.keyboard.press("Escape");
  await expect(thon).toBeFocused();
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(
    page.locator('.calendar-region [data-event-icon="thon"]').first(),
  ).toHaveCSS("width", "16px");
});
