import { expect, test } from "@playwright/test";
import {
  branding,
  mockAccount,
  mockAccountActivity,
  mockShop,
} from "../fixtures/shop";

test.skip(
  process.env.STOREFRONT_MULTI_TENANT === "true",
  "English single-installation suite",
);

const demoGreeting =
  /^(?:Hello|Good morning|Good afternoon|Good evening), Demo\.$/;

test.beforeEach(async ({ page }) => {
  await mockShop(page);
});

test("home loads upcoming events from the API", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Good times.New discoveries.",
  );
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toContainText("Experiences");
  await expect(page.getByText("€49.00").first()).toBeVisible();
  await expect(
    page.locator('meta[property="og:locale"]').first(),
  ).toHaveAttribute("content", "en_GB");
  await expect(page.getByText("Herb workshop").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Herb workshop/ }).first(),
  ).toBeVisible();
});

test("event booking starts in the package form", async ({ page }) => {
  await page.goto("/events?event=1");
  await expect(page.locator(".sv-booking")).toBeVisible();
  await expect(page.getByText("Herb workshop").first()).toBeVisible();
  await expect(page.locator(".sv-booking select").first()).toBeVisible();
});

test("inactive card payments show availability without blocking voucher browsing or free reservations", async ({
  page,
}) => {
  await page.route("**/api/shop/payments/status", (route) =>
    route.fulfill({
      json: {
        online_payments_enabled: false,
        checkout_label: "Bald verfügbar",
      },
    }),
  );
  for (const path of ["/shop", "/events?event=1"]) {
    await page.goto(path);
    await expect(
      page.getByText("Bald verfügbar", { exact: true }),
    ).toBeVisible();
  }
  await page.goto("/gutscheine");
  await expect(page.locator('a[href*="zeit-gutschein"]').first()).toBeVisible();
  await page.goto("/reservierung");
  await expect(page.getByRole("button", { name: "Reserve now" })).toBeEnabled();
});

test("vouchers use the package catalogue", async ({ page }) => {
  await page.goto("/gutscheine");
  await expect(page.getByText("Give time together").first()).toBeVisible();
  await expect(page.locator('a[href*="zeit-gutschein"]').first()).toBeVisible();
});

test("signed-in guests start the package account booking mode", async ({
  page,
}) => {
  await mockAccount(page);
  await page.goto("/events?event=1");
  await expect(page.locator(".sv-booking select").first()).toBeVisible();
  await expect(page.locator('.sv-booking input[type="email"]')).toHaveCount(0);
});

test("product, cart and checkout stay in the package flow", async ({
  page,
}) => {
  await page.goto("/shop");
  await page.locator('a[href*="/shop/produkte/kraeuter-set"]').first().click();
  await expect(
    page.getByRole("heading", { name: "Herb kit", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Add to (cart|basket)/i })
    .first()
    .click();
  await page.goto("/warenkorb");
  await expect(page.getByText("Herb kit").first()).toBeVisible();
  await page
    .getByRole("button", { name: /Checkout/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/kasse\/?$/);
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page.getByLabel(/E-?mail/i).first()).toBeVisible();
});

// The package supplies English authentication and booking copy.
test("customer account opens the package login", async ({ page }) => {
  await page.goto("/konto");
  await expect(page.getByLabel(/E-?mail/i).first()).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Sign in/i }).first(),
  ).toBeVisible();
});

test("instance branding overrides the starter at runtime", async ({ page }) => {
  await page.route("**/api/shop/branding", (route) =>
    route.fulfill({ json: { ...branding, brand_name: "Room for ideas" } }),
  );
  await page.goto("/");
  await expect(page.getByText("Room for ideas").first()).toBeVisible();
  await expect(page).toHaveTitle(/Room for ideas/);
  await expect(
    page.locator('head link[rel="canonical"]').first(),
  ).toHaveAttribute("href", "http://localhost:3100/");
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--sv-primary")
          .trim(),
      ),
    )
    .toBe("#315a51");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(237, 244, 240)",
  );
  await expect(page.locator("body")).toHaveCSS("color", "rgb(33, 55, 45)");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS(
    "font-family",
    /Source Sans 3/,
  );
});

