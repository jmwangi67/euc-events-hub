import { test, expect, type Page, type CDPSession } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Native browser zoom, not CSS zoom or pinch magnification. Each case owns its
// browser/profile so the preference cannot affect other calendar tests.
async function setZoom(settings: Page, zoom: number) {
  await settings.evaluate(
    (factor) =>
      new Promise<void>((resolve) => {
        const chrome = (
          window as unknown as {
            chrome: {
              settingsPrivate: {
                setDefaultZoom: (factor: number, callback: () => void) => void;
              };
            };
          }
        ).chrome;
        chrome.settingsPrivate.setDefaultZoom(factor, resolve);
      }),
    zoom,
  );
}
async function capture(
  page: Page,
  cdp: CDPSession,
  selector: string,
  zoom: number,
) {
  const box = await page.locator(selector).evaluate((n) => {
    const r = n.getBoundingClientRect();
    return {
      x: r.x + scrollX,
      y: r.y + scrollY,
      width: r.width,
      height: r.height,
    };
  });
  // CDP clips are in device-independent pixels; native zoom changes the ratio
  // to CSS coordinates. Locator screenshots otherwise crop the wrong region.
  return (
    await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: box.x * zoom,
        y: box.y * zoom,
        width: box.width * zoom,
        height: box.height * zoom,
        scale: 1,
      },
    })
  ).data;
}
async function paintedCircles(page: Page, png: string) {
  return page.evaluate(async (data) => {
    const image = await createImageBitmap(
      await (await fetch(`data:image/png;base64,${data}`)).blob(),
    );
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    const ink = (x: number, y: number) =>
      255 -
      Math.min(
        ...pixels.slice(
          (y * image.width + x) * 4,
          (y * image.width + x) * 4 + 3,
        ),
      );
    const groups: number[][] = [];
    let active = false;
    for (let x = 0; x < image.width; x++) {
      const dark =
        Array.from({ length: image.height }, (_, y) => ink(x, y)).reduce(
          (a, b) => a + b,
          0,
        ) > 40;
      if (dark) {
        if (!active) groups.push([]);
        groups.at(-1)!.push(x);
      }
      active = dark;
    }
    return groups.map((xs) => {
      let weight = 0,
        mx = 0,
        my = 0,
        xx = 0,
        yy = 0;
      const ys: number[] = [];
      for (const x of xs)
        for (let y = 0; y < image.height; y++) {
          const w = ink(x, y);
          if (w > 30) ys.push(y);
          weight += w;
          mx += w * x;
          my += w * y;
          xx += w * x * x;
          yy += w * y * y;
        }
      // Pixel-coverage moments detect a painted oval that equal CSS boxes miss.
      const vx = xx / weight - (mx / weight) ** 2,
        vy = yy / weight - (my / weight) ** 2;
      return {
        width: xs.length,
        height: Math.max(...ys) - Math.min(...ys) + 1,
        aspect: Math.sqrt(vx / vy),
        center: mx / weight,
      };
    });
  }, png);
}

for (const dpr of [1, 1.25, 1.5, 2])
  for (const zoom of [1, 1.25])
    test(`SVG dots remain round at DPR ${dpr}, native zoom ${zoom * 100}%`, async ({
      playwright,
    }, info) => {
      test.setTimeout(60000);
      const profile = await mkdtemp(join(tmpdir(), "euc-dot-raster-"));
      const context = await playwright.chromium.launchPersistentContext(
        profile,
        {
          baseURL: info.project.use.baseURL,
          channel: "chromium",
          headless: true,
          // Set the browser's display scale as well as page metrics; native
          // zoom/screenshots must not fall back to a 1x compositor surface.
          args: [`--force-device-scale-factor=${dpr}`],
          deviceScaleFactor: dpr,
          viewport: { width: 1440, height: 1100 },
          timezoneId: "America/Los_Angeles",
          ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
            ? {
                executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
              }
            : {}),
        },
      );
      try {
        const settings = await context.newPage();
        await settings.goto("chrome://settings/appearance");
        await setZoom(settings, zoom);
        const page = await context.newPage(),
          cdp = await context.newCDPSession(page);
        for (const width of [1280, 1440]) {
          await page.setViewportSize({ width, height: 1100 });
          await page.goto("/planner");
          await page
            .getByRole("button", { name: "Load sample scenario", exact: true })
            .click();
          expect(await page.evaluate(() => devicePixelRatio)).toBeCloseTo(
            dpr * zoom,
            3,
          );
          expect(await page.evaluate(() => innerWidth)).toBe(
            Math.round(width / zoom),
          );
          for (const date of ["2026-10-13", "2026-10-20", "2026-10-21"]) {
            const png = await capture(
              page,
              cdp,
              `[data-activity-date="${date}"] .day-activity-dots`,
              zoom,
            );
            await writeFile(
              info.outputPath(`${width}-${date}.png`),
              Buffer.from(png, "base64"),
            );
            const painted = await paintedCircles(page, png);
            expect(painted).toHaveLength(5);
            for (const [i, circle] of painted.entries()) {
              expect(
                Math.abs(circle.width - circle.height),
              ).toBeLessThanOrEqual(1);
              expect(Math.abs(circle.aspect - 1)).toBeLessThan(0.1);
              if (i)
                expect(
                  Math.abs(
                    circle.center - painted[i - 1].center - 12 * dpr * zoom,
                  ),
                ).toBeLessThan(1);
            }
          }
        }
      } finally {
        await context.close();
        await rm(profile, { recursive: true, force: true });
      }
    });
