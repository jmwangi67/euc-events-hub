import { test, expect } from "@playwright/test";
import { openPlannerChoices } from "./helpers/planner-controls";
const sample = "/?date=2026-10-19&view=listMonth";

test("calendar failure is explicit and retry restores events", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/data/calendar", async (route) => {
    if (fail)
      await route.fulfill({ status: 503, json: { error: "Unavailable" } });
    else await route.continue();
  });
  await page.goto(sample);
  await expect(page.locator('p[role="alert"]')).toContainText(
    "Unable to load calendar data",
  );
  await expect(
    page.getByText("No published events in this range", { exact: true }),
  ).toHaveCount(0);
  fail = false;
  await page
    .getByRole("button", { name: "Retry calendar data", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Open engineering studio/ }).first(),
  ).toBeVisible();
  await expect(page.locator('p[role="alert"]')).toHaveCount(0);
});

test("a delayed obsolete filter response cannot replace the latest query", async ({
  page,
}) => {
  let release!: () => void;
  let started!: () => void;
  let completed!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const began = new Promise<void>((resolve) => {
    started = resolve;
  });
  const done = new Promise<void>((resolve) => {
    completed = resolve;
  });
  await page.route("**/api/data/calendar", async (route) => {
    if (route.request().postDataJSON().filters?.search !== "obsolete")
      return route.continue();
    const response = await route.fetch();
    started();
    await gate;
    try {
      await route.fulfill({ response });
    } finally {
      completed();
    }
  });
  await page.goto(sample);
  await expect(
    page.getByRole("button", { name: /Open engineering studio/ }).first(),
  ).toBeVisible();
  const search = page.getByLabel("Search events", { exact: true });
  await search.fill("obsolete");
  await began;
  await expect(
    page.getByText("Loading calendar data…", { exact: true }),
  ).toBeVisible();
  await search.fill("Engineering welcome");
  await expect(
    page.getByRole("button", { name: /Engineering welcome/ }).first(),
  ).toBeVisible();
  release();
  await done;
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(page.locator(".fc-event")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: /Engineering welcome/ }).first(),
  ).toBeVisible();
});

test("rapid date navigation retains the final Eastern date and data", async ({
  page,
}) => {
  await page.goto("/?date=2026-10-19&view=timeGridDay");
  const date = page.getByLabel("Go to date", { exact: true });
  await date.fill("2026-10-20");
  await date.fill("2026-10-21");
  await date.fill("2026-10-19");
  await expect(date).toHaveValue("2026-10-19");
  await expect(
    page.getByRole("button", { name: /Engineering welcome/ }).first(),
  ).toBeVisible();
});

test("proposal failure never becomes a conflict-free result and can recover", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/data/planning", async (route) => {
    if (route.request().postDataJSON().kind === "proposal" && fail)
      await route.fulfill({ status: 503, json: {} });
    else await route.continue();
  });
  await page.goto("/planner");
  await page
    .getByRole("button", { name: "Load sample scenario", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Analyze proposal", exact: true })
    .click();
  await expect(page.locator('p[role="alert"]')).toContainText(
    "Unable to load proposal intelligence",
  );
  await expect(page.getByText(/No conflicts found/)).toHaveCount(0);
  fail = false;
  await page
    .getByRole("button", { name: "Retry proposal intelligence", exact: true })
    .click();
  await expect(page.locator(".conflict-panel")).toContainText(
    "Sample organization workshop",
  );
  await expect(page.locator('p[role="alert"]')).toHaveCount(0);
});

test("weekly intelligence fails independently and display changes never add analysis filters", async ({
  page,
}) => {
  let fail = true;
  const queries: Record<string, unknown>[] = [];
  await page.route("**/api/data/planning", async (route) => {
    queries.push(route.request().postDataJSON());
    if (fail) await route.fulfill({ status: 503, json: {} });
    else await route.continue();
  });
  await page.goto("/planner");
  await expect(page.locator('p[role="alert"]')).toContainText(
    "Unable to load planning intelligence",
  );
  await expect(page.locator(".weekly-summary-cell")).toHaveCount(0);
  fail = false;
  await page
    .getByRole("button", { name: "Retry planning intelligence", exact: true })
    .click();
  await expect(page.locator('p[role="alert"]')).toHaveCount(0);
  await expect(page.locator(".weekly-summary-cell").first()).toBeVisible();
  await openPlannerChoices(page);
  const summaries = await page.locator(".weekly-counts").allTextContents();
  const requestCount = queries.length;
  await page.getByLabel("Show published events", { exact: true }).uncheck();
  await page.getByLabel("Show academic exams", { exact: true }).uncheck();
  await expect(page.locator(".weekly-counts")).toHaveText(summaries);
  expect(queries).toHaveLength(requestCount);
  expect(queries.length).toBeGreaterThan(0);
  expect(
    queries.every(
      (query) => Object.keys(query).sort().join() === "kind,window",
    ),
  ).toBe(true);
});

test("public endpoints reject private dataset selection and unpublished lookup", async ({
  request,
}) => {
  const unpublished = await request.post("/api/data/event", {
    data: { id: "example-open-topic" },
  });
  expect(await unpublished.json()).toEqual({ event: null });
  const invalid = await request.post("/api/data/planning", {
    data: {
      kind: "weekly",
      window: { start: "2026-10-19", end: "2026-10-20" },
      datasetPath: "data/local/exams/private.json",
    },
  });
  expect(invalid.status()).toBe(400);
  expect(invalid.headers()["cache-control"]).toBe("no-store");
  const preview = await request.get("/planner/exam-preview");
  expect(preview.status()).toBe(404);
});
