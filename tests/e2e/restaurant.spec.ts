import { expect, test } from "@playwright/test";
import type { Restaurant } from "../../src/lib/restaurant";
import { mockShop } from "../fixtures/shop";

test.skip(
  process.env.STOREFRONT_MULTI_TENANT !== "true",
  "German restaurant pages",
);
const restaurant: Restaurant = {
  company: {
    name: "Beispielküche",
    city: "Hannover",
    website_url: "https://example.com",
  },
  modules: { events: true, vouchers: true },
  locations: [
    {
      id: 1,
      location_name: "Beispielküche",
      location_street: "Marktstraße 12",
      location_postal_code: "30159",
      location_city: "Hannover",
      location_phone: "+49 511 123456",
      table_reservations_enabled: true,
      opening_intervals: [
        { weekday: 4, opens: "12:00", closes: "14:30" },
        { weekday: 4, opens: "17:30", closes: "01:00" },
      ],
      opening_exceptions: [
        { from: "2026-12-24", until: "2026-12-26", label: "Weihnachten" },
        {
          from: "2026-12-31",
          until: "2026-12-31",
          opens: "18:00",
          closes: "02:00",
        },
      ],
    },
    {
      id: 2,
      location_name: "Gartenküche",
      location_street: "Gartenweg 2",
      location_city: "Hannover",
      table_reservations_enabled: false,
      opening_intervals: null,
      opening_exceptions: [],
    },
  ],
  menu: {
    total_items: 2,
    sections: [
      {
        id: "food",
        title: "Speisen",
        items: [
          {
            token: "pasta",
            name: "Kürbis-Pasta",
            beschreibung_md: "Mit Salbei und gerösteten Kernen.",
            allergene: "Gluten, Milch",
            zusatzstoffe: "Konservierungsstoff",
            prices: [
              { label: "Klein", preis: 9.9 },
              { label: "Groß", preis: 14.5 },
            ],
          },
        ],
        subsections: [],
      },
      {
        id: "drinks",
        title: "Getränke",
        items: [],
        subsections: [
          {
            id: "wine",
            title: "Weißwein",
            items: [
              {
                token: "wine",
                name: "Riesling",
                prices: [{ label: "Glas 0,2 l", preis: 6.5 }],
              },
            ],
          },
        ],
      },
    ],
  },
};
for (const width of [390, 1280])
  for (const colorScheme of ["light", "dark"] as const) {
    test(`restaurant pages ${width} ${colorScheme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.clock.setFixedTime(new Date("2026-11-13T12:00:00Z"));
      await mockShop(page);
      await page.route("**/api/shop/restaurant", (route) =>
        route.fulfill({ json: restaurant }),
      );
      await page.goto("/");
      await expect(page.locator(".welcome")).toContainText(
        "Beispielküche in Hannover",
      );
      await expect(page.locator(".today-hours")).toHaveText(
        "Heute: 12:00 - 14:30 Uhr · 17:30 - 24:00 Uhr",
      );
      await expect(
        page
          .locator(".welcome")
          .getByRole("link", { name: "Gutschein verschenken" }),
      ).toBeVisible();
      const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
      await expect(
        nav.getByRole("link", { name: "Speisekarte" }),
      ).toBeVisible();
      await expect(nav.getByRole("link", { name: "Standorte" })).toBeVisible();
      for (const [path, title] of [
        ["/", "home"],
        ["/speisekarte", "menu"],
        ["/standorte", "locations"],
      ] as const) {
        await page.goto(path);
        await expect(page.locator(".platform-nav")).toHaveAttribute(
          "data-ready",
          "true",
        );
        if (title === "menu") {
          await expect(page).toHaveTitle(/Speisekarte/);
          await expect(
            page.getByRole("heading", { name: "Kürbis-Pasta" }),
          ).toBeVisible();
          await expect(
            page.getByText("Allergene: Gluten, Milch"),
          ).toBeVisible();
          await expect(
            page.getByText("Zusatzstoffe: Konservierungsstoff"),
          ).toBeVisible();
          await expect(page.getByText("Klein 9,90 €")).toBeVisible();
          await expect(
            page.getByRole("heading", { name: "Riesling" }),
          ).toBeVisible();
        }
        if (title === "locations") {
          await expect(page).toHaveTitle(/Standorte/);
          await expect(
            page.getByRole("heading", { name: "Gartenküche" }),
          ).toBeVisible();
          await expect(
            page.getByText("17:30 - 01:00 Uhr (Folgetag)"),
          ).toBeVisible();
          await expect(
            page.getByText("Geschlossen · Weihnachten"),
          ).toBeVisible();
          await expect(
            page.getByText("Öffnungszeiten auf Anfrage", { exact: false }),
          ).toBeVisible();
          await expect(
            page.getByRole("link", { name: "Anfahrt planen" }).first(),
          ).toHaveAttribute("href", /Marktstra%C3%9Fe/);
          await expect(
            page.getByRole("link", { name: "+49 511 123456" }),
          ).toHaveAttribute("href", "tel:+49511123456");
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`${title}-${width}-${colorScheme}.png`),
          fullPage: true,
          animations: "disabled",
        });
      }
    });
  }
test("empty content and disabled modules hide navigation, homepage actions and footer entries", async ({
  page,
}) => {
  await mockShop(page);
  await page.route("**/api/shop/restaurant", (route) =>
    route.fulfill({
      json: {
        ...restaurant,
        modules: { events: false, vouchers: false },
        locations: [],
        menu: { total_items: 0, sections: [] },
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".platform-nav")).toHaveAttribute(
    "data-ready",
    "true",
  );
  for (const name of [
    "Speisekarte",
    "Standorte",
    "Veranstaltungen",
    "Gutscheine",
    "Tisch reservieren",
  ])
    await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
  await page.goto("/speisekarte");
  await expect(
    page.getByText("Aktuell ist keine Speisekarte veröffentlicht."),
  ).toBeVisible();
  await page.goto("/standorte");
  await expect(
    page.getByText("Aktuell sind keine Standortangaben veröffentlicht."),
  ).toBeVisible();
});
test("restaurant outage offers retry without rendering stale data or unsafe menu HTML", async ({
  page,
}) => {
  await mockShop(page);
  let available = false;
  await page.route("**/api/shop/restaurant", (route) =>
    route.fulfill({
      status: available ? 200 : 503,
      json: available
        ? {
            ...restaurant,
            menu: {
              total_items: 1,
              sections: [
                {
                  id: "x",
                  title: "Speisen",
                  items: [
                    {
                      token: "x",
                      name: "Test",
                      beschreibung_md: "<img src=x onerror=alert(1)>",
                      prices: [{ preis: 1 }],
                    },
                  ],
                },
              ],
            },
          }
        : { detail: "Unavailable" },
    }),
  );
  await page.goto("/speisekarte");
  await expect(
    page.getByText("Diese Angaben sind gerade nicht verfügbar."),
  ).toBeVisible();
  available = true;
  await page.getByRole("button", { name: "Erneut laden" }).click();
  await expect(
    page.getByText("<img src=x onerror=alert(1)>", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".menu-group img")).toHaveCount(0);
});
