import { test, expect, type Page } from "@playwright/test";
const card = (page: Page, id: string) =>
  page.locator(`[data-calendar-event-id="${id}"]`).first();
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function capture(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `work/discovery-${name}.png`, fullPage: true });
}
const palette = [
  ["career-networking", "rgb(229, 170, 117)", "rgb(169, 101, 48)"],
  ["professional-development", "rgb(166, 211, 204)", "rgb(67, 139, 124)"],
  ["technical-workshop", "rgb(227, 202, 120)", "rgb(160, 133, 48)"],
  ["general-body-meeting", "rgb(199, 167, 223)", "rgb(128, 85, 165)"],
  ["competition", "rgb(229, 154, 165)", "rgb(172, 78, 99)"],
  ["social-recreational", "rgb(169, 207, 138)", "rgb(100, 140, 58)"],
];
function contrast(a: string, b: string) {
  const luminance = (s: string) =>
    s
      .match(/\d+/g)!
      .slice(0, 3)
      .map(Number)
      .reduce((n, v, i) => {
        const c = v / 255;
        return (
          n +
          (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) *
            [0.2126, 0.7152, 0.0722][i]
        );
      }, 0);
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
for (const view of [
  "dayGridMonth",
  "timeGridWeek",
  "timeGridDay",
  "listMonth",
]) {
  test(`six category palette, hosting and keyboard details work in ${view}`, async ({
    page,
  }) => {
    await page.goto(`/?date=2026-11-16&view=${view}`);
    await expect(
      page
        .locator(".filters-panel .filter-group")
        .filter({ hasText: "Event categories" })
        .getByRole("checkbox"),
    ).toHaveCount(6);
    await expect(
      page.getByRole("region", {
        name: "Event categories legend",
        exact: true,
      }),
    ).toBeVisible();
    const observed = new Set<string>();
    for (const date of view === "timeGridDay"
      ? ["2026-11-16", "2026-11-17", "2026-11-18"]
      : ["2026-11-16"]) {
      await page.getByLabel("Go to date", { exact: true }).fill(date);
      for (const [id, bg, border] of palette) {
        const node = page
          .locator(`.student-category-calendar .fc-event.category-${id}`)
          .first();
        if (!(await node.count())) continue;
        const trigger =
          view === "listMonth" ? node.locator(".list-event-trigger") : node;
        const colors = await trigger.evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.backgroundColor, s.borderTopColor, s.color];
        });
        expect(colors).toEqual([bg, border, "rgb(28, 36, 48)"]);
        expect(contrast(bg, colors[2])).toBeGreaterThanOrEqual(4.5);
        const secondary = await trigger
          .locator(".event-category")
          .evaluate((el) => getComputedStyle(el).color);
        expect(secondary).toBe("rgb(52, 64, 78)");
        expect(contrast(bg, secondary)).toBeGreaterThanOrEqual(4.5);
        await expect(trigger.locator(".event-category")).not.toBeEmpty();
        observed.add(id);
      }
    }
    expect(observed.size).toBe(6);
    if (view === "listMonth") {
      await expect(page.locator(".fc-list-day")).toHaveCount(4);
      await expect(page.locator(".fc-list-day").first()).toContainText(
        "Monday, November 16",
      );
    }
    await page.getByLabel("Go to date", { exact: true }).fill("2026-11-16");
    const trigger = card(page, "discovery-bme");
    if (view === "timeGridDay") {
      await expect(trigger.locator(".hosts-full")).toBeVisible();
      await expect(trigger.locator(".hosts-compact")).toBeHidden();
      const eventBounds = (await trigger.boundingBox())!;
      for (const selector of [
        ".hosting-badge",
        ".hosts-full",
        ".event-location",
      ]) {
        const bounds = (await trigger.locator(selector).boundingBox())!;
        expect(bounds.x).toBeGreaterThanOrEqual(eventBounds.x);
        expect(bounds.y).toBeGreaterThanOrEqual(eventBounds.y);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(
          eventBounds.x + eventBounds.width,
        );
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(
          eventBounds.y + eventBounds.height,
        );
      }
    }
    if (view === "timeGridWeek")
      await expect(trigger.locator(".hosts-compact")).toBeVisible();
    await trigger.focus();
    for (const key of ["Enter", "Space"]) {
      await page.keyboard.press(key);
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("Department-hosted");
      await expect(dialog).toContainText(
        "Penn State Department of Biomedical Engineering",
      );
      await expect(dialog.locator(".detail-description")).toHaveText(
        "Fictional hands-on biomedical design training.",
      );
      await expect(dialog.locator(".hosting-badge svg")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    await noOverflow(page);
    await capture(page, `student-${view}`);
  });
}

