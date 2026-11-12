import { type ChildProcess, spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { mockShop, timewindow } from "../fixtures/shop";

let server: ChildProcess;
let localOrigin: string;
const origin = "https://storefront.example";
test.beforeAll(async () => {
  server = spawn("bun", ["tests/fixtures/embed-server.ts"], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  localOrigin = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error("Embed fixture did not start; run bun run build first"),
        ),
      15000,
    );
    server.stdout?.on("data", (chunk) => {
      const match = String(chunk).match(/EMBED_ORIGIN=(\S+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    server.on("error", reject);
  });
});
test.afterAll(() => server?.kill());
test.beforeEach(async ({ page }) => {
  await page.route(`${origin}/**`, async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: `${localOrigin}${url.pathname}${url.search}`,
    });
    await route.fulfill({ response });
  });
});

for (const width of [390, 1280])
  for (const colorScheme of ["light", "dark"] as const) {
    test(`embed booking ${width} ${colorScheme}: allowed frame and link`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme });
      await mockShop(page);
      await page.clock.setFixedTime(new Date("2026-11-10T12:00:00Z"));
      await page.route("**/api/shop/tastings/timewindows**", (route) =>
        route.fulfill({
          json: {
            timewindows: [{ ...timewindow, date: "2026-11-20" }],
            total: 1,
          },
        }),
      );
      const url = `${origin}/embed/booking?location=1&service=tasting&lang=de`;
      await page.route("https://restaurant.example/**", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<html><body style="margin:0"><iframe title="Buchung" src="${url}" style="border:0;width:100%;height:950px"></iframe></body></html>`,
        }),
      );
      await page.goto("https://restaurant.example/");
      const frame = page.frameLocator("iframe");
      await expect(
        frame.getByRole("heading", { name: "Veranstaltung buchen" }),
      ).toBeVisible();
      await frame
        .getByLabel("Veranstaltung", { exact: true })
        .selectOption("1");
      await expect(frame.locator("header")).toHaveCount(0);
      await expect(frame.locator("footer")).toHaveCount(0);
      await expect(frame.locator(".embed-booking")).toBeVisible();
      if (process.env.WIDGET_EVIDENCE_DIR) {
        await mkdir(process.env.WIDGET_EVIDENCE_DIR, { recursive: true });
        await page.screenshot({
          path: join(
            process.env.WIDGET_EVIDENCE_DIR,
            `embed-${width}-${colorScheme}.png`,
          ),
          fullPage: true,
        });
      }
      const response = await page.goto(url);
      expect(response?.headers()["content-security-policy"]).toBe(
        "frame-ancestors https://storefront.example https://restaurant.example",
      );
      expect(response?.headers()["x-frame-options"]).toBeUndefined();
      await expect(
        page.getByRole("heading", { name: "Veranstaltung buchen" }),
      ).toBeVisible();
      await expect(page.locator("header")).toHaveCount(0);
    });
  }

test("disallowed parent is blocked by browser CSP", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.route("https://disallowed.example/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<iframe src="${origin}/embed/booking?location=1&service=tasting"></iframe>`,
    }),
  );
  await page.goto("https://disallowed.example/");
  await expect.poll(() => errors.join(" ")).toMatch(/frame-ancestors/);
  await expect(
    page
      .frameLocator("iframe")
      .getByRole("heading", { name: "Veranstaltung buchen" }),
  ).toHaveCount(0);
});

test("unknown location and service stay calm, other routes deny frames, internal policy is inaccessible", async ({
  page,
  request,
}) => {
  await mockShop(page);
  for (const query of [
    "location=999&service=both",
    "location=1&service=invalid",
    "location=1&service=table",
    "location=1&lang=en",
    "location=-1",
  ]) {
    await page.goto(`${origin}/embed/booking?${query}`);
    await expect(
      page.getByRole("heading", { name: "Aktuell keine Buchung möglich" }),
    ).toBeVisible();
  }
  const other = await request.get(`${localOrigin}/events`);
  expect(other.headers()["x-frame-options"]).toBe("DENY");
  expect(
    (await request.get(`${localOrigin}/api/edge/embed-policy`)).status(),
  ).toBe(404);
});

for (const width of [390, 1280])
  for (const colorScheme of ["light", "dark"] as const) {
    test(`table embed ${width} ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme });
      await page.clock.setFixedTime(new Date("2026-11-10T12:00:00Z"));
      await mockShop(page);
      await page.route("**/api/shop/tastings/locations", (route) =>
        route.fulfill({
          json: {
            locations: [
              {
                id: 1,
                location_name: "Testatelier",
                table_reservations_enabled: true,
              },
            ],
            total: 1,
          },
        }),
      );
      await page.route(
        "**/api/table-reservations/public/settings?location_id=1",
        (route) =>
          route.fulfill({
            json: {
              ready: true,
              turnstile_site_key: "1x00000000000000000000AA",
              online_party_min: 2,
              online_party_max: 8,
              opening_hours: [{ weekday: 4, opens: "12:00", closes: "23:00" }],
              opening_exceptions: [],
            },
          }),
      );
      await page.goto(
        `${origin}/embed/booking?location=1&service=both&lang=de`,
      );
      const form = page.locator("form.sv-reservation");
      await expect(form).toBeVisible();
      await form.locator('[name="date"]').fill("20.11.2026");
      await form.locator('[name="time"]').fill("18:30");
      await expect(form.locator('[name="time"]')).not.toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (process.env.WIDGET_EVIDENCE_DIR)
        await page.screenshot({
          path: join(
            process.env.WIDGET_EVIDENCE_DIR,
            `embed-table-${width}-${colorScheme}.png`,
          ),
          fullPage: true,
        });
    });
  }
