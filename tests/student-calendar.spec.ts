import { test, expect } from "@playwright/test";

const sample = "/?date=2026-10-19&view=listMonth";
const event = (page: import("@playwright/test").Page, title: string) =>
  page.getByRole("button", { name: new RegExp(title) }).first();

test("discovers published events, combines filters, searches, resets, and restores URLs", async ({
  page,
}) => {
  await page.goto(sample);
  await expect(event(page, "Open engineering studio")).toBeVisible();
  await expect(
    page.locator(".fc-event").filter({ hasText: "Topic to be announced" }),
  ).toHaveCount(0);
  await page.getByLabel("Recommended Events", { exact: true }).check();
  await page
    .getByLabel("Biomedical Engineering (BME)", { exact: true })
    .check();
  await expect(event(page, "Bioprocess industry discussion")).toBeVisible();
  await expect(event(page, "Engineering welcome")).toBeVisible();
  await expect(
    page.locator(".fc-event").filter({ hasText: "Process lab workshop" }),
  ).toHaveCount(0);
  await page.getByLabel("Chemical Engineering (CHE)", { exact: true }).check();
  await expect(event(page, "Process lab workshop")).toBeVisible();
  await page
    .getByLabel("Example Process Engineering Society (synthetic)", {
      exact: true,
    })
    .check();
  await page.getByLabel("Corporate recruiting", { exact: true }).check();
  await expect(page.locator(".fc-event")).toHaveCount(1);
  await expect(event(page, "Bioprocess industry discussion")).toBeVisible();
  const filteredUrl = page.url();
  await page.reload();
  await expect(
    page.getByLabel("Biomedical Engineering (BME)", { exact: true }),
  ).toBeChecked();
  await expect(page.locator(".fc-event")).toHaveCount(1);
  await page.getByLabel("Search events", { exact: true }).fill("no-such-event");
  await expect(
    page.getByText("No published events in this range", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .first()
    .click();
  await expect(event(page, "Open engineering studio")).toBeVisible();
  await page
    .getByLabel("Search events", { exact: true })
    .fill("EXCHANGING PROJECT IDEAS");
  await expect(page.locator(".fc-event")).toHaveCount(1);
  await expect(event(page, "Open engineering studio")).toBeVisible();
  await page.goto(filteredUrl);
  await expect(page.locator(".fc-event")).toHaveCount(1);
});

test("supports four views, date navigation, Eastern time and keyboard details", async ({
  page,
}) => {
  await page.goto("/?date=2026-10-19&view=dayGridMonth");
  await expect(event(page, "Engineering welcome")).toContainText("5:00");
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible();
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.locator(".fc-timeGridDay-view")).toBeVisible();
  await page.getByRole("button", { name: "Next date range" }).click();
  await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
    "2026-10-20",
  );
  await page.getByRole("button", { name: "Previous date range" }).click();
  await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
    "2026-10-19",
  );
  await page.getByRole("button", { name: "Today", exact: true }).click();
  const easternToday = await page.evaluate(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
  );
  await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
    easternToday,
  );
  await page.getByRole("button", { name: "View sample dates" }).click();
  await page.getByRole("button", { name: "List", exact: true }).click();
  const welcome = event(page, "Engineering welcome");
  await welcome.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("5:00 PM EDT");
  await expect(dialog).toContainText("Fictional development example");
  await expect(dialog).toContainText("Example meeting room");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close event details" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close event details" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(welcome).toBeFocused();
  await page.keyboard.press("Space");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(welcome).toBeFocused();
  await event(page, "Design exploration days").click();
  await expect(page.getByRole("dialog")).toContainText(
    "Oct 24, 2026 – Oct 25, 2026 · All day",
  );
  await page.getByRole("button", { name: "Close event details" }).click();
  await event(page, "Late design session").click();
  await expect(page.getByRole("dialog")).toContainText("Oct 27, 2026");
  await expect(page.getByRole("dialog")).toContainText("11:30 PM EDT");
  await expect(page.getByRole("dialog")).toContainText("Location not provided");
  await expect(page.getByRole("dialog")).toContainText(
    "No description has been provided.",
  );
});

for (const width of [320, 375, 430, 768, 1440]) {
  test(`responsive calendar and dialog at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?date=2026-10-19");
    await expect(event(page, "Engineering welcome")).toBeVisible();
    if (width < 768) {
      await expect(page.locator(".fc-listMonth-view")).toBeVisible();
      await page.getByRole("button", { name: "Show filters" }).click();
      await page.getByLabel("Recommended Events", { exact: true }).check();
      await page
        .getByLabel("Biomedical Engineering (BME)", { exact: true })
        .check();
      await page.getByRole("button", { name: "Hide filters" }).click();
      await expect(event(page, "Bioprocess industry discussion")).toBeVisible();
      await page
        .getByRole("button", { name: "Clear filters", exact: true })
        .first()
        .click();
    }
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `work/calendar-${width}.png`,
      fullPage: true,
    });
    await event(page, "Engineering welcome").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.width).toBeLessThan(width);
    await page.screenshot({ path: `work/detail-${width}.png`, fullPage: true });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    expect(errors).toEqual([]);
  });
}
