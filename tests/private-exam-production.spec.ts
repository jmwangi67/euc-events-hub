import { test, expect } from "@playwright/test";
test("production never serves the private review even when preview flags are supplied", async ({
  page,
  request,
}) => {
  const response = await request.get("/planner/exam-preview");
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
    page.getByRole("button", { name: "Load sample scenario", exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator("body")).not.toContainText("DEMO-LAB-A");
});
