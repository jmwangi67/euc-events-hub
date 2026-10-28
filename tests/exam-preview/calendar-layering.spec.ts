import { test, expect, type Page, type Locator } from "@playwright/test";

const card = (page: Page, id: string) =>
  page.locator(
    `.fc-timegrid-col-events [data-calendar-event-id="external:${id}"]`,
  );
async function preview(page: Page, width = 1462) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/dev/calendar-layout");
  await expect(card(page, "shift")).toBeVisible();
  await expect(page.locator(".calendar-summary")).toContainText("18 events");
}
async function capture(page: Page, name: string, time = "13:00:00") {
  await page
    .locator(`.fc-timegrid-slot-lane[data-time="${time}"]`)
    .first()
    .evaluate((slot) => {
      const scroller = slot.closest(".fc-scroller")!;
      scroller.scrollTop +=
        slot.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    });
  await page.locator(".calendar-region").screenshot({
    path: `work/layering-${name}.png`,
    style: "nextjs-portal {display:none!important}",
  });
}
async function activate(page: Page, trigger: Locator) {
  const title = await trigger.locator(".event-title-text").innerText();
  // The left edge is the exposed portion, rather than the covered card center.
  await trigger.click({ position: { x: 5, y: 5 } });
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  for (const key of ["Enter", "Space"]) {
    await page.keyboard.press(key);
    await expect(
      page
        .getByRole("dialog")
        .getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
}
async function noCardScrollbars(page: Page) {
  const violations = await page
    .locator(".fc-timegrid-event, .fc-timegrid-event *")
    .evaluateAll((nodes) =>
      nodes
        .filter((n) => {
          const s = getComputedStyle(n);
          return [s.overflowX, s.overflowY].some(
            (v) => v === "auto" || v === "scroll",
          );
        })
        .map((n) => n.className),
    );
  expect(violations).toEqual([]);
}

test("native overlapping layers preserve long-event width, exposed selection and exact vertical geometry", async ({
  page,
}) => {
  await preview(page);
  const long = card(page, "shift"),
    course = card(page, "course");
  const a = (await long.boundingBox())!,
    b = (await course.boundingBox())!;
  const column = await long.locator("..").locator("..").boundingBox();
  expect(a.width / column!.width).toBeGreaterThan(0.95);
  expect(b.x).toBeGreaterThan(a.x + 20);
  expect(b.x).toBeLessThan(a.x + a.width);
  expect(b.width).toBeGreaterThanOrEqual(a.width * 0.49);
  expect(Math.abs(a.y - b.y)).toBeLessThan(1);
  expect((a.height + 1) / (b.height + 1)).toBeCloseTo(7.5 / 1.25, 1);
  const hour1 = (await page
    .locator('.fc-timegrid-slot-lane[data-time="16:00:00"]')
    .boundingBox())!;
  const hour2 = (await page
    .locator('.fc-timegrid-slot-lane[data-time="17:00:00"]')
    .boundingBox())!;
  expect(Math.abs(a.y - hour1.y)).toBeLessThan(2);
  expect(Math.abs(a.height + 1 - (hour2.y - hour1.y) * 7.5)).toBeLessThan(2);
  expect(
    Number(
      await long.locator("..").evaluate((n) => getComputedStyle(n).zIndex),
    ),
  ).toBeLessThan(
    Number(
      await course.locator("..").evaluate((n) => getComputedStyle(n).zIndex),
    ),
  );
  await activate(page, long);
  await activate(page, course);
  await noCardScrollbars(page);
  await capture(page, "two-overlaps");
});

test("three overlaps are horizontally layered, wrap to two title lines and keep separate dialogs", async ({
  page,
}) => {
  await preview(page);
  const items = ["three-a", "three-b", "three-c"].map((id) => card(page, id));
  await expect(items[2]).toHaveCount(1);
  const boxes = await Promise.all(items.map((item) => item.boundingBox()));
  for (let i = 0; i < 3; i++) {
    expect(boxes[i]!.width).toBeGreaterThan(55);
    if (i) {
      expect(boxes[i]!.x).toBeGreaterThan(boxes[i - 1]!.x);
      expect(boxes[i]!.x).toBeLessThan(
        boxes[i - 1]!.x + boxes[i - 1]!.width - 10,
      );
      expect(boxes[i]!.y - boxes[i - 1]!.y).toBeCloseTo(40, 0);
    }
    const title = items[i].locator(".event-title");
    expect(
      await title.evaluate((n) => getComputedStyle(n).webkitLineClamp),
    ).toBe("2");
    expect((await title.boundingBox())!.height).toBeLessThanOrEqual(37);
    await activate(page, items[i]);
  }
  const first = items[0].locator(".event-title"),
    icon = items[0].locator(".event-title-icon");
  expect(
    Math.abs((await first.boundingBox())!.y - (await icon.boundingBox())!.y),
  ).toBeLessThan(2);
  expect(
    await items[0]
      .locator(".event-title-text")
      .evaluate((n) => getComputedStyle(n).display),
  ).toBe("inline");
  await capture(page, "three-overlaps");
});

test("six-event overlap has an accessible fallback and each source remains mouse and keyboard reachable", async ({
  page,
}) => {
  await preview(page);
  const visible = page.locator(
    '.fc-timegrid-col-events [data-calendar-event-id^="external:dense-"]',
  );
  await expect(visible).toHaveCount(3);
  const more = page.locator(".fc-timegrid-more-link");
  await expect(more).toHaveCount(1);
  await expect(more).toHaveAttribute("title", "Show 3 more events");
  await capture(page, "dense-week", "17:00:00");
  // Tab walks every rendered event and overflow link, independently of stacking.
  const targetIds = await page
    .locator(".fc [data-calendar-event-id]:visible")
    .evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).dataset.calendarEventId),
    );
  await page.getByLabel("Go to date", { exact: true }).focus();
  const reached = new Set<string>();
  let reachedMore = false;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => ({
      id: (document.activeElement as HTMLElement)?.dataset.calendarEventId,
      more: document.activeElement?.classList.contains("fc-timegrid-more-link"),
    }));
    if (focused.id) reached.add(focused.id);
    if (focused.more) reachedMore = true;
    if (targetIds.every((id) => reached.has(id!)) && reachedMore) break;
  }
  expect([...reached].sort()).toEqual(targetIds.sort());
  expect(reachedMore).toBe(true);
  for (const trigger of await visible.all()) await activate(page, trigger);
  await more.focus();
  await page.keyboard.press("Enter");
  const popover = page.locator(".fc-popover");
  await expect(popover).toBeVisible();
  const hidden = popover.locator('[data-calendar-event-id^="external:dense-"]');
  await expect(hidden).toHaveCount(3);
  for (const trigger of await hidden.all()) {
    await activate(page, trigger);
    await expect(popover).toBeVisible();
  }
  await noCardScrollbars(page);
  await popover.screenshot({ path: "work/layering-dense-popover.png" });
});

