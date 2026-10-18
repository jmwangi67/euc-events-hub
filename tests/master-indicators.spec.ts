import { test, expect, type Page } from "@playwright/test";

const peakCaveat =
  "Peak may be a limit just before an exam starts. It is not pressure after an exam, a daily average, or a whole-audience score.";

async function sampleWeek(page: Page) {
  await page.goto("/planner");
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
  await page.getByRole("button", { name: "1 Week", exact: true }).click();
  await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible();
}

const examSection = (page: Page) =>
  page.getByRole("region", { name: "Exam Preparation", exact: true });
const otherSection = (page: Page) =>
  page
    .locator(".pressure-preview")
    .getByRole("region", { name: "Other Scheduling Constraints", exact: true });

test("exam ranges are opt-in, striped uncertainty is accessible, and advanced sources start closed", async ({
  page,
}) => {
  await sampleWeek(page);
  const exams = examSection(page);
  const other = otherSection(page);
  await expect(exams).toBeVisible();
  await expect(other).toBeVisible();
  await expect(
    exams.getByLabel("Preview experimental exam preparation", { exact: true }),
  ).not.toBeChecked();
  await expect(exams.locator("[data-preparation-range]")).toHaveCount(0);
  await expect(
    other.getByRole("img", {
      name: "Numerical Other Scheduling Constraints score unavailable — awaiting methodology review",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".overall-pressure-pending")).toHaveAttribute(
    "data-overall-status",
    "awaiting-methodology-review",
  );
  const unknown = exams.getByRole("region", {
    name: "Audience-uncertain academic constraints",
    exact: true,
  });
  await expect(unknown).toContainText("EXAMPLE-UNMAPPED-COURSE");
  await expect(unknown).toContainText("no numerical preparation");
  await expect(unknown).toContainText("Demo data — not verified");
  await expect(unknown).toBeVisible();

  await exams
    .getByLabel("Preview experimental exam preparation", { exact: true })
    .check();
  await expect(exams.locator(".experimental-day-preparation")).toHaveCount(7);
  await expect(exams.getByText(peakCaveat, { exact: true })).toHaveCount(1);
  await expect(exams.getByText(peakCaveat, { exact: true })).toBeVisible();
  const day = exams.locator(".pressure-day").filter({
    has: page.getByRole("heading", { name: "Oct 21, 2026", exact: true }),
  });
  await expect(day).toContainText("Experimental day peak");
  await expect(day).toContainText("Most affected selected subgroups");
  await expect(day).toContainText("Main contributing exams");
  await expect(day).toContainText("EXAMPLE-MATH");
  const range = day.locator("[data-preparation-range]");
  await expect(range.getByRole("img")).toHaveAttribute(
    "aria-label",
    /uncertainty up to the upper bound, not probability/,
  );
  await expect(range.locator('[data-range-part="solid"]')).toHaveCount(1);
  await expect(range.locator('[data-range-part="uncertainty"]')).toBeVisible();
  await expect(range.locator('[data-range-part="unfilled"]')).toHaveCount(1);
  const dimensions = await range
    .locator("[data-range-part]")
    .evaluateAll((parts) =>
      parts.map((part) => Number.parseFloat((part as HTMLElement).style.width)),
    );
  expect(dimensions.reduce((total, value) => total + value, 0)).toBeCloseTo(
    100,
  );
  const stripedBackground = await range
    .locator('[data-range-part="uncertainty"]')
    .evaluate((part) => getComputedStyle(part).backgroundImage);
  expect(stripedBackground).toContain("repeating-linear-gradient");

  const advancedSummary = exams.getByText("Advanced methodology & sources", {
    exact: true,
  });
  const advanced = advancedSummary.locator("..");
  await expect(advanced).not.toHaveAttribute("open", "");
  await expect(
    exams.getByText("Inspect 10 PM contributions", { exact: true }).first(),
  ).toBeHidden();
  await expect(unknown).toBeVisible();
  await exams.screenshot({ path: "work/master-preparation-range.png" });

  await advancedSummary.focus();
  await page.keyboard.press("Enter");
  await expect(advanced).toHaveAttribute("open", "");
  const advancedDay = advanced.locator("section").filter({
    has: page.getByRole("heading", { name: "Oct 21, 2026", exact: true }),
  });
  const groups = advancedDay
    .locator(":scope > details > summary")
    .filter({ hasText: /Inspect all distinct subgroup estimates/ });
  await expect(groups).toHaveCount(1);
  await groups.click();
  await expect(advancedDay.locator(".preparation-cell").first()).toBeVisible();
  await expect(advancedDay).toContainText(
    "Cells are never added or population averaged",
  );
  await expect(advancedDay).toContainText("Upper maximum");
  await expect(advancedDay).toContainText("Lower maximum");
  await expect(advancedDay).toContainText("Curated course-to-major");
  await expect(advancedDay).toContainText("Demo data — not verified");
  await advancedDay
    .getByText("Inspect 10 PM contributions", { exact: true })
    .click();
  await expect(
    advancedDay.getByRole("img", {
      name: /10 PM experimental relative preparation estimate:/,
    }),
  ).toBeVisible();
  await advancedSummary.focus();
  await page.keyboard.press("Space");
  await expect(advanced).not.toHaveAttribute("open", "");
  await expect(advancedSummary).toBeFocused();
  await expect(unknown).toBeVisible();
});

test("exam and non-exam indicators remain independent of display and density toggles", async ({
  page,
}) => {
  await sampleWeek(page);
  const exams = examSection(page);
  const other = otherSection(page);
  const factualSummary = await other.innerText();
  await exams
    .getByLabel("Preview experimental exam preparation", { exact: true })
    .check();
  await expect(other).toHaveText(factualSummary, { useInnerText: true });
  const values = exams.locator(".pressure-day .preparation-value");
  const preparationValues = await values.allTextContents();
  const ranges = await exams
    .locator(".pressure-day [role='img']")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("aria-label")),
    );
  for (const label of [
    "Show academic exams",
    "Show published events",
    "Show PSU-wide commitments",
    "Show Local commitments",
    "Show national commitments",
  ]) {
    await page.getByLabel(label, { exact: true }).uncheck();
  }
  await page.getByLabel("Show scheduling density", { exact: true }).check();
  await expect(values).toHaveText(preparationValues);
  expect(
    await exams
      .locator(".pressure-day [role='img']")
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("aria-label")),
      ),
  ).toEqual(ranges);
  await expect(other).toHaveText(factualSummary, { useInnerText: true });
  await expect(other).toHaveAttribute("data-non-exam-score", "unavailable");
  await expect(other).not.toContainText("EXAMPLE-MATH");
  await expect(other).not.toContainText("EXAMPLE-UPPER-PROCESS");
  await expect(exams).toContainText("Academic exams only");
  await expect(exams.getByText(peakCaveat, { exact: true })).toHaveCount(1);
  await exams
    .getByLabel("Preview experimental exam preparation", { exact: true })
    .uncheck();
  await expect(exams.locator("[data-preparation-range]")).toHaveCount(0);
  await expect(other).toHaveText(factualSummary, { useInnerText: true });
});

