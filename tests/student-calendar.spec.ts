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

test("Escape synchronizes dismissal before a queued native close notification", async ({
  page,
}) => {
  await page.goto(sample);
  const trigger = event(page, "Engineering welcome");
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const previousDialog = await dialog.elementHandle();
  // A browser may restore focus before dispatching its asynchronous close event.
  // Hold that notification so reopening cannot depend on its timing.
  await dialog.evaluate((element) => {
    element.addEventListener(
      "close",
      (close) => close.stopImmediatePropagation(),
      { capture: true, once: true },
    );
  });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Space");
  await expect(dialog).toBeVisible();
  // A late notification from the old dialog must not close the new one.
  await previousDialog!.evaluate((element) =>
    element.dispatchEvent(new Event("close")),
  );
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("restores the same event after FullCalendar replaces its responsive view", async ({
  page,
}) => {
  await page.goto("/?date=2026-10-19&view=dayGridMonth");
  const trigger = event(page, "Engineering welcome");
  await trigger.focus();
  const originalTrigger = await trigger.elementHandle();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.setViewportSize({ width: 375, height: 1100 });
  await expect(
    page
      .locator(".fc-list-event .list-event-trigger")
      .filter({ hasText: "Engineering welcome" }),
  ).toBeAttached();
  expect(
    await originalTrigger!.evaluate((element) => element.isConnected),
  ).toBe(false);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

for (const view of [
  "dayGridMonth",
  "timeGridWeek",
  "timeGridDay",
  "listMonth",
]) {
  test(`keyboard details reopen and restore focus in ${view}`, async ({
    page,
  }) => {
    await page.goto(`/?date=2026-10-19&view=${view}`);
    const trigger = event(page, "Engineering welcome");
    await trigger.focus();
    for (const key of ["Enter", "Space", "Enter", "Space"]) {
      await test.step(`${key} opens, Escape closes and restores the original event`, async () => {
        await expect(trigger).toBeFocused();
        await page.keyboard.press(key);
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).not.toBeVisible();
        await expect(trigger).toBeFocused();
      });
    }
  });
}

for (const width of [320, 375, 430, 768, 1440]) {
  test(`responsive calendar and dialog at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?date=2026-10-19");
    await expect(event(page, "Engineering welcome")).toBeVisible();
    if (width < 1024) {
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

for (const width of [1024, 1440]) {
  test(`desktop disclosures preserve selections at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(sample);
    await expect(
      page.getByRole("button", { name: /Show filters|Hide filters/ }),
    ).toBeHidden();
    const majors = page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: "Majors" }) });
    const organizations = page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: "Organizations" }) });
    const categories = page.locator("details").filter({
      has: page.locator("summary", { hasText: "Event categories" }),
    });
    await page
      .getByLabel("Biomedical Engineering (BME)", { exact: true })
      .check();
    await page
      .getByLabel("Example Process Engineering Society (synthetic)", {
        exact: true,
      })
      .check();
    await page.getByLabel("Corporate recruiting", { exact: true }).check();
    for (const group of [majors, organizations, categories]) {
      await group.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(group).not.toHaveAttribute("open", "");
    }
    await expect(page.getByLabel("All Events", { exact: true })).toBeVisible();
    await expect(
      page.getByLabel("Recommended Events", { exact: true }),
    ).toBeVisible();
    await majors.locator("summary").click();
    await expect(
      page.getByLabel("Biomedical Engineering (BME)", { exact: true }),
    ).toBeChecked();
    await expect(organizations).not.toHaveAttribute("open", "");
    await expect(categories).not.toHaveAttribute("open", "");
    await organizations.locator("summary").click();
    await categories.locator("summary").click();
    await expect(
      page.getByLabel("Example Process Engineering Society (synthetic)", {
        exact: true,
      }),
    ).toBeChecked();
    await expect(
      page.getByLabel("Corporate recruiting", { exact: true }),
    ).toBeChecked();
  });
}

for (const width of [320, 375, 430, 768, 1023]) {
  test(`collapsed filters, navigation and readable full time ranges at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(sample);
    const panel = page.locator("#filter-controls");
    await expect(panel).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Show filters 0 active filters" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Show filters/ }).click();
    await page
      .getByLabel("Biomedical Engineering (BME)", { exact: true })
      .check();
    await expect(page.locator(".filter-count")).toHaveText("0 active filters");
    await page.locator("summary").filter({ hasText: "Majors" }).click();
    await page.getByLabel("Recommended Events", { exact: true }).check();
    await page.getByLabel("Corporate recruiting", { exact: true }).check();
    await expect(
      page.getByLabel("Biomedical Engineering (BME)", { exact: true }),
    ).toBeHidden();
    if (width === 375)
      await page.screenshot({
        path: "work/filters-mobile-expanded.png",
        fullPage: true,
      });
    await page.getByRole("button", { name: /Hide filters/ }).click();
    await expect(panel).toBeHidden();
    await expect(page.locator(".filter-count")).toHaveText("3 active filters");
    await page.getByRole("button", { name: /Show filters/ }).click();
    await page.locator("summary").filter({ hasText: "Majors" }).click();
    await expect(
      page.getByLabel("Biomedical Engineering (BME)", { exact: true }),
    ).toBeChecked();
    await page
      .getByRole("button", { name: "Clear filters", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: /Hide filters/ }).click();
    await expect(page.locator(".filter-count")).toHaveText("0 active filters");
    await page.getByLabel("Go to date", { exact: true }).fill("2026-10-26");
    await page.getByRole("button", { name: "Day", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: /October 26, 2026/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next date range" }).click();
    await expect(page.getByLabel("Go to date", { exact: true })).toHaveValue(
      "2026-10-27",
    );
    await page.getByRole("button", { name: "List", exact: true }).click();
    await expect(
      event(page, "Design exploration days").locator(".list-event-times"),
    ).toHaveText("All day");
    const overnight = event(page, "Late design session").locator(
      ".list-event-times",
    );
    await expect(overnight).toContainText("Oct 26");
    await expect(overnight).toContainText("Oct 27");
    await expect(overnight).toContainText("11:30 PM EDT");
    await expect(overnight).toContainText("12:30 AM EDT");
    // Every date/time token fits on one line, with intentional breaks between tokens.
    const fits = await page
      .locator(".time-part")
      .evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            node.scrollWidth <= node.clientWidth &&
            node.getBoundingClientRect().height < 25,
        ),
      );
    expect(fits).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
