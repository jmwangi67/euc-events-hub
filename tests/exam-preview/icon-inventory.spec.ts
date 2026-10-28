import { test, expect } from "@playwright/test";
import { ICON_INVENTORY } from "../../components/calendar/icon-inventory";
test("development inventory renders every actual icon mapping", async ({
  page,
}) => {
  await page.goto("/dev/icons");
  await expect(
    page.getByRole("heading", { name: "Event icon inventory" }),
  ).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(ICON_INVENTORY.length);
  await expect(page.locator('[data-event-icon="research"]')).toBeVisible();
  await expect(page.locator('[data-event-icon="exam"]')).toBeVisible();
  await expect(page.locator('[data-event-icon="thon"]')).toHaveCount(1);
  await page.screenshot({
    path: "work/icon-inventory.png",
    fullPage: true,
    // Exclude development tooling chrome, which can obscure inventory symbols.
    style: "nextjs-portal { display: none !important; }",
  });
});