test("proposal ranges retain independent subgroup sources behind an optional methodology disclosure", async ({
  page,
}) => {
  await page.goto("/planner");
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
  await page
    .getByLabel("Biomedical Engineering (BME)", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Upperclassmen", exact: true })
    .click();
  await page.getByLabel("Start date", { exact: true }).fill("2026-10-27");
  await page.getByLabel("End date", { exact: true }).fill("2026-10-27");
  await page
    .getByRole("button", { name: "Analyze proposal", exact: true })
    .click();
  const factors = page.locator(".proposal-factors");
  const exams = factors.getByRole("region", {
    name: "Proposal Exam Preparation",
    exact: true,
  });
  const other = factors.getByRole("region", {
    name: "Other Scheduling Constraints",
    exact: true,
  });
  const nonExamBefore = await other.innerText();
  await expect(exams.locator("[data-preparation-range]")).toHaveCount(0);
  await exams
    .getByLabel("Inspect experimental proposal preparation", { exact: true })
    .check();
  await expect(
    exams.locator(".proposal-preparation-grid [data-preparation-range]"),
  ).toHaveCount(2);
  await expect(exams.getByText(peakCaveat, { exact: true })).toHaveCount(1);
  const summary = exams.getByText("Advanced methodology & sources", {
    exact: true,
  });
  const advanced = summary.locator("..");
  await expect(advanced).not.toHaveAttribute("open", "");
  await expect(exams.locator(".preparation-cell").first()).toBeHidden();
  await expect(exams.locator(".proposal-preparation-grid")).toContainText(
    "BME · Third year",
  );
  await expect(exams.locator(".proposal-preparation-grid")).toContainText(
    "CHE · Third year",
  );
  await summary.click();
  await advanced
    .getByText(/Inspect all distinct subgroup estimates/)
    .first()
    .click();
  const bme = advanced
    .locator(".preparation-cell")
    .filter({
      has: page.getByRole("heading", { name: /BME · Third year/ }),
    })
    .first();
  const che = advanced
    .locator(".preparation-cell")
    .filter({
      has: page.getByRole("heading", { name: /CHE · Third year/ }),
    })
    .first();
  await expect(bme).toBeVisible();
  await expect(che).toBeVisible();
  await expect(bme).toContainText("EXAMPLE-UPPER-BIOMEDICAL");
  await expect(bme).not.toContainText("EXAMPLE-UPPER-PROCESS");
  await expect(che).toContainText("EXAMPLE-UPPER-PROCESS");
  await expect(che).not.toContainText("EXAMPLE-UPPER-BIOMEDICAL");
  await expect(advanced).toContainText(
    "Cells are never added or population averaged",
  );
  await expect(other).toHaveText(nonExamBefore, { useInnerText: true });
  await expect(other).toHaveAttribute("data-non-exam-score", "unavailable");
});
