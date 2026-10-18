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
    .getByLabel("Example Process Engineering Society", {
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
  await expect(dialog).toContainText("5:00–6:00 PM");
  await expect(dialog).not.toContainText(/\b(?:EST|EDT)\b/);
  await expect(dialog).toContainText(
    "Example scenario — not a real or verified event",
  );
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
  await expect(page.getByRole("dialog")).toContainText("11:30 PM");
  await expect(page.getByRole("dialog")).toContainText("Location not provided");
  await expect(page.getByRole("dialog")).toContainText(
    "No description has been provided.",
  );
  await expect(page.getByRole("dialog")).not.toContainText(/\b(?:EST|EDT)\b/);
  await page.screenshot({
    path: "work/overnight-detail-desktop.png",
    fullPage: true,
  });
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
    await expect(trigger.locator(".event-time")).toHaveText("5:00–6:00 PM");
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
      .getByLabel("Example Process Engineering Society", {
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
      page.getByLabel("Example Process Engineering Society", {
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
    await expect(overnight).toContainText("Next day");
    await expect(
      page
        .getByRole("button", { name: /Late design session/ })
        .nth(1)
        .locator(".list-event-times"),
    ).toContainText("From prev day");
    await expect(overnight).toContainText("11:30 PM");
    await expect(overnight).toContainText("12:30 AM");
    if (width === 375) {
      await event(page, "Late design session").click();
      await expect(page.locator(".detail-time")).toHaveText(
        "Oct 26, 2026, 11:30 PM – Oct 27, 2026, 12:30 AM",
      );
      await expect(page.getByRole("dialog")).not.toContainText(
        /\b(?:EST|EDT)\b/,
      );
      await page.screenshot({
        path: "work/overnight-detail-mobile.png",
        fullPage: true,
      });
      await page.keyboard.press("Escape");
    }

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

for (const width of [320, 375, 430, 768]) {
  test(`mobile day groups have shared dates and title-first event rows at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(sample);
    await expect(page.locator(".timezone-label")).toHaveText(
      "All Times Eastern (ET)",
    );
    const headers = page.locator(".fc-list-day");
    await expect(headers).toHaveCount(9);
    await expect(headers.first()).toHaveText("Monday, October 19");
    await expect(
      page.locator('.fc-list-day[data-date="2026-10-26"]'),
    ).toHaveCount(1);
    for (const header of await headers.all())
      await expect(header).not.toContainText("2026");
    const rows = page.locator(".mobile-list-event");
    await expect(rows).toHaveCount(11);
    const expected = [
      [
        "Engineering welcome",
        "5:00–6:00 PM",
        "Student organization",
        "Example Engineering Council",
      ],
      [
        "Process lab workshop",
        "6:00–7:30 PM",
        "Technical workshop",
        "Example Process Engineering Society",
      ],
      [
        "Bioprocess industry discussion",
        "4:00–5:00 PM",
        "Corporate recruiting",
        "Example Process Engineering Society",
      ],
    ];
    for (const [title, time, category, host] of expected) {
      const row = event(page, title);
      await expect(row.locator(".event-title")).toHaveText(title);
      await expect(row.locator(".list-event-times")).toHaveText(time);
      await expect(row.locator(".event-category")).toContainText(category);
      await expect(row.locator(".event-category")).toContainText(host);
      await expect(row).not.toContainText(/2026|Oct|Monday|Tuesday|Wednesday/);
      const titleBox = await row.locator(".event-title").boundingBox();
      const timeBox = await row.locator(".list-event-times").boundingBox();
      const metaBox = await row.locator(".event-category").boundingBox();
      expect(titleBox!.y + titleBox!.height).toBeLessThanOrEqual(timeBox!.y);
      expect(timeBox!.y + timeBox!.height).toBeLessThanOrEqual(metaBox!.y);
    }
    const welcome = event(page, "Engineering welcome");
    for (const key of ["Enter", "Space"]) {
      await welcome.focus();
      await page.keyboard.press(key);
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
      await expect(welcome).toBeFocused();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

for (const width of [320, 375, 430, 768]) {
  test(`same-day visual scenario, day separation and year rollover at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?date=2026-12-31&view=listMonth");
    await expect(
      page.getByRole("heading", { name: "December 2026", exact: true }),
    ).toBeVisible();
    const headers = page.locator(".fc-list-day");
    await expect(headers).toHaveCount(2);
    await expect(headers.nth(0)).toHaveText("Wednesday, December 30");
    await expect(headers.nth(1)).toHaveText("Thursday, December 31");
    const group = page.locator('.fc-list-day[data-date="2026-12-31"]');
    await expect(group).toHaveCount(1);
    const rows = page.locator(".mobile-list-event");
    await expect(rows).toHaveCount(4);
    await expect(rows.locator(".event-title")).toHaveText([
      "Project showcase",
      "Engineering career panel",
      "Biomedical design workshop",
      "Late-night build session",
    ]);
    await expect(rows.nth(0).locator(".list-event-times")).toHaveText(
      "All day",
    );
    await expect(rows.nth(1).locator(".list-event-times")).toHaveText(
      "10:00–11:00 AM",
    );
    await expect(rows.nth(2).locator(".list-event-times")).toHaveText(
      "2:00–3:30 PM",
    );
    await expect(rows.nth(3).locator(".list-event-times")).toContainText(
      "11:30 PM–12:30 AM",
    );
    await expect(rows.nth(3).locator(".list-event-times")).toContainText(
      "Next day",
    );
    await expect(rows.nth(1).locator(".event-category")).toContainText(
      "Professional development · Engineering · Example Event · Example Engineering Council",
    );
    await expect(rows.nth(2).locator(".event-category")).toContainText(
      "Technical workshop · Engineering · Example Event · Example Process Engineering Society",
    );
    await expect(rows.nth(3).locator(".event-category")).toContainText(
      "Student organization · Engineering · Example Event · Example Design Collective",
    );
    // Three sibling rows belong to the same single FullCalendar day header.
    await expect(group.locator("xpath=following-sibling::tr")).toHaveCount(3);
    const styles = await page.locator(".mobile-calendar").evaluate((root) => {
      const style = (selector: string) =>
        getComputedStyle(root.querySelector(selector)!);
      return {
        header: style(".fc-list-day-cushion").fontSize,
        headerWeight: style(".fc-list-day-text").fontWeight,
        gap: style(".fc-list-day:not(:first-child) th").borderTopWidth,
        title: style(".event-title").fontSize,
        time: style(".list-event-times").fontSize,
        timeWeight: style(".list-event-times").fontWeight,
        metadata: style(".event-category").fontSize,
        divider: style(".mobile-list-event").borderTopWidth,
        bottomBorder: style(".mobile-list-event").borderBottomWidth,
        leftBorder: style(".mobile-list-event").borderLeftWidth,
        rightBorder: style(".mobile-list-event").borderRightWidth,
        radius: style(".fc-list-event + .fc-list-event .mobile-list-event")
          .borderRadius,
        attachedTopRadius: style(".mobile-list-event").borderTopLeftRadius,
        cardPadding: style(".mobile-list-event").padding,
        itemGap: style(".fc-list-event + .fc-list-event .fc-list-event-title")
          .paddingTop,
        headerGap: style(".fc-list-day + .fc-list-event .fc-list-event-title")
          .paddingTop,
        cardSurface: style(".mobile-list-event").backgroundColor,
        pageSurface: style(".fc-list").backgroundColor,
        shadow: style(".mobile-list-event").boxShadow,
        groupSurface: style(".fc-list-event").backgroundColor,
        headerSurface: style(".fc-list-day-cushion").backgroundColor,
        cardBorderColor: style(".mobile-list-event").borderTopColor,
        groupInset: style(".fc-list-event-title").paddingLeft,
        groupBottom: style(".fc-list-event:last-child .fc-list-event-title")
          .paddingBottom,
        headerPadding: style(".fc-list-day-cushion").paddingTop,
      };
    });
    expect(styles).toEqual({
      header: "16px",
      headerWeight: "600",
      gap: "16px",
      title: "15px",
      time: "14px",
      timeWeight: "500",
      metadata: "12px",
      divider: "1px",
      bottomBorder: "1px",
      leftBorder: "1px",
      rightBorder: "1px",
      radius: "4px",
      attachedTopRadius: "4px",
      cardPadding: "12px 14px",
      itemGap: "8px",
      headerGap: "4px",
      cardSurface: "rgb(255, 255, 255)",
      pageSurface: "rgb(248, 250, 252)",
      shadow: "none",
      groupSurface: "rgb(232, 239, 247)",
      headerSurface: "rgb(232, 239, 247)",
      cardBorderColor: "rgb(154, 169, 186)",
      groupInset: "8px",
      groupBottom: "8px",
      headerPadding: "8px",
    });
    const panelBox = await rows.nth(1).boundingBox();
    const workshopBox = await rows.nth(2).boundingBox();
    expect(workshopBox!.y - (panelBox!.y + panelBox!.height)).toBe(8);
    const previousDayBox = await rows.nth(0).boundingBox();
    const nextHeaderBox = await group
      .locator(".fc-list-day-cushion")
      .boundingBox();
    expect(
      nextHeaderBox!.y - (previousDayBox!.y + previousDayBox!.height),
    ).toBe(24);
    const previousGroupRowBox = await rows
      .nth(0)
      .locator("xpath=ancestor::tr")
      .boundingBox();
    expect(
      nextHeaderBox!.y - (previousGroupRowBox!.y + previousGroupRowBox!.height),
    ).toBe(16);
    expect(panelBox!.x - nextHeaderBox!.x).toBe(8);
    expect(
      nextHeaderBox!.x + nextHeaderBox!.width - (panelBox!.x + panelBox!.width),
    ).toBe(8);
    const firstHeaderBox = await headers
      .nth(0)
      .locator(".fc-list-day-cushion")
      .boundingBox();
    expect(
      previousDayBox!.y - (firstHeaderBox!.y + firstHeaderBox!.height),
    ).toBe(4);
    expect(panelBox!.y - (nextHeaderBox!.y + nextHeaderBox!.height)).toBe(4);

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `work/same-day-${width}.png`,
      fullPage: true,
    });
    await rows.nth(3).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".detail-time")).toHaveText(
      "Dec 31, 2026, 11:30 PM – Jan 1, 2027, 12:30 AM",
    );
    await page.keyboard.press("Escape");
    await expect(rows.nth(3)).toBeFocused();
    await page.getByLabel("Go to date", { exact: true }).fill("2027-01-01");
    await expect(
      page.getByRole("heading", { name: "January 2027", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".fc-list-day")).toHaveText("Friday, January 1");
    await expect(page.locator(".list-event-times")).toContainText(
      "From prev day",
    );
    await expect(page.locator(".timezone-label")).toHaveText(
      "All Times Eastern (ET)",
    );
    await expect(page.locator("body")).not.toContainText(/\b(?:EST|EDT)\b/);
  });
}
