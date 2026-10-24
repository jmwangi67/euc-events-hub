import { test, expect } from "@playwright/test";

test("switches from demonstration planner to an explicitly separate invented review dataset", async ({
  page,
}) => {
  await page.goto("/planner");
  await page
    .getByRole("link", { name: "Open private academic dataset review" })
    .click();
  await expect(
    page.getByText("Private exam data preview — unverified", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Review staged examinations" }),
  ).toBeVisible();
  await expect(page.locator(".calendar-summary")).toContainText(
    "4 canonical exam occurrences",
  );
  await expect(page.locator(".student-category-legend")).toHaveCount(0);
  await expect(page.locator(".planner-density-background")).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: "Show scheduling density" }),
  ).toHaveCount(0);
  await expect(
    page.locator(".fc-event").filter({ hasText: "EXAMPLE-" }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Fictional demonstration planner", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Load sample scenario", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".calendar-surface")).not.toContainText(
    "DEMO-LAB-A",
  );
});

for (const name of ["Month", "Week", "Day", "List"]) {
  test(`review dates, default hours and keyboard details in ${name}`, async ({
    page,
  }) => {
    await page.goto("/planner/exam-preview");
    await page.getByLabel("Go to date", { exact: true }).fill("2032-03-09");
    await page.getByRole("button", { name, exact: true }).click();
    const trigger = page
      .locator(
        '.calendar-region [data-calendar-event-id^="staged:invented-window:"]',
      )
      .first();
    await expect(trigger).toContainText("Time unknown");
    for (const key of ["Enter", "Space"]) {
      await trigger.focus();
      await page.keyboard.press(key);
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("DEMO-LAB-A");
      await expect(dialog).toContainText("Possible only — not scheduled");
      await expect(dialog).toContainText(
        "Not eligible for numerical preparation",
      );
      await expect(dialog).toContainText("Unreviewed");
      await expect(dialog).toContainText("Unknown; not supplied");
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    if (name !== "Day") {
      await expect(page.locator(".calendar-summary")).toContainText(
        "4 canonical exam occurrences",
      );
      await expect(page.locator(".exam-possible-date").first()).toContainText(
        "Possible",
      );
    }
    await page.getByLabel("Go to date", { exact: true }).fill("2032-03-12");
    await expect(page.locator(".exam-possible-date").first()).toContainText(
      "Possible",
    );
    if (name === "Day")
      await expect(page.locator(".calendar-summary")).toContainText(
        "2 canonical exam occurrences",
      );
  });
}
for (const width of [320, 375, 430, 768, 1440]) {
  test(`invented review reflows at ${width}px and distinguishes source defaults and unapproved windows`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/planner/exam-preview");
    const defaultHours = page
      .locator(
        '.calendar-region [data-calendar-event-id^="staged:invented-default:"]',
      )
      .first();
    await expect(defaultHours).toContainText("Source-wide default hours");
    await defaultHours.click();
    await expect(page.getByRole("dialog")).toContainText(
      "not course-specific time verification",
    );
    await page.keyboard.press("Escape");
    const requested = page
      .locator(
        '.calendar-region [data-calendar-event-id^="staged:invented-request:"]',
      )
      .first();
    await expect(requested).toContainText("requested unapproved");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `work/exam-review-invented-${width}.png`,
      fullPage: true,
    });
  });
}
