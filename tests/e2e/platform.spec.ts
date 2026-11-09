import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import {
  branding,
  catalogue,
  event,
  mockShop,
  timewindow,
} from "../fixtures/shop";

test.skip(
  process.env.STOREFRONT_MULTI_TENANT !== "true",
  "German platform suite",
);

for (const width of [390, 1440]) {
  for (const colorScheme of ["light", "dark"] as const) {
    for (const shop of [false, true]) {
      for (const location of [false, true]) {
        test(`platform ${width} ${colorScheme} shop=${shop} location=${location}`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.emulateMedia({ colorScheme });
          await mockShop(page);
          await page.route("**/branding/theme.css", (route) =>
            route.fulfill({ contentType: "text/css", body: "" }),
          );
          await page.route("**/api/shop/branding", (route) =>
            route.fulfill({
              json: {
                ...branding,
                brand_name: "Beispielküche",
                navigation: [{ label: "Shop", href: "/shop" }],
              },
            }),
          );
          await page.route("**/api/shop/legal", (route) =>
            route.fulfill({
              json: {
                imprint_url: "https://example.com/impressum",
                privacy_url: "https://example.com/datenschutz",
                terms_url: "https://example.com/agb",
                withdrawal_url: "https://example.com/widerruf",
              },
            }),
          );
          await page.route("**/api/shop/articles/catalogue", (route) =>
            route.fulfill({
              json: {
                ...catalogue,
                articles: shop ? catalogue.articles : [],
                total: shop ? 1 : 0,
              },
            }),
          );
          await page.route(
            (url) => url.pathname.replace(/\/$/, "") === "/api/shop/tastings",
            (route) =>
              route.fulfill({
                json: [
                  {
                    ...event,
                    tasting_name: "Gemeinsamer Abend",
                    full_name: "Gemeinsamer Abend",
                  },
                ],
              }),
          );
          await page.route("**/api/shop/tastings/timewindows**", (route) =>
            route.fulfill({
              json: {
                timewindows: [
                  { ...timewindow, event_name: "Gemeinsamer Abend" },
                ],
                total: 1,
              },
            }),
          );
          await page.route("**/api/shop/tastings/locations", (route) =>
            route.fulfill({
              json: {
                locations: location
                  ? [
                      {
                        id: 1,
                        location_name: "Beispielküche",
                        table_reservations_enabled: location,
                        ...(location
                          ? {
                              location_street: "Beispielstraße 1",
                              location_postal_code: "12345",
                              location_city: "Beispielstadt",
                            }
                          : {}),
                      },
                    ]
                  : [],
                total: location ? 1 : 0,
              },
            }),
          );
          await page.goto("/");
          await expect(page.locator("html")).toHaveAttribute("lang", "de");
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            "Beispielküche",
          );
          await expect(page).toHaveTitle(/Willkommen bei uns.*Beispielküche/);
          await expect(
            page.locator('meta[property="og:locale"]').first(),
          ).toHaveAttribute("content", "de_DE");
          await expect(
            page.getByRole("heading", { name: "Kommende Veranstaltungen" }),
          ).toBeVisible();
          if (location) {
            await expect(
              page.getByRole("button", { name: /Gemeinsamer Abend/ }).first(),
            ).toBeVisible();
          } else {
            await expect(
              page.getByText(
                "Aktuell gibt es keine kommenden Veranstaltungen.",
              ),
            ).toBeVisible();
          }
          await expect(
            page.getByRole("heading", { name: "Gutscheine verschenken" }),
          ).toBeVisible();
          await expect(
            page
              .getByRole("navigation", { name: "Hauptnavigation" })
              .getByRole("link", { name: "Shop", exact: true }),
          ).toHaveCount(shop ? 1 : 0);
          await expect(page.getByTestId("home-shop")).toHaveCount(shop ? 1 : 0);
          await expect(
            page.getByRole("heading", { name: "Hier findest Du uns" }),
          ).toHaveCount(location ? 1 : 0);
          await expect(
            page
              .locator(".welcome")
              .getByRole("link", { name: "Tisch reservieren" }),
          ).toHaveCount(location ? 1 : 0);
          await expect(
            page.getByRole("link", { name: "Impressum", exact: true }),
          ).toHaveAttribute("href", "https://example.com/impressum");
          await expect(page.locator("body")).not.toContainText(
            /Nebenan|atelier|Good times|Coming up|Fictional demo/i,
          );
          await page.evaluate(() => document.fonts.ready);
          for (const button of await page.locator("main .button").all()) {
            const colors = await button.evaluate((element) => {
              const style = getComputedStyle(element);
              return { text: style.color, background: style.backgroundColor };
            });
            expect(colors.text).not.toBe(colors.background);
          }
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
          ).toBe(true);
          const output = resolve("artifacts/screenshots/platform");
          await mkdir(output, { recursive: true });
          await writeFile(
            resolve(
              output,
              `home-${width}-${colorScheme}-shop-${shop}-location-${location}.txt`,
            ),
            // biome-ignore lint/performance/useDomNodeTextContent: Record rendered guest copy for editorial review.
            await page.locator("body").innerText(),
          );
          await page.screenshot({
            path: resolve(
              output,
              `home-${width}-${colorScheme}-shop-${shop}-location-${location}.png`,
            ),
            fullPage: true,
            animations: "disabled",
          });
        });
      }
    }
  }
}

test("platform safely handles failed discovery and missing branding", async ({
  page,
}) => {
  await mockShop(page);
  for (const path of ["branding", "articles/catalogue", "tastings/locations"]) {
    await page.route(`**/api/shop/${path}`, (route) =>
      route.fulfill({ status: 503, json: { detail: "Unavailable" } }),
    );
  }
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Willkommen bei uns",
  );
  await expect(page.getByTestId("home-shop")).toHaveCount(0);
  await expect(
    page.locator(".welcome").getByRole("link", { name: "Tisch reservieren" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Termine neu laden" }),
  ).toBeVisible();
});