test("all-day header stays compact with original uncertainty and full overflow access", async ({
  page,
}) => {
  await preview(page);
  const body = page.locator(".fc-daygrid-body");
  expect((await body.boundingBox())!.height).toBeLessThan(110);
  await expect(body.locator(".all-day-card:visible")).toHaveCount(1);
  const more = body.locator(".fc-daygrid-more-link");
  await expect(more).toContainText("5 more");
  await more.focus();
  await page.keyboard.press("Space");
  const popup = page.locator(".fc-popover");
  await expect(popup.locator(".all-day-card")).toHaveCount(6);
  await expect(popup).toContainText("Time TBD");
  await activate(
    page,
    popup.locator('[data-calendar-event-id="external:date-5"]'),
  );
  await expect(popup).toBeVisible();
  await noCardScrollbars(page);
});

test("Day retains overlap geometry, short titles, compact gaps and independent records", async ({
  page,
}) => {
  await preview(page);
  await page.getByLabel("Go to date", { exact: true }).fill("2026-10-21");
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.locator(".fc-timeGridDay-view")).toBeVisible();
  const short = card(page, "short");
  expect(
    await short
      .locator(".event-title")
      .evaluate((n) => getComputedStyle(n).webkitLineClamp),
  ).toBe("1");
  expect(
    await short
      .locator(".event-title")
      .evaluate((n) => getComputedStyle(n).fontSize),
  ).toBe("10px");
  await expect(short.locator(".card-first-line")).toBeHidden();
  expect((await short.boundingBox())!.height).toBeLessThan(15);
  expect(await short.evaluate((n) => getComputedStyle(n).marginBottom)).toBe(
    "1px",
  );
  await short.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toContainText("4:30–4:40 PM");
  await page.keyboard.press("Escape");
  await expect(short).toBeFocused();
  await capture(page, "day");
  await noCardScrollbars(page);
});
