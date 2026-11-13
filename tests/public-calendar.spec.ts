import { test, expect } from "@playwright/test";

test("public routes ignore the fixture flag and return curated calendar data", async ({
  request,
}) => {
  const window = { start: "2026-08-01", end: "2027-10-01" };
  for (const planning of [false, true]) {
    const response = await request.post("/api/data/calendar", {
      data: { window, planning },
    });
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.publicExams.exams).toHaveLength(84);
    expect(data.events.length).toBeGreaterThan(25);
    expect(data.externalEvents.length).toBeGreaterThan(35);
    expect(JSON.stringify(data)).not.toMatch(
      /Example Engineering Council|private-staging|MASTER\.docx|example-welcome/,
    );
    expect(data.exams).toEqual([]);
  }
  const detail = await request.post("/api/data/event", {
    data: { id: "example-welcome" },
  });
  expect(await detail.json()).toEqual({ event: null });
});

test("regular student calendar shows possible dates and source uncertainty on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?date=2026-11-20&view=listMonth");
  await page.getByLabel("Search events", { exact: true }).fill("BIOL 224");
  const possible = page.getByRole("button", {
    name: /Academic Exam BIOL 224.*Possible additional date/,
  });
  await expect(possible).toBeVisible();
  await possible.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Alternative testing dates");
  await expect(dialog).toContainText("Possible additional date");
  await expect(dialog).toContainText("Time unknown");
  await expect(dialog).toContainText(
    "Source-reported, not independently verified",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(possible).toBeFocused();
});

test("public planner shows provisional exams and restores weekly focus across compact resizing", async ({
  page,
}) => {
  await page.goto("/planner?date=2026-11-18");
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: /Academic Exam BIOL 224.*Possible additional date/,
    }),
  ).toBeVisible();
  const summary = page.getByRole("button", {
    name: /^Weekly summary: Nov 15, 2026/,
  });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toContainText(
    "Reported exam occurrences",
  );
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect(page.locator(".fc-listMonth-view")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(summary).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("career and arena occurrences display accurate times and provenance", async ({
  page,
}) => {
  await page.goto("/?date=2027-02-10&view=listMonth");
  await expect(
    page.getByRole("button", { name: /Engineering Career Fair.*1:00–6:00 PM/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Chemical Engineering Networking Reception/,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Breaking Benjamin/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("End time unlisted");
  await expect(dialog).toContainText("Doors open");
  await expect(dialog.getByRole("link", { name: /Source/ })).toHaveAttribute(
    "href",
    /bjc\.psu\.edu/,
  );
});
