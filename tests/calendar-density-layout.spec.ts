import { test, expect, type Page } from "@playwright/test";
import { openPlannerChoices } from "./helpers/planner-controls";
async function sample(page: Page) {
  await page.goto("/planner");
  await openPlannerChoices(page);
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
  await page.getByLabel("Go to date", { exact: true }).fill("2026-10-21");
}
for (const planner of [false, true]) {
  test(`three-line Month cards prioritize time, location, title and identity on ${planner ? "planner" : "student"}`, async ({
    page,
  }) => {
    if (planner) await sample(page);
    else await page.goto("/?date=2026-10-21&view=dayGridMonth");
    const cards = page.locator(".fc-daygrid-event:visible .month-card");
    await expect(cards.first()).toBeVisible();
    for (const content of await cards.all()) {
      expect(await content.locator(":scope > *").count()).toBeLessThanOrEqual(
        3,
      );
      const title = content.locator(".event-title");
      const h = await title.evaluate((n) => ({
        height: n.getBoundingClientRect().height,
        line: parseFloat(getComputedStyle(n).lineHeight),
        wrap: getComputedStyle(n).whiteSpace,
      }));
      expect(h.height).toBeLessThanOrEqual(h.line + 1);
      expect(h.wrap).toBe("nowrap");
      await expect(content.locator(".event-type-icon")).toBeVisible();
      await expect(content).not.toContainText(/Unknown location|Location TBD/);
    }
    const engineering = page.locator(
      '.fc-daygrid-event[data-calendar-event-id="example-welcome"]',
    );
    const time = engineering.locator(".event-time"),
      location = engineering.locator(".event-location");
    await expect(time).toHaveText("5–6 PM");
    await expect(location).toContainText("Example meeting room");
    const weights = await Promise.all(
      [time, location].map((node) =>
        node.evaluate((n) => getComputedStyle(n).fontWeight),
      ),
    );
    expect(Number(weights[0])).toBeGreaterThanOrEqual(600);
    expect(weights[1]).toBe("400");
    expect(
      Math.abs(
        (await time.boundingBox())!.y - (await location.boundingBox())!.y,
      ),
    ).toBeLessThan(2);
    await expect(engineering.locator(".card-detail")).toContainText(
      "Example Engineering Council",
    );
    expect(
      await engineering
        .locator(".event-title-text")
        .evaluate((n) => n.scrollWidth > n.clientWidth),
    ).toBe(true);
    await engineering.focus();
    await page.keyboard.press("Space");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Engineering welcome");
    await expect(dialog).toContainText("Example meeting room");
    await expect(dialog).toContainText("5:00–6:00 PM");
    await page.keyboard.press("Escape");
    await expect(engineering).toBeFocused();
    await page.locator(".calendar-region").screenshot({
      path: `work/layering-month-${planner ? "planner" : "student"}.png`,
    });
  });
}

test("Week and Day retain scheduling reasons and sources without the standalone constraints panel", async ({
  page,
}) => {
  await sample(page);
  for (const view of ["1 Week", "Day"]) {
    await page.getByRole("button", { name: view, exact: true }).click();
    await expect(
      page.locator(".pressure-preview [data-non-exam-score]"),
    ).toHaveCount(0);
    await expect(page.locator(".pressure-preview")).toContainText(
      "Exam Preparation and Other Scheduling Constraints are independent indicators",
    );
    await expect(page.locator(".overall-pressure-pending")).toHaveAttribute(
      "data-overall-status",
      "awaiting-methodology-review",
    );
    const reasons = page.locator(".calendar-guidance-details");
    await expect(reasons.locator(":scope > summary")).toHaveText(
      /View all scheduling reasons and sources for \d+ dates?/,
    );
    await reasons.locator(":scope > summary").focus();
    await page.keyboard.press("Enter");
    await expect(reasons).toHaveAttribute("open", "");
    const first = reasons.locator(".day-caution").first();
    await first.locator(":scope > summary").click();
    await expect(first.locator(".day-caution-reasons")).toContainText(
      "Fictional",
    );
    await expect(first.locator(".day-caution-reasons")).toContainText(
      "Demo data — not verified",
    );
    await page.locator(".calendar-region").screenshot({
      path: `work/layering-planner-${view === "Day" ? "day" : "week"}-reasons.png`,
    });
    await reasons.locator(":scope > summary").click();
    await page
      .locator(".fc-timegrid-slot-lane[data-time='17:00:00']")
      .first()
      .scrollIntoViewIfNeeded();
    await page.locator(".calendar-region").screenshot({
      path: `work/layering-planner-${view === "Day" ? "day" : "week"}.png`,
    });
  }
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Weekly scheduling summaries" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "2 Weeks", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Weekly scheduling summaries" }),
  ).toBeVisible();
});

for (const width of [320, 375, 430, 768, 1024, 1440]) {
  test(`compact times and preserved responsive list and Day at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?date=2026-10-26&view=listMonth");
    await expect(page.locator(".timezone-label")).toHaveText(
      "All Times Eastern (ET)",
    );
    const rows = page.locator(".list-event-trigger");
    await expect(rows.first()).toBeVisible();
    // Shared dates, full occurrence clocks and continuation semantics remain.
    await expect(
      page.locator('[data-calendar-event-id="example-night-build"]').first(),
    ).toContainText("Next day");
    await expect(page.locator(".calendar-region")).not.toContainText(
      /\b(?:EST|EDT)\b/,
    );
    await expect(
      page.locator('[data-calendar-event-id="example-welcome"]').first(),
    ).toContainText("5–6 PM");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator(".calendar-region")
      .screenshot({ path: `work/layering-list-${width}.png` });
    await page.getByLabel("Go to date", { exact: true }).fill("2026-10-19");
    await page.getByRole("button", { name: "Day", exact: true }).click();
    await expect(page.locator(".fc-timeGridDay-view")).toBeVisible();
    const trigger = page
      .locator('[data-calendar-event-id="example-welcome"]')
      .first();
    const welcome = trigger;
    await welcome.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(welcome).toBeFocused();
    expect(
      await page
        .locator(".fc-timegrid-event .fc-event-main")
        .evaluateAll((nodes) =>
          nodes.every((n) => getComputedStyle(n).overflow === "hidden"),
        ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
test("development overlap fixture is unavailable in production", async ({
  request,
}) => {
  expect((await request.get("/dev/calendar-layout")).status()).toBe(404);
});
