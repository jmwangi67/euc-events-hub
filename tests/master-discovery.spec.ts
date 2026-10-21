import { test, expect, type Page } from "@playwright/test";

const socialTitle = "Example Event: Design community game night";
const gbmTitle = "Example Event: Engineering general body meeting";
const event = (page: Page, title: string) =>
  page.getByRole("button", { name: new RegExp(title) }).first();

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

for (const width of [375, 1440]) {
  test(`new discovery categories filter independently and persist at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?date=2026-10-21&view=listMonth");
    if (width < 1024)
      await page.getByRole("button", { name: /Show filters/ }).click();
    const gbm = page.getByLabel("General Body Meetings", {
      exact: true,
    });
    const social = page.getByLabel("Social & Recreational", { exact: true });
    await gbm.check();
    await expect(page.locator(".fc-event")).toHaveCount(2);
    await expect(event(page, gbmTitle)).toBeVisible();
    await expect(event(page, socialTitle)).toHaveCount(0);
    await social.check();
    await expect(page.locator(".fc-event")).toHaveCount(4);
    await expect(event(page, gbmTitle)).toBeVisible();
    await expect(event(page, socialTitle)).toBeVisible();
    await page.reload();
    if (width < 1024)
      await page.getByRole("button", { name: /Show filters/ }).click();
    await expect(gbm).toBeChecked();
    await expect(social).toBeChecked();
    await gbm.uncheck();
    await expect(page.locator(".fc-event")).toHaveCount(2);
    await expect(event(page, socialTitle)).toBeVisible();
    await expect(event(page, gbmTitle)).toHaveCount(0);
    await social.uncheck();
    await page.getByLabel("Technical Workshops", { exact: true }).check();
    await expect(event(page, "Process lab workshop")).toBeVisible();
    await expect(event(page, socialTitle)).toHaveCount(0);
    await expect(event(page, gbmTitle)).toHaveCount(0);
    await noOverflow(page);
  });
}

for (const view of [
  "dayGridMonth",
  "timeGridWeek",
  "timeGridDay",
  "listMonth",
]) {
  test(`source-backed discovery details preserve keyboard interaction in ${view}`, async ({
    page,
  }) => {
    await page.goto(`/?date=2026-10-21&view=${view}`);
    const trigger = event(page, socialTitle);
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: socialTitle, exact: true }),
    ).toBeFocused();
    expect(await dialog.evaluate((node) => node.matches(":modal"))).toBe(true);
    await expect(dialog).toContainText("Social & Recreational");
    await expect(dialog.locator(".detail-time")).toHaveText(
      "Oct 21, 2026 · 6:30–8:00 PM",
    );
    await expect(dialog).toContainText("Example Design Collective");
    await expect(dialog).toContainText("Example student activity room");
    await expect(dialog).toContainText(
      "Biomedical Engineering, Chemical Engineering, Mechanical Engineering",
    );
    await expect(dialog).toContainText(
      "First year, Second year, Third year, Fourth year, Fifth year or later",
    );
    await expect(dialog).toContainText(
      "All listed engineering majors and academic years; no membership restriction in this example.",
    );
    await expect(dialog.locator(".detail-description")).toHaveText(
      "A fictional community-building game night hosted by the Example Design Collective. The physical gathering and optional virtual welcome are demonstration details only.",
    );
    await expect(dialog).toContainText(
      "Example development fixture — not a real or verified event",
    );
    await expect(dialog).toContainText("Demo data — not verified");
    await expect(dialog).toContainText("Example record status only");
    await expect(dialog).not.toContainText(/synthetic|\bEST\b|\bEDT\b/i);
    const registration = dialog.getByRole("link", {
      name: "Registration information (opens a new tab)",
    });
    const meeting = dialog.getByRole("link", {
      name: "Open virtual meeting (new tab)",
    });
    await expect(registration).toHaveAttribute(
      "href",
      "https://example.com/events/design-game-night",
    );
    await expect(meeting).toHaveAttribute(
      "href",
      "https://example.com/meetings/design-welcome",
    );
    for (const link of [registration, meeting]) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noreferrer/);
    }
    await page.keyboard.press("Shift+Tab");
    await expect(registration).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      dialog.getByRole("button", { name: "Close event details" }),
    ).toBeFocused();
    if (view === "listMonth") {
      await page.context().route("https://example.com/**", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: "<title>Example registration destination</title><p>Fictional test destination</p>",
        }),
      );
      const popupPromise = page.waitForEvent("popup");
      await registration.click();
      const popup = await popupPromise;
      await expect(popup).toHaveURL(
        "https://example.com/events/design-game-night",
      );
      await expect(popup).toHaveTitle("Example registration destination");
      await popup.close();
      await expect(dialog).toBeVisible();
      await dialog.screenshot({ path: "work/master-student-details.png" });
    }
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Space");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await noOverflow(page);
    if (view === "dayGridMonth") {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: "work/master-student-desktop.png",
        fullPage: true,
      });
    }
  });
}

test("mobile discovery details expose source and registration without inventing missing facts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 1100 });
  await page.goto("/?date=2026-10-21&view=listMonth");
  await expect(page.locator(".timezone-label")).toHaveText(
    "All Times Eastern (ET)",
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "work/master-student-mobile.png",
    fullPage: true,
  });
  const trigger = event(page, gbmTitle);
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("General Body Meetings");
  await expect(dialog).toContainText("All engineering majors");
  await expect(dialog).toContainText("Example engineering meeting room");
  const source = dialog.getByRole("link", {
    name: /Example development fixture.*opens a new tab/,
  });
  await expect(source).toHaveAttribute(
    "href",
    "https://example.com/events/engineering-gbm/source",
  );
  await expect(source).toHaveAttribute("target", "_blank");
  await expect(source).toHaveAttribute("rel", /noreferrer/);
  await expect(dialog).not.toContainText("Academic-year audience");
  await expect(
    dialog.getByRole("link", { name: /Open virtual meeting/ }),
  ).toHaveCount(0);
  await noOverflow(page);
  await dialog.screenshot({ path: "work/master-student-details-mobile.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Space");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