test("all nine hosting arrangements use structured badges and responsive full host names", async ({
  page,
}) => {
  await page.goto("/?date=2026-11-16&view=listMonth");
  const cases = [
    ["discovery-coe", 1, "PSU Hosted"],
    ["discovery-bme", 1, "PSU Hosted"],
    ["discovery-matse", 1, "PSU Hosted"],
    ["discovery-units", 1, "PSU Hosted"],
    ["discovery-cohost", 2, "Co-hosted"],
    ["discovery-dept-cohost", 2, "Co-hosted"],
    ["discovery-student", 0, ""],
    ["discovery-students", 0, ""],
    ["discovery-unknown", 0, ""],
  ] as const;
  for (const [id, paws, label] of cases) {
    const node = card(page, id);
    await expect(node.locator(".hosting-badge svg")).toHaveCount(paws);
    if (paws) {
      await expect(node.locator(".hosting-badge")).toHaveText(label);
      await expect(node.locator(".hosting-badge")).toHaveAttribute(
        "aria-label",
        /Penn State/,
      );
      const colors = await node.locator(".hosting-badge").evaluate((el) => {
        const style = getComputedStyle(el);
        return [style.backgroundColor, style.color, style.borderTopColor];
      });
      expect(colors).toEqual([
        "rgb(255, 255, 255)",
        "rgb(30, 64, 124)",
        "rgb(184, 199, 219)",
      ]);
      expect(contrast(colors[0], colors[1])).toBeGreaterThanOrEqual(4.5);
    } else await expect(node.locator(".hosting-badge")).toHaveCount(0);
    await expect(node).not.toContainText("🐾");
  }
  await expect(
    card(page, "discovery-coe").locator(".hosts-full"),
  ).toBeVisible();
  await expect(
    card(page, "discovery-coe").locator(".hosts-compact"),
  ).toBeHidden();
  await expect(card(page, "discovery-coe").locator(".hosts-full")).toHaveText(
    "Penn State College of Engineering",
  );
  await expect(
    card(page, "discovery-cohost").locator(".hosts-full"),
  ).toContainText("Biomedical Engineering Society");
  await card(page, "discovery-matse").click();
  await expect(page.getByRole("dialog")).toContainText(
    "Penn State Department of Materials Science and Engineering",
  );
  await expect(page.getByRole("dialog")).toContainText("Department-hosted");
  await expect(page.getByRole("dialog")).toContainText(
    "Penn State College of Earth and Mineral Sciences",
  );
  await capture(page, "department-details");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(
    card(page, "discovery-cohost").locator(".hosts-compact"),
  ).toHaveText("CoE + BMES");
  await expect(
    card(page, "discovery-cohost").locator(".hosts-compact"),
  ).toBeVisible();
  const pawSizes = await card(page, "discovery-coe")
    .locator("svg")
    .evaluate((el) => el.getBoundingClientRect().height);
  const coSizes = await card(page, "discovery-cohost")
    .locator("svg")
    .first()
    .evaluate((el) => el.getBoundingClientRect().height);
  expect(pawSizes).toBeGreaterThan(coSizes);
  const badge = card(page, "discovery-cohost").locator(".hosting-badge");
  expect(await badge.evaluate((el) => getComputedStyle(el).display)).toBe(
    "inline-flex",
  );
  expect(
    await badge
      .locator(".hosting-icons")
      .evaluate((el) => getComputedStyle(el).display),
  ).toBe("flex");
  const paws = await badge.locator("svg").all();
  const firstPaw = (await paws[0].boundingBox())!;
  const secondPaw = (await paws[1].boundingBox())!;
  expect(firstPaw.x + firstPaw.width).toBeLessThanOrEqual(secondPaw.x);
  const label = (await badge.locator(":scope > span").nth(1).boundingBox())!;
  expect(label.x).toBeGreaterThanOrEqual(secondPaw.x + secondPaw.width);
  expect(
    Math.abs(label.y + label.height / 2 - firstPaw.y - firstPaw.height / 2),
  ).toBeLessThan(2);
  await expect(
    card(page, "discovery-cohost").locator(".hosts-full"),
  ).toBeHidden();
  await capture(page, "hosting-month");
});

