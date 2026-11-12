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
test.afterEach(async ({ context }) => {
  await context.unrouteAll({ behavior: "wait" });
});
test.beforeEach(async ({ context }) => {
  await context.route(`${origin}/**`, async (route) => {
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
      await frame.getByRole("button", { name: /Herb workshop/ }).click();
      await expect(frame.locator("form.sv-booking")).toBeVisible();
      expect(
        await page
          .frames()[1]
          .evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      await expect(
        frame.getByText("Die Zahlung öffnet sich in einem neuen Fenster."),
      ).toBeVisible();
      await expect(frame.locator("header")).toHaveCount(0);
      await expect(frame.locator("footer")).toHaveCount(0);
      await expect(frame.locator(".embed-booking")).toBeVisible();
      if (process.env.WIDGET_EVIDENCE_DIR) {
        await mkdir(process.env.WIDGET_EVIDENCE_DIR, { recursive: true });
        await page.frames()[1].evaluate(() => window.scrollTo(0, 0));
        await page.locator("iframe").evaluate(
          (element, height) => {
            element.style.height = `${height}px`;
          },
          await page
            .frames()[1]
            .evaluate(() => document.documentElement.scrollHeight),
        );
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
    test(`table embed ${width} ${colorScheme}`, async ({ page, context }) => {
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
      const url = `${origin}/embed/booking?location=1&service=both&lang=de`;
      await page.route("https://restaurant.example/**", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<html><body style="margin:0"><iframe title="Buchung" src="${url}" style="border:0;width:100%;height:950px"></iframe></body></html>`,
        }),
      );
      await page.goto("https://restaurant.example/");
      const form = page.frameLocator("iframe").locator("form.sv-reservation");
      for (const name of ["AGB", "Datenschutzerklärung"]) {
        await expect(
          form.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("target", "_blank");
        await expect(
          form.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("rel", "noopener");
      }
      await expect(form).toBeVisible();
      await form.locator('[name="date"]').fill("20.11.2026");
      await form.locator('[name="time"]').fill("18:30");
      await expect(form.locator('[name="time"]')).not.toHaveAttribute(
        "aria-invalid",
        "true",
      );
      for (const [name, path] of [
        ["AGB", "/agb/"],
        ["Datenschutzerklärung", "/datenschutz/"],
      ]) {
        const popupPromise = context.waitForEvent("page");
        await form.getByRole("link", { name, exact: true }).click();
        const popup = await popupPromise;
        await popup.waitForLoadState();
        expect(new URL(popup.url()).pathname.replace(/\/$/, "")).toBe(
          path.replace(/\/$/, ""),
        );
        expect(popup.mainFrame().parentFrame()).toBeNull();
        expect(page.frames()[1].url()).toBe(url);
        await expect(form.locator('[name="time"]')).toHaveValue("18:30");
        await popup.close();
      }
      expect(
        await page
          .frames()[1]
          .evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      if (process.env.WIDGET_EVIDENCE_DIR) {
        await page.frames()[1].evaluate(() => window.scrollTo(0, 0));
        await page.locator("iframe").evaluate(
          (element, height) => {
            element.style.height = `${height}px`;
          },
          await page
            .frames()[1]
            .evaluate(() => document.documentElement.scrollHeight),
        );
        await page.screenshot({
          path: join(
            process.env.WIDGET_EVIDENCE_DIR,
            `embed-table-${width}-${colorScheme}.png`,
          ),
          fullPage: true,
        });
      }
    });
  }

for (const width of [390, 1280])
  for (const colorScheme of ["light", "dark"] as const)
    test(`paid tasting ${width} ${colorScheme} leaves frame and returns top-level`, async ({
      page,
      context,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme });
      await mockShop(page);
      await page.route("https://challenges.cloudflare.com/**", (route) =>
        route.fulfill({
          contentType: "application/javascript",
          body: "window.turnstile = { render: (element, options) => { queueMicrotask(() => options.callback('synthetic-token')); return 'synthetic-widget'; }, remove: () => {}, reset: () => {} };",
        }),
      );
      let submitted = false;
      await page.route("**/api/shop/**", async (route) => {
        if (route.request().method() !== "POST") return route.fallback();
        submitted = true;
        expect(route.request().headers().cookie).toBeUndefined();
        expect(route.request().postDataJSON().terms_privacy_accepted).toBe(
          true,
        );
        await route.fulfill({
          json: {
            success: true,
            order_number: "EMBED-TEST",
            checkout_url: "https://checkout.stripe.com/c/pay/test_embed",
          },
        });
      });
      await context.route("https://checkout.stripe.com/**", (route) => {
        return route.fulfill({
          contentType: "text/html",
          body: `<a href="${origin}/buchung?outcome=success">Return to booking</a>`,
          headers: { "X-Frame-Options": "DENY" },
        });
      });
      await context.route(`${origin}/buchung**`, async (route) => {
        const response = await route.fetch({ url: `${localOrigin}/buchung` });
        await route.fulfill({ response });
      });
      const url = `${origin}/embed/booking?location=1&service=tasting`;
      await page.route("https://restaurant.example/**", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<iframe src="${url}"></iframe>`,
        }),
      );
      await page.goto("https://restaurant.example/");
      const frame = page.frameLocator("iframe");
      await frame.getByRole("button", { name: /Herb workshop/ }).click();
      const form = frame.locator("form.sv-booking");
      await expect(form).toBeVisible();
      await form.getByRole("combobox").first().selectOption("workshop-slot");
      await form.getByLabel("Vorname", { exact: true }).fill("Test");
      await form.getByLabel("Nachname", { exact: true }).fill("Guest");
      await form
        .getByLabel("E-Mail-Adresse", { exact: true })
        .fill("test@example.com");
      await form.getByRole("checkbox").check();
      const popupBlocked = width === 1280 && colorScheme === "dark";
      if (popupBlocked)
        await page.frames()[1].evaluate(() => {
          window.open = () => null;
        });
      const popupPromise = context.waitForEvent("page");
      await form
        .getByRole("button", { name: /zahlungspflichtig|buchen/i })
        .last()
        .click();
      if (popupBlocked)
        await frame
          .getByRole("link", { name: "Weiter zur Zahlung", exact: true })
          .click();
      const popup = await popupPromise;
      await expect(popup).toHaveURL(
        "https://checkout.stripe.com/c/pay/test_embed",
      );
      expect(popup.mainFrame().parentFrame()).toBeNull();
      expect(submitted).toBe(true);
      expect(page.frames()[1].url()).toBe(url);
      await popup.getByRole("link", { name: "Return to booking" }).click();
      await expect(
        popup.getByRole("heading", { name: "Deine Buchung", exact: true }),
      ).toBeVisible();
      expect(popup.mainFrame().parentFrame()).toBeNull();
    });

test("embed explains unavailable online payments", async ({ page }) => {
  await mockShop(page);
  await page.route("**/api/shop/payments/status", (route) =>
    route.fulfill({ json: { online_payments_enabled: false } }),
  );
  await page.goto(`${origin}/embed/booking?location=1&service=tasting`);
  await expect(
    page.getByText(
      "Kartenzahlung ist bald verfügbar. Du kannst weiterhin Gutscheine einlösen.",
    ),
  ).toBeVisible();
});
