import {
  openPlannerChoices,
  openPlannerAnalysis,
} from "./helpers/planner-controls";
import { test, expect, type Page } from "@playwright/test";
async function sample(page: Page) {
  await page.goto("/planner");
  await openPlannerChoices(page);
  await page.getByRole("button", { name: "Load sample scenario" }).click();
}
const summary = (page: Page) =>
  page.getByRole("button", { name: /Weekly summary: Oct 18, 2026/ });
test("academic-level shortcuts and clusters are independent from majors and visibility", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Underclassmen", exact: true })
    .click();
  await expect(page.getByLabel("First year", { exact: true })).toBeChecked();
  await expect(page.getByLabel("Second year", { exact: true })).toBeChecked();
  await expect(
    page.getByLabel("Third year", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("Chemical Engineering (CHE)", { exact: true }),
  ).toBeChecked();
  await expect(page.locator(".planning-scope")).toContainText(
    "First year, Second year",
  );
  await expect(
    page.locator(
      ".calendar-region [data-calendar-event-id='example-industry']",
    ),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Upperclassmen", exact: true })
    .click();
  await expect(
    page.getByLabel("Fifth year or later", { exact: true }),
  ).toBeChecked();
  await expect(
    page.locator(
      ".calendar-region [data-calendar-event-id='example-industry']",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "All years", exact: true }).click();
  for (const name of [
    "First year",
    "Second year",
    "Third year",
    "Fourth year",
    "Fifth year or later",
  ])
    await expect(page.getByLabel(name, { exact: true })).toBeChecked();
  await page.getByLabel("Example Makers Network", { exact: true }).check();
  await page.getByLabel("Example Career Alliance", { exact: true }).check();
  await summary(page).click();
  await expect(page.getByRole("dialog")).toContainText(
    "2 explicit cluster matches",
  );
  await expect(
    page
      .getByRole("dialog")
      .getByText("Example Event: Bioprocess industry discussion", {
        exact: true,
      }),
  ).toHaveCount(1);
  await expect(
    page
      .getByRole("dialog")
      .getByText("Example Event: Design community game night", { exact: true }),
  ).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(summary(page)).toBeFocused();
});
test("desktop month adds one aligned eighth summary cell per week and keeps student grid intact", async ({
  page,
}) => {
  await sample(page);
  const rows = page.locator(".fc-daygrid-body > table > tbody > tr");
  await expect(rows).toHaveCount(5);
  await expect(
    page.locator(".weekly-summary-column .weekly-summary-cell"),
  ).toHaveCount(5);
  await expect(page.locator(".fc-col-header-cell")).toHaveCount(7);
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const rows = [
          ...document.querySelectorAll(".fc-daygrid-body > table > tbody > tr"),
        ];
        const summaries = [
          ...document.querySelectorAll(
            ".weekly-summary-column .weekly-summary-cell",
          ),
        ];
        return rows.every(
          (row, i) =>
            Math.abs(
              row.getBoundingClientRect().top -
                summaries[i].getBoundingClientRect().top,
            ) < 2 &&
            Math.abs(
              row.getBoundingClientRect().height -
                summaries[i].getBoundingClientRect().height,
            ) < 2,
        );
      });
    })
    .toBe(true);
  await expect(
    page
      .locator(".planner-month-surface .planner-external .event-title")
      .first(),
  ).toBeVisible();
  await expect(page.locator(".experimental-day-preparation")).toHaveCount(0);
  await page.getByLabel("Go to date", { exact: true }).fill("2026-12-31");
  await expect(
    page.getByRole("button", {
      name: /Weekly summary: Dec 27, 2026 – Jan 2, 2027/,
    }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".weekly-summary-column")).toHaveCount(0);
  await expect(page.locator(".fc-col-header-cell")).toHaveCount(7);
});
test("external layers default visible and hiding them leaves analysis and weekly details intact", async ({
  page,
}) => {
  await sample(page);
  const campus = page.getByLabel("Show Local commitments", {
    exact: true,
  });
  const national = page.getByLabel("Show national commitments", {
    exact: true,
  });
  await expect(campus).toBeChecked();
  await expect(national).toBeChecked();
  const initial = (await summary(page).textContent())!;
  await page.getByLabel("Show PSU-wide commitments", { exact: true }).uncheck();
  await campus.uncheck();
  await national.uncheck();
  await expect(page.locator(".fc-event.planner-external")).toHaveCount(0);
  await expect(summary(page)).toHaveText(initial);
  for (const key of ["Enter", "Space"]) {
    await summary(page).focus();
    await page.keyboard.press(key);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Example major election scenario");
    await expect(dialog).toContainText("Example Homecoming weekend");
    await expect(dialog).toContainText("Time unknown");
    await expect(dialog).toContainText(
      "Overall scoring methodology: awaiting review",
    );
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Close weekly summary details" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(summary(page)).toBeFocused();
  }
  await page
    .locator(".planner-display")
    .screenshot({ path: "work/intelligence-toggles.png" });
});
test("external event opens its own details and restores keyboard focus", async ({
  page,
}) => {
  await sample(page);
  const trigger = page.locator(
    ".calendar-region [data-calendar-event-id='external:scenario-election']",
  );
  for (const key of ["Enter", "Space"]) {
    await trigger.focus();
    await page.keyboard.press(key);
    await expect(
      page
        .getByRole("dialog")
        .getByText("External event details", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("heading", {
        name: "Example major election scenario",
        exact: true,
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
});
test("week preparation preview is opt-in and distinct from overall scoring and direct intervals", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Analyze proposal", exact: true })
    .click();
  await page.getByRole("button", { name: "1 Week", exact: true }).click();
  const proposalCard = page.locator(
    ".fc-timegrid-event.planner-proposal .fc-event-main",
  );
  await expect(proposalCard).toContainText("4:30–5:30 PM");
  expect(
    await proposalCard.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".experimental-day-preparation")).toHaveCount(0);
  await openPlannerAnalysis(page);
  await page
    .getByLabel("Preview experimental exam preparation", { exact: true })
    .check();
  await expect(page.locator(".pressure-day")).toHaveCount(7);
  await expect(page.locator(".pressure-preview")).toContainText(
    "10 PM Eastern reference",
  );
  await expect(page.locator(".pressure-preview")).toContainText(
    "never percentages",
  );
  await expect(
    page.locator(".pressure-day").filter({
      has: page.getByRole("heading", { name: "Oct 21, 2026", exact: true }),
    }),
  ).toContainText("Experimental day peak");
  const values = await page.locator(".preparation-value").allTextContents();
  await page.getByLabel("Show academic exams", { exact: true }).uncheck();
  await page.getByLabel("Show national commitments", { exact: true }).uncheck();
  await expect(page.locator(".preparation-value")).toHaveText(values);
  await page
    .locator(".calendar-region")
    .screenshot({ path: "work/intelligence-week-1440.png" });
});
for (const width of [320, 375, 430, 768, 1440])
  test(`weekly intelligence responsive layout and details at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 1100 });
    await sample(page);
    await page
      .getByRole("button", { name: "Analyze proposal", exact: true })
      .click();
    await page.evaluate(() => document.fonts.ready);
    if (width < 1024) {
      await expect(page.locator(".weekly-summary-column")).toHaveCount(0);
      await expect(
        page.locator(".mobile-calendar .fc-list-day").first(),
      ).toBeVisible();
      await expect(page.locator(".fc-list-day th").first()).toHaveCSS(
        "position",
        "static",
      );
      await expect(page.locator(".fc-list-day").first()).toContainText(
        "Monday, October 19",
      );
      await expect(page.locator(".mobile-list-event").first()).toHaveCSS(
        "background-color",
        "rgb(255, 255, 255)",
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".timezone-label")).toHaveText(
      "All Times Eastern (ET)",
    );
    await expect(page.locator("body")).not.toContainText(/\b(?:EST|EDT)\b/);
    await page.screenshot({
      path: `work/intelligence-planner-${width}.png`,
      fullPage: true,
    });
    await page
      .locator(".calendar-region")
      .screenshot({ path: `work/intelligence-calendar-${width}.png` });
    await summary(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    expect((await page.getByRole("dialog").boundingBox())!.width).toBeLessThan(
      width,
    );
    expect(
      await page
        .getByRole("dialog")
        .evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: `work/intelligence-details-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(summary(page)).toBeFocused();
    expect(errors).toEqual([]);
  });