test("welcome, real cluster guide, AND filters and browser history remain usable", async ({
  page,
}) => {
  await page.goto("/?date=2026-10-21&view=listMonth");
  await expect(
    page.getByRole("heading", { name: "Hey, find your next event here!" }),
  ).toBeVisible();
  const guide = page.locator(".discovery-guide");
  await expect(guide).not.toHaveAttribute("open", "");
  await guide.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(guide).toHaveAttribute("open", "");
  await expect(guide.locator("section").first().locator("li")).toHaveCount(6);
  await expect(guide).toContainText("Example Makers Network");
  await expect(guide).toContainText("Example Career Alliance");
  await capture(page, "guide-expanded");
  await page
    .getByLabel("Biomedical Engineering (BME)", { exact: true })
    .check();
  await expect(card(page, "example-industry")).toBeVisible();
  await expect(card(page, "example-process-lab")).toHaveCount(0);
  await capture(page, "major-only");
  await page
    .getByLabel("Example Process Engineering Society", { exact: true })
    .check();
  await expect(page.locator(".fc-event")).toHaveCount(1);
  await expect(card(page, "example-industry")).toBeVisible();
  await capture(page, "major-organization");
  await page.getByLabel("Example Makers Network", { exact: true }).check();
  await expect(page.locator(".fc-event")).toHaveCount(1);
  await expect(page).toHaveURL(/clusters=example-makers/);
  await page.goBack();
  await expect(
    page.getByLabel("Example Makers Network", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("Example Process Engineering Society", { exact: true }),
  ).toBeChecked();
  await page.goBack();
  await expect(
    page.getByLabel("Example Process Engineering Society", { exact: true }),
  ).not.toBeChecked();
  await expect(card(page, "example-design-meeting")).toBeVisible();
  await page.goForward();
  await expect(
    page.getByLabel("Example Process Engineering Society", { exact: true }),
  ).toBeChecked();
  await page.reload();
  await expect(
    page.getByLabel("Biomedical Engineering (BME)", { exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .first()
    .click();
  await expect(card(page, "example-open-studio")).toBeVisible();
  await expect(page.locator(".filter-count")).toHaveText("0 active filters");
});

test("planner collapsible dropdowns retain analysis and reclaim the calendar width", async ({
  page,
}) => {
  await page.goto("/planner");
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
  const panel = page.locator(".planner-controls");
  await expect(panel).toHaveAttribute("open", "");
  await expect(panel.locator(".selection-dropdown")).toHaveCount(4);
  for (const dropdown of await panel.locator(".selection-dropdown").all())
    await expect(dropdown).not.toHaveAttribute("open", "");
  const majors = panel.locator(".selection-dropdown").filter({
    has: page
      .locator("summary strong")
      .getByText("Planning majors", { exact: true }),
  });
  await majors.locator("summary").focus();
  await page.keyboard.press("Enter");
  await page
    .getByLabel("Biomedical Engineering (BME)", { exact: true })
    .check();
  await majors.locator("summary").focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByLabel("Biomedical Engineering (BME)", { exact: true }),
  ).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(
    page.getByLabel("Biomedical Engineering (BME)", { exact: true }),
  ).toBeChecked();
  await panel
    .locator(".selection-dropdown")
    .filter({ hasText: "Calendar layers" })
    .locator("summary")
    .click();
  await page.getByLabel("Show national commitments", { exact: true }).uncheck();
  await page.getByLabel("Show scheduling density", { exact: true }).check();
  await page
    .getByRole("button", { name: "Analyze proposal", exact: true })
    .click();
  const analysis = await page.locator(".proposal-factors").innerText();
  await capture(page, "planner-filters-expanded");
  await panel.locator(":scope > summary").focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByLabel("Example organization", { exact: true }),
  ).toBeHidden();
  await expect(panel.locator(".planner-collapsed-summary")).toContainText(
    "BME",
  );
  await expect(panel.locator(".planner-collapsed-summary")).toContainText(
    "1 hidden calendar layers",
  );
  await expect(panel.locator(".planner-filter-count")).toHaveText(
    "4 active filters",
  );
  await expect(page.locator(".proposal-factors")).toHaveText(analysis, {
    useInnerText: true,
  });
  await capture(page, "planner-filters-collapsed");
  const main = await page.locator(".planner-layout").boundingBox();
  const calendar = await page.locator(".calendar-region").boundingBox();
  expect(calendar!.width / main!.width).toBeGreaterThan(0.95);
  expect(
    await page
      .locator(".planner-layout")
      .evaluate((el) => getComputedStyle(el).display),
  ).toBe("block");
  await panel.locator(":scope > summary").click();
  await expect(
    page.getByLabel("Biomedical Engineering (BME)", { exact: true }),
  ).toBeChecked();
  await expect(
    page.getByLabel("Show national commitments", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("Show scheduling density", { exact: true }),
  ).toBeChecked();
  await page
    .getByLabel("Example organization", { exact: true })
    .selectOption("example-design");
  await expect(
    page.getByLabel("Show national commitments", { exact: true }),
  ).not.toBeChecked();
  await expect(page.locator(".proposal-factors")).toHaveCount(0);
  for (const name of ["Month", "2 Weeks", "1 Week", "Day", "List"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await noOverflow(page);
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".calendar-region").screenshot({
      path: `work/discovery-planner-${name.replaceAll(" ", "-").toLowerCase()}.png`,
    });
  }
});

for (const width of [320, 375, 430, 768, 1024, 1440]) {
  test(`student hosts, guide and full-width planner reflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?date=2026-11-16&view=listMonth");
    await expect(card(page, "discovery-cohost")).toBeVisible();
    await expect(
      card(page, "discovery-cohost").locator(".hosting-badge svg"),
    ).toHaveCount(2);
    await expect(page.locator(".timezone-label")).toHaveText(
      "All Times Eastern (ET)",
    );
    if (width < 768) {
      await expect(
        card(page, "discovery-cohost").locator(".hosts-compact"),
      ).toBeVisible();
      await expect(
        card(page, "discovery-cohost").locator(".hosts-compact"),
      ).toHaveText("CoE + BMES");
    }
    await noOverflow(page);
    if (width < 1024) {
      const firstEvent = await card(page, "discovery-coe").boundingBox();
      expect(firstEvent!.y).toBeLessThan(1000);
    }
    await capture(page, `student-${width}`);
    await page.goto("/planner");
    await page
      .getByRole("button", { name: "Load sample scenario", exact: true })
      .click();
    await page.locator(".planner-controls > summary").click();
    await noOverflow(page);
    await capture(page, `planner-${width}`);
  });
}
for (const type of ["deuteranopia", "protanopia", "tritanopia"] as const) {
  test(`category labels and host badges remain distinguishable with ${type} simulation`, async ({
    page,
  }) => {
    await page.goto("/?date=2026-11-16&view=listMonth");
    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setEmulatedVisionDeficiency", { type });
    const labels = await page
      .locator(".student-category-legend li")
      .allTextContents();
    expect(new Set(labels).size).toBe(6);
    await expect(
      card(page, "discovery-cohost").getByText("Co-hosted", { exact: true }),
    ).toBeVisible();
    await expect(
      card(page, "discovery-coe").getByText("PSU Hosted", { exact: true }),
    ).toBeVisible();
    await capture(page, `vision-${type}`);
  });
}
