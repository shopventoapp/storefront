import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";
import { mockShop } from "../tests/fixtures/shop";

const output = resolve(process.argv[2] ?? "artifacts/screenshots");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      colorScheme: "light",
    });
    await mockShop(page);
    // Capture the starter defaults, while the smoke suite separately tests overrides.
    await page.route("**/branding/theme.css", (route) =>
      route.fulfill({ contentType: "text/css", body: "" }),
    );
    const scenes = [
      {
        name: "home",
        path: "/",
        ready: () =>
          page.getByRole("button", { name: /Herb workshop/ }).first(),
      },
      {
        name: "event",
        path: "/events?event=1",
        ready: () => page.locator(".sv-booking select").first(),
      },
      {
        name: "vouchers",
        path: "/gutscheine",
        ready: () => page.locator('a[href*="zeit-gutschein"]').first(),
      },
    ];
    for (const scene of scenes) {
      await page.goto(`${baseURL}${scene.path}`);
      await expect(scene.ready()).toBeVisible();
      await capture(scene.name);
    }
    await page.goto(`${baseURL}/shop/produkte/kraeuter-set`);
    await page
      .getByRole("button", { name: /Add to (cart|basket)/i })
      .first()
      .click();
    await page.goto(`${baseURL}/warenkorb`);
    await expect(page.getByText("Herb kit").first()).toBeVisible();
    await capture("cart");
    await page.close();

    async function capture(name: string) {
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      if (overflow)
        throw new Error(`Horizontal overflow: ${name} at ${width}px`);
      const path = resolve(output, `${name}-${width}-light.png`);
      await page.screenshot({ path, fullPage: true, animations: "disabled" });
      console.info(path);
    }
  }
} finally {
  await browser.close();
}
