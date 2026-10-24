import type { Page } from "@playwright/test";
/** Open actual disclosures before exercising controls relocated from the sidebar. */
export async function openPlannerChoices(page: Page) {
  const panel = page.locator(".planner-controls");
  if (!(await panel.getAttribute("open"))) {
    // An open boolean attribute serializes as an empty string.
    if (!(await panel.evaluate((node) => (node as HTMLDetailsElement).open)))
      await panel.locator(":scope > summary").click();
  }
  for (const dropdown of await panel.locator(".selection-dropdown").all()) {
    if (!(await dropdown.evaluate((node) => (node as HTMLDetailsElement).open)))
      await dropdown.locator(":scope > summary").click();
  }
}
