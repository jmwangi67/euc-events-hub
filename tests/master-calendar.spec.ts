import { test, expect, type Page } from "@playwright/test";

async function sample(page: Page) {
  await page.goto("/planner");
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
  await page.getByLabel("Go to date", { exact: true }).fill("2026-10-21");
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
function contrast(a: number[], b: number[]) {
  const luminance = (values: number[]) =>
    values.reduce((sum, value, index) => {
      const normalized = value / 255;
      return (
        sum +
        (normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4) *
          [0.2126, 0.7152, 0.0722][index]
      );
    }, 0);
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("scope cards retain their exact readable palette above hourly density and remain keyboard interactive", async ({
  page,
}) => {
  await sample(page);
  const toggle = page.getByRole("checkbox", {
    name: "Show scheduling density",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  const before = await page.locator(".calendar-summary").innerText();
  await toggle.check();
  await expect(
    page.getByRole("region", { name: "Scheduling Density", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".calendar-summary")).toHaveText(before);
  await page.getByRole("button", { name: "Day", exact: true }).click();
  const palettes = [
    [
      ".external-psu-wide",
      "rgb(145, 184, 229)",
      "rgb(50, 103, 163)",
      "rgb(16, 45, 80)",
    ],
    [
      ".external-national",
      "rgb(238, 192, 120)",
      "rgb(162, 106, 33)",
      "rgb(77, 45, 13)",
    ],
    [
      ".external-campus-local",
      "rgb(148, 201, 173)",
      "rgb(57, 121, 92)",
      "rgb(18, 62, 43)",
    ],
    [
      ".category-general-body-meeting",
      "rgb(255, 255, 255)",
      "rgb(154, 169, 186)",
      "rgb(0, 30, 68)",
    ],
  ];
  for (const [selector, background, border, foreground] of palettes) {
    const card = page.locator(`.fc-timegrid-event${selector}`).first();
    await expect(card).toBeVisible();
    const colors = await card.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        background: style.backgroundColor,
        border: style.borderTopColor,
        foreground: style.color,
      };
    });
    expect(colors).toEqual({ background, border, foreground });
    const channels = (color: string) =>
      color.match(/\d+/g)!.map(Number).slice(0, 3);
    expect(
      contrast(channels(colors.background), channels(colors.foreground)),
    ).toBeGreaterThanOrEqual(4.5);
  }
  const backgrounds = page.locator(".scheduling-density-background");
  await expect(backgrounds.first()).toBeAttached();
  const actualBands = await backgrounds.evaluateAll((nodes) =>
    nodes.map((node) => ({
      band: [...node.classList].find((name) =>
        /^density-(?:one|two|three-plus)$/.test(name),
      ),
      background: getComputedStyle(node).backgroundColor,
      opacity: getComputedStyle(node).opacity,
    })),
  );
  const bandPalette = {
    "density-one": "rgb(198, 204, 214)",
    "density-two": "rgb(167, 155, 184)",
    "density-three-plus": "rgb(116, 95, 137)",
  };
  for (const segment of actualBands) {
    expect(segment.background).toBe(
      bandPalette[segment.band as keyof typeof bandPalette],
    );
    expect(segment.opacity).toBe("1");
  }
  expect(new Set(actualBands.map((segment) => segment.band))).toEqual(
    new Set(Object.keys(bandPalette)),
  );
  expect(
    await backgrounds.evaluateAll((nodes) =>
      nodes.every(
        (node) =>
          getComputedStyle(node).pointerEvents === "none" &&
          node.getAttribute("aria-hidden") === "true" &&
          node.getAttribute("tabindex") !== "0",
      ),
    ),
  ).toBe(true);
  const event = page
    .locator(".fc-timegrid-event.category-general-body-meeting")
    .first();
  await event.focus();
  expect(
    await event.evaluate(
      (node) => getComputedStyle(node, "::after").backgroundColor,
    ),
  ).toBe("rgba(0, 0, 0, 0)");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(event).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(event).toBeFocused();
  await event.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await noOverflow(page);
  await page
    .locator(".calendar-region")
    .screenshot({ path: "work/master-crowded-density-day.png" });
  await page.getByRole("button", { name: "List", exact: true }).click();
  for (const [selector, background, border, foreground] of palettes) {
    const card = page
      .locator(`.fc-list-event${selector} .list-event-trigger`)
      .first();
    await expect(card).toBeVisible();
    expect(
      await card.evaluate((node) => {
        const style = getComputedStyle(node);
        return [style.backgroundColor, style.borderTopColor, style.color];
      }),
    ).toEqual([background, border, foreground]);
  }
});

test("all density colors have factual labels and display toggles do not alter their analysis", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("checkbox", { name: "Show scheduling density", exact: true })
    .check();
  const legend = page.getByRole("region", {
    name: "Scheduling Density",
    exact: true,
  });
  for (const label of [
    "0 simultaneous commitments",
    "1 simultaneous commitment",
    "2 simultaneous commitments",
    "3+ simultaneous commitments",
  ])
    await expect(legend.getByText(label, { exact: true })).toBeVisible();
  const expected = [
    "rgb(242, 244, 247)",
    "rgb(198, 204, 214)",
    "rgb(167, 155, 184)",
    "rgb(116, 95, 137)",
  ];
  expect(
    await page
      .locator(".density-swatch")
      .evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node).backgroundColor),
      ),
  ).toEqual(expected);
  const date = page.locator('.fc-daygrid-day[data-date="2026-10-21"]');
  await expect(date).toHaveClass(/density-three-plus/);
  await expect(date.locator(".density-cell-count")).toHaveText("3+ timed");
  await expect(date.locator(".density-cell-count")).toHaveAttribute(
    "aria-label",
    /Peak known-time subgroup density/,
  );
  await expect(date.locator(".fc-daygrid-more-link")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  const classes = await date.getAttribute("class");
  const guidance = await page
    .getByRole("region", { name: "Calendar scheduling guidance" })
    .textContent();
  const controls = page.getByRole("group", { name: "Calendar display" });
  for (const label of [
    "Show published events",
    "Show academic exams",
    "Show PSU-wide commitments",
    "Show Local commitments",
    "Show national commitments",
  ]) {
    const control = controls.getByRole("checkbox", {
      name: label,
      exact: true,
    });
    await control.uncheck();
  }
  await expect(date).toHaveAttribute("class", classes!);
  await expect(
    page.getByRole("region", { name: "Calendar scheduling guidance" }),
  ).toHaveText(guidance!);
  await page
    .getByRole("checkbox", { name: "Show scheduling density", exact: true })
    .uncheck();
  await expect(
    page.getByRole("region", { name: "Scheduling Density", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Calendar scheduling guidance" }),
  ).toHaveText(guidance!);
});

test("planner retains all five layouts with independent density and weekly focus controls", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("checkbox", { name: "Show scheduling density", exact: true })
    .check();
  for (const [name, selector, hourly] of [
    ["Month", ".fc-dayGridMonth-view", false],
    ["2 Weeks", ".fc-dayGridTwoWeeks-view", false],
    ["1 Week", ".fc-timeGridWeek-view", true],
    ["Day", ".fc-timeGridDay-view", true],
    ["List", ".fc-listMonth-view", false],
  ] as const) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator(".fc-timegrid-body")).toHaveCount(hourly ? 1 : 0);
    if (name === "Month" || name === "2 Weeks") {
      const focus = page
        .getByRole("button", { name: /^Focus this week in calendar:/ })
        .first();
      await focus.click();
      await expect(page.locator(".week-row-link").first()).toBeFocused();
    }
    if (name === "List")
      await expect(page.locator(".density-day-badge").first()).toBeVisible();
    await noOverflow(page);
    await page.locator(".calendar-region").screenshot({
      path: `work/master-planner-${name.replaceAll(" ", "-").toLowerCase()}.png`,
    });
  }
});