test("account registration and password recovery use package forms", async ({
  page,
}) => {
  await page.goto("/konto/registrieren");
  await expect(page.getByLabel(/First name/i)).toBeVisible();
  await expect(page.getByLabel(/Last name/i)).toBeVisible();
  await page.goto("/konto/passwort-vergessen");
  await expect(page.getByLabel(/E-?mail/i).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Send link|Password/i }).first(),
  ).toBeVisible();
});

test("email confirmation keeps one-time capabilities out of the address bar", async ({
  page,
}) => {
  await page.goto(
    "/konto/email-bestaetigen?token=first-test-capability&token=second-test-capability&from=mail",
  );
  await expect(page).toHaveURL(/\/konto\/email-bestaetigen\?from=mail$/);
  await expect(
    page.getByRole("button", { name: /Confirm/i }).first(),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("first-test-capability");
});

test("an unauthenticated account deep link opens sign-in", async ({ page }) => {
  await page.goto("/konto/gutscheine");
  await expect(page.getByLabel(/E-?mail/i).first()).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("authenticated account uses package details and valid contact navigation", async ({
  page,
}) => {
  await mockAccount(page);
  await page.goto("/konto");
  await expect(page.getByRole("heading", { name: demoGreeting })).toBeVisible();
  await expect(page.locator('a[href="tel:"]:visible')).toHaveCount(0);
  await expect(page.locator('a[href="mailto:"]:visible')).toHaveCount(0);
  await page.goto("/konto/buchungen/o-order-demo");
  await expect(page.getByText("DEMO-1").first()).toBeVisible();
  await page.goto("/konto/buchungen/t-booking-demo");
  await expect(page.getByText("Herb workshop").first()).toBeVisible();
});

test("newsletter, reservation and legal copy are English", async ({ page }) => {
  await page.goto("/newsletter");
  await expect(
    page.getByRole("heading", { name: "News from the atelier" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Subscribe to the newsletter" }),
  ).toBeVisible();
  await page.goto("/reservierung");
  await expect(page.getByLabel("Name *", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reserve now" })).toBeVisible();
  await page.goto("/impressum");
  await expect(
    page.getByRole("heading", { name: "Legal notice" }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo placeholder", { exact: true }),
  ).toBeVisible();
});

test("empty cart uses the English package catalogue", async ({ page }) => {
  await page.goto("/warenkorb");
  await expect(
    page.getByText("Your cart is empty.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Browse the shop", exact: true }).first(),
  ).toBeVisible();
});

test("event loading errors use English host copy", async ({ page }) => {
  await page.route(
    (url) => url.pathname.replace(/\/$/, "") === "/api/shop/tastings",
    (route) => route.fulfill({ status: 503, json: {} }),
  );
  await page.goto("/events");
  await expect(
    page.getByText("Dates are currently unavailable. Please try again."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reload dates" }),
  ).toBeVisible();
});

test("reservation details render read-only without host policy", async ({
  page,
}) => {
  await mockAccount(page);
  await page.route("**/api/shop/table-reservations/22", (route) => {
    expect(route.request().method()).toBe("GET");
    return route.fulfill({
      json: {
        id: 22,
        date: "2099-10-20",
        time: "19:00",
        num_guests: 2,
        notes: "Near the window",
        status: "confirmed",
        location_name: "Demo studio",
        franchise_location_id: 1,
        created_at: "2026-10-01",
        updated_at: "2026-10-01",
      },
    });
  });
  await page.goto("/konto/buchungen/r-22");
  await expect(page.getByText("Near the window")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ändern", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reservierung stornieren", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('a[href="tel:"], a[href="mailto:"]')).toHaveCount(
    0,
  );
});

test("account contact falls back to loaded public company data", async ({
  page,
}) => {
  await mockAccount(page);
  await page.route("**/api/shop/branding", (route) =>
    route.fulfill({
      json: {
        ...branding,
        company: { phone: "+49123456789", email: "hello@example.com" },
      },
    }),
  );
  await page.goto("/konto");
  await expect(
    page.locator('a[href="tel:+49123456789"]').first(),
  ).toBeVisible();
  await expect(
    page.locator('a[href="mailto:hello@example.com"]').first(),
  ).toBeVisible();
});

test("account keeps help and an ordinary branding contact link", async ({
  page,
}) => {
  await mockAccount(page);
  await page.route("**/api/shop/branding", (route) =>
    route.fulfill({
      json: {
        ...branding,
        contact_url: "https://example.com/contact",
        company: {},
      },
    }),
  );
  await page.goto("/konto");
  await expect(page.getByRole("heading", { name: demoGreeting })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Help & contact", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Help & contact", exact: true }),
  ).toHaveAttribute("href", "https://example.com/contact");
});

const germanCopy =
  /\b(?:Abgeholt|Personen|Bitte|Deine|Deinen|Deiner|Dein|Buchungsnummer|Gutscheincode|Gutscheine|Anmelden|Abmelden|Passwort|Vorname|Nachname|Plätze|Uhrzeit|Bestellungen|Widerruf|Schließen|Datenschutzerklärung|Buchungsfrist|Ausgebucht|Bestätigt|Abholung|Warenkorb)\b/i;
for (const width of [1280, 390]) {
  test(`package flows contain English copy at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const scenes = [
      ["booking", "/events?event=1", ".sv-booking select"],
      ["shop", "/shop", ".sv-shop-product-card"],
      ["login", "/konto/anmelden", 'input[type="password"]'],
      ["register", "/konto/registrieren", 'input[name="first_name"]'],
      ["password-reset", "/konto/passwort-vergessen", 'input[type="email"]'],
      [
        "password-set",
        "/konto/passwort-setzen?token=locale-fixture",
        'input[type="password"]',
      ],
      ["newsletter", "/newsletter", 'input[type="email"]'],
    ];
    for (const [name, path, selector] of scenes) {
      await page.goto(path);
      await expect(page.locator(selector).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText(germanCopy);
      await page.screenshot({
        path: testInfo.outputPath(`${name}-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
    }
    await page.goto("/shop/produkte/kraeuter-set");
    await page
      .getByRole("button", { name: /Add to (cart|basket)/i })
      .first()
      .click();
    await page.goto("/kasse");
    await page.getByRole("button", { name: "Continue as guest" }).click();
    await expect(page.getByLabel(/Email address/i).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(germanCopy);
    await page.screenshot({
      path: testInfo.outputPath(`checkout-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    await mockAccount(page);
    await page.goto("/konto");
    await expect(page.locator(".sv-account").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(germanCopy);
    await page.screenshot({
      path: testInfo.outputPath(`account-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
  });
}

for (const width of [1280, 390])
  test(`completed pickup and table reservation stay English at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mockAccountActivity(page);
    await page.goto("/konto/buchungen");
    await expect(page.getByText("Table for 2 people").first()).toBeVisible();
    await testInfo.attach(`account-reservation-${width}.html`, {
      body: await page.content(),
      contentType: "text/html",
    });
    await page.getByRole("button", { name: "Past", exact: true }).click();
    await expect(
      page.getByText("Collected", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(germanCopy);
    await testInfo.attach(`account-activity-${width}.html`, {
      body: await page.content(),
      contentType: "text/html",
    });
    await page.screenshot({
      path: testInfo.outputPath(`account-activity-${width}.png`),
      fullPage: true,
    });
    await page.goto("/konto/buchungen/r-17");
    await expect(
      page.getByRole("button", { name: "Add to calendar" }),
    ).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Add to calendar" }).click(),
    ]);
    const stream = await download.createReadStream();
    if (!stream) throw new Error("Calendar download has no stream");
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(Buffer.concat(chunks).toString()).toContain(
      "SUMMARY:Table for 2 people",
    );
    await expect(page.locator("body")).not.toContainText(germanCopy);
  });

const ownLegal = {
  published: true,
  imprint_url: "",
  imprint: {
    company_name: "Restaurant GmbH",
    street: "Teststraße 12",
    postal_code: "30159",
    city: "Hannover",
    country: "DE",
    vat_id: "DE123456789",
    phone: "+49 511 123456",
    email: "kontakt@restaurant.example",
    register_entry: "Amtsgericht Hannover HRB 1",
  },
  privacy_url: "",
  privacy_text: "Eigener Text des Betreibers.\n\nZweiter Absatz.",
};

async function mockLegal(
  page: import("@playwright/test").Page,
  legal: unknown,
) {
  await page.route("**/api/shop/branding", (route) =>
    route.fulfill({
      json: { ...branding, imprint_url: "", privacy_url: "", published: true },
    }),
  );
  await page.route("**/api/shop/legal", (route) =>
    route.fulfill({ json: legal }),
  );
}

for (const width of [390, 1280])
  for (const colorScheme of ["light", "dark"] as const)
    test(`legal pages show the operator's own data and the footer links them at ${width}px ${colorScheme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await mockLegal(page, ownLegal);
      const evidence = (name: string) =>
        process.env.STOREFRONT_LEGAL_EVIDENCE_DIR
          ? `${process.env.STOREFRONT_LEGAL_EVIDENCE_DIR}/storefront-${name}-${width}-${colorScheme}.png`
          : testInfo.outputPath(`${name}-${width}-${colorScheme}.png`);
      await page.goto("/impressum");
      await expect(
        page.getByRole("heading", { name: "Legal notice", level: 1 }),
      ).toBeVisible();
      await expect(page.getByText("Restaurant GmbH")).toBeVisible();
      await expect(
        page.getByRole("link", { name: "kontakt@restaurant.example" }),
      ).toHaveAttribute("href", "mailto:kontakt@restaurant.example");
      await expect(page.getByText("Amtsgericht Hannover HRB 1")).toBeVisible();
      await expect(page.getByText("Demo placeholder")).toHaveCount(0);
      const legalNav = page.getByRole("navigation", { name: "Legal" });
      await expect(
        legalNav.getByRole("link", { name: "Legal notice" }),
      ).toHaveAttribute("href", "/impressum");
      await expect(
        legalNav.getByRole("link", { name: "Privacy" }),
      ).toHaveAttribute("href", "/datenschutz");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({ path: evidence("impressum"), fullPage: true });
      await legalNav.getByRole("link", { name: "Privacy" }).click();
      await expect(
        page.getByRole("heading", { name: "Privacy", level: 1 }),
      ).toBeVisible();
      await expect(page.getByText("Zweiter Absatz.")).toBeVisible();
      await page.screenshot({ path: evidence("datenschutz"), fullPage: true });
      // Every page carries both links.
      await page.goto("/events");
      await expect(
        legalNav.getByRole("link", { name: "Legal notice" }),
      ).toBeVisible();
      await expect(
        legalNav.getByRole("link", { name: "Privacy" }),
      ).toBeVisible();
      await legalNav.scrollIntoViewIfNeeded();
      await page.screenshot({ path: evidence("footer") });
    });

test("an operator's own legal page link replaces the starter page", async ({
  page,
}) => {
  await mockLegal(page, {
    ...ownLegal,
    imprint_url: "https://restaurant.example/impressum",
  });
  await page.route("https://restaurant.example/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Own imprint</h1>" }),
  );
  await page.goto("/impressum");
  await expect(page).toHaveURL("https://restaurant.example/impressum");
});

test("the starter placeholder remains only without a connected installation", async ({
  page,
}) => {
  await page.goto("/datenschutz");
  await expect(
    page.getByText("Demo placeholder", { exact: true }),
  ).toBeVisible();
});
