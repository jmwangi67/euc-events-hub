import { test, expect } from "@playwright/test";
test("production never serves the private review even when preview flags are supplied", async ({
  page,
  request,
}) => {
  const response = await request.get("/planner/exam-preview");
  expect((await request.get("/dev/calendar-layout")).status()).toBe(404);
  expect((await request.get("/dev/icons")).status()).toBe(404);
  expect(response.status()).toBe(404);
  expect(await response.text()).not.toContain("invented-review-dataset");
  await page.goto("/planner");
  await expect(
    page.getByRole("link", { name: "Open private academic dataset review" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Private exam data preview — unverified", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Find a time for your audience" }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator("body")).not.toContainText("DEMO-LAB-A");
});