for (const width of [320, 375, 430, 768, 1024, 1440]) {
  test(`calendar arrows stay square and centered and grouped list readable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await sample(page);
    await page
      .getByRole("checkbox", { name: "Show scheduling density", exact: true })
      .check();
    const arrow = page.getByRole("button", {
      name: "Previous date range",
      exact: true,
    });
    const box = await arrow.boundingBox();
    const glyph = await arrow.locator("span").boundingBox();
    expect(box).not.toBeNull();
    expect(glyph).not.toBeNull();
    expect(Math.abs(box!.width - box!.height)).toBeLessThan(1);
    expect(
      Math.abs(box!.x + box!.width / 2 - glyph!.x - glyph!.width / 2),
    ).toBeLessThan(1);
    expect(
      Math.abs(box!.y + box!.height / 2 - glyph!.y - glyph!.height / 2),
    ).toBeLessThan(1);
    if (width <= 768) {
      await expect(page.locator(".fc-listMonth-view")).toBeVisible();
      const header = page
        .locator(".fc-list-day")
        .filter({ hasText: "Wednesday, October 21" });
      await expect(header).toHaveCount(1);
      await expect(
        page.locator(
          ".fc-list-event.category-general-body-meeting .mobile-list-event",
        ),
      ).toContainText("6:00–7:00 PM");
      const button = page.locator(
        ".fc-list-event.category-social-recreational .mobile-list-event",
      );
      await expect(button).toContainText("6:30–8:00 PM");
      await expect(button).toContainText("Social & Recreational");
    }
    await noOverflow(page);
    await page
      .locator(".calendar-region")
      .screenshot({ path: `work/master-calendar-${width}.png` });
  });
}

test("hard avoidance guidance remains visible without density and expands all reasons", async ({
  page,
}) => {
  await sample(page);
  await page.getByLabel("Go to date", { exact: true }).fill("2026-10-30");
  await expect(
    page.getByRole("checkbox", {
      name: "Show scheduling density",
      exact: true,
    }),
  ).not.toBeChecked();
  const banner = page.locator(
    ".calendar-primary-caution.caution-avoid-scheduling",
  );
  await expect(banner).toBeVisible();
  await page.locator(".calendar-guidance-details > summary").click();
  const caution = page.locator(".day-caution.caution-avoid-scheduling").first();
  await expect(caution).toBeVisible();
  await expect(caution.locator("summary")).toContainText("Avoid scheduling");
  await caution.locator("summary").click();
  await expect(caution.locator(".day-caution-reasons")).toBeVisible();
  await expect(caution).toContainText("THON");
  await page
    .locator(".calendar-region")
    .screenshot({ path: "work/master-thon-avoidance.png" });
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Show scheduling density", exact: true })
    .check();
  await expect(
    page.locator(".calendar-primary-caution.caution-avoid-scheduling"),
  ).toBeVisible();
  await expect(page.locator(".scheduling-density-background")).toHaveCount(0);
});
