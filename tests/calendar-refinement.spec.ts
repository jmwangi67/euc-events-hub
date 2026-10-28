import { test, expect } from "@playwright/test";
import { openPlannerChoices } from "./helpers/planner-controls";
test("linked overnight segments keep one identity, actual clocks and keyboard details", async ({
  page,
}) => {
  await page.goto("/?date=2026-10-26&view=dayGridMonth");
  const start = page
    .locator('[data-calendar-event-id="example-night-build"]')
    .first();
  const continuation = page
    .locator(
      '[data-calendar-event-id="example-night-build:continuation:2026-10-27"]',
    )
    .first();
  await expect(start).toContainText("11:30 PM–12:30 AM");
  await expect(page.locator(".calendar-summary")).toContainText("9 events");
  await expect(continuation).toContainText("Ends 12:30 AM");
  expect(
    (await start.locator(".clock-range").boundingBox())!.height,
  ).toBeLessThan(20);
  for (const trigger of [start, continuation]) {
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toContainText("Late design session");
    await expect(page.getByRole("dialog")).toContainText("Oct 27");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  await page
    .locator(".calendar-region")
    .screenshot({ path: "work/calendar-overnight.png" });
});
test("four October 25 cards fit, overflow remains bounded and external clicks are event-specific", async ({
  page,
}) => {
  await page.goto("/planner");
  await openPlannerChoices(page);
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
  await page.getByLabel("Go to date", { exact: true }).fill("2026-10-25");
  const day = page.locator('.fc-daygrid-day[data-date="2026-10-25"]');
  await expect(day.locator(".fc-daygrid-event")).toHaveCount(4);
  await expect(day.locator(".fc-daygrid-more-link")).toHaveCount(0);
  const boxes = await day.locator(".fc-daygrid-event").evaluateAll((nodes) =>
    nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    }),
  );
  for (let i = 1; i < boxes.length; i++)
    expect(boxes[i].top - boxes[i - 1].bottom).toBeGreaterThanOrEqual(3);
  await page
    .locator(".calendar-region")
    .screenshot({ path: "work/calendar-four-events.png" });
  for (const [id, title] of [
    ["scenario-homecoming", "Example Homecoming weekend"],
    ["scenario-local", "Example State College festival"],
    ["scenario-super-bowl", "Example Super Bowl scenario"],
  ]) {
    const event = page
      .locator(`[data-calendar-event-id="external:${id}"]`)
      .first();
    await event.click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("External event details", { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByRole("heading", { name: title })).toBeVisible();
    await dialog.screenshot({ path: `work/details-${id}.png` });
    await page.keyboard.press("Escape");
    await expect(event).toBeFocused();
  }
  const crowded = page.locator('.fc-daygrid-day[data-date="2026-10-21"]');
  await crowded.locator(".fc-daygrid-more-link").click();
  await expect(page.locator(".fc-popover")).toBeVisible();
  await expect(
    page.locator(".fc-popover .compact-identity").first(),
  ).toBeVisible();
  await page
    .locator(".fc-popover")
    .screenshot({ path: "work/calendar-popover.png" });
  const hiddenEvent = page.locator(
    '.fc-popover [data-calendar-event-id="external:scenario-national-forum"]',
  );
  await hiddenEvent.focus();
  await page.keyboard.press("Space");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Example National civic commitment" }),
  ).toBeVisible();
  await expect(page.locator(".fc-popover")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(hiddenEvent).toBeFocused();
  await page.locator(".fc-popover-close").click();
  await expect(page.locator(".week-row-link")).toHaveCount(0);
  const focus = page.getByRole("button", {
    name: /^Focus this week in calendar: Oct 18, 2026/,
  });
  await expect(focus).toHaveCount(1);
  await focus.click();
  await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible();
  await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
    "2026-10-18",
  );
  await page
    .getByRole("button", { name: /^Weekly summary: Oct 18, 2026/ })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Weekly summary details", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  const exam = page
    .locator(
      '.calendar-region [data-calendar-event-id="exam:example-math-exam"]',
    )
    .first();
  await exam.click();
  await expect(
    page.getByRole("dialog").getByText("Exam details", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").locator('[data-event-icon="exam"]'),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .screenshot({ path: "work/exam-sheet-details.png" });
  await page.keyboard.press("Escape");
  await page
    .locator(".calendar-region")
    .screenshot({ path: "work/focused-week.png" });
});
test("icon inventory is unavailable in production", async ({ request }) =>
  expect((await request.get("/dev/icons")).status()).toBe(404));
for (const width of [320, 375, 430, 768, 1024, 1440])
  test(`shared icons and readable overnight list at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?date=2026-10-26&view=listMonth");
    const event = page
      .locator('[data-calendar-event-id="example-night-build"]')
      .first();
    await expect(event.locator('[data-event-icon="tools"]')).toBeVisible();
    await expect(event).toContainText("11:30 PM–12:30 AM");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator(".calendar-region")
      .screenshot({ path: `work/calendar-mobile-${width}.png` });
  });
for (const view of ["dayGridMonth", "timeGridWeek", "timeGridDay", "listMonth"])
  test(`student icons retain research semantics in ${view}`, async ({
    page,
  }) => {
    await page.goto(`/?date=2026-11-16&view=${view}`);
    const event = page
      .locator('[data-calendar-event-id="discovery-matse"]')
      .first();
    await expect(event.locator('[data-event-icon="research"]')).toBeVisible();
    if (view === "dayGridMonth")
      await page
        .locator(".calendar-region")
        .screenshot({ path: "work/student-icon-month.png" });
  });
