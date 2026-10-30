import { expect, test } from "@playwright/test";
import { branding, mockAccount, mockShop } from "../fixtures/shop";

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
  await page.getByRole("button", { name: "Als Gast fortfahren" }).click();
  await expect(page.getByLabel(/E-?mail/i).first()).toBeVisible();
});

// Account authentication and compact booking copy are fixed German in @shopvento/ui 0.3.0.
test("customer account opens the package login", async ({ page }) => {
  await page.goto("/konto");
  await expect(page.getByLabel(/E-?mail/i).first()).toBeVisible();
  await expect(page.getByLabel("Passwort", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Anmelden/i }).first(),
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
  await expect(page.getByLabel(/Vorname/i)).toBeVisible();
  await expect(page.getByLabel(/Nachname/i)).toBeVisible();
  await page.goto("/konto/passwort-vergessen");
  await expect(page.getByLabel(/E-?mail/i).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Link|Passwort/i }).first(),
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
    page.getByRole("button", { name: /bestätigen/i }).first(),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("first-test-capability");
});

test("an unauthenticated account deep link opens sign-in", async ({ page }) => {
  await page.goto("/konto/gutscheine");
  await expect(page.getByLabel(/E-?mail/i).first()).toBeVisible();
  await expect(page.getByLabel("Passwort", { exact: true })).toBeVisible();
});

test("authenticated account uses package details and valid contact navigation", async ({
  page,
}) => {
  await mockAccount(page);
  await page.goto("/konto");
  await expect(
    page.getByRole("heading", { name: "Hallo, Demo." }),
  ).toBeVisible();
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
