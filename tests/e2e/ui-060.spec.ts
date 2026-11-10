import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, type Page, type TestInfo, test } from "@playwright/test";
import { mockShop, settings } from "../fixtures/shop";

test.skip(
  process.env.STOREFRONT_MULTI_TENANT !== "true",
  "German platform suite",
);

async function screenshot(page: Page, info: TestInfo, name: string) {
  const directory = process.env.STOREFRONT_SCREENSHOT_DIR;
  if (directory) await mkdir(directory, { recursive: true });
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
    await new Promise(requestAnimationFrame);
  });
  await page.screenshot({
    path: directory
      ? resolve(directory, `${name}.png`)
      : info.outputPath(`${name}.png`),
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

for (const width of [390, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    for (const closed of [false, true]) {
      test(`reservation timed closure=${closed} ${width} ${colorScheme}`, async ({
        page,
      }, info) => {
        await page.clock.setFixedTime(new Date("2026-11-10T12:00:00Z"));
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme });
        await mockShop(page);
        await page.route("**/api/shop/payments/status", (route) =>
          route.fulfill({ json: { online_payments_enabled: false } }),
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
                opening_hours: [
                  { weekday: 4, opens: "12:00", closes: "23:00" },
                ],
                opening_exceptions: closed
                  ? [
                      {
                        from: "2026-11-20",
                        until: "2026-11-20",
                        closed_from: "2026-11-20T18:00:00+01:00",
                        closed_until: "2026-11-20T20:00:00+01:00",
                        label: "Private Feier",
                      },
                    ]
                  : [],
              },
            }),
        );
        await page.goto("/reservierung");
        const form = page.locator("form.sv-reservation");
        await form.locator('[name="date"]').fill("20.11.2026");
        await form.locator('[name="time"]').fill("18:30");
        await form.locator('[name="time"]').blur();
        if (closed) {
          await expect(form).toContainText(
            "Geschlossen von 18:00 bis 20:00 Uhr.",
          );
          await expect(form.locator('[name="time"]')).toHaveAttribute(
            "aria-invalid",
            "true",
          );
          await expect(form).toContainText(
            "Zu dieser Uhrzeit haben wir geschlossen.",
          );
        } else {
          await expect(form).not.toContainText("Geschlossen von");
          await expect(form.locator('[name="time"]')).not.toHaveAttribute(
            "aria-invalid",
            "true",
          );
        }
        await screenshot(
          page,
          info,
          `reservation-${closed ? "closed" : "open"}-${width}-${colorScheme}`,
        );
        await form.locator('[name="time"]').fill("20:00");
        await form.locator('[name="time"]').blur();
        await expect(form.locator('[name="time"]')).not.toHaveAttribute(
          "aria-invalid",
          "true",
        );
        await form.getByRole("button", { name: "Jetzt reservieren" }).click();
        await expect(form.locator('[name="name"]')).toBeFocused();
        await expect(form.locator('[name="name"]')).toHaveAccessibleDescription(
          "Bitte gib Deinen Namen ein.",
        );
        await expect(
          form.getByRole("link", { name: "AGB", exact: true }),
        ).toHaveCSS("text-decoration-line", "underline");
      });
    }
    for (const enabled of [false, true]) {
      test(`voucher purchase payments=${enabled} ${width} ${colorScheme}`, async ({
        page,
      }, info) => {
        await page.clock.setFixedTime(new Date("2026-11-10T12:00:00Z"));
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme });
        await mockShop(page);
        await page.route("**/api/shop/payments/status", (route) =>
          route.fulfill({
            json: {
              online_payments_enabled: enabled,
              checkout_label: enabled ? "Zur Zahlung" : "Bald verfügbar",
            },
          }),
        );
        await page.route("https://challenges.cloudflare.com/**", (route) =>
          route.fulfill({
            contentType: "application/javascript",
            body: "window.turnstile = { render: (element, options) => { queueMicrotask(() => options.callback('synthetic-token')); return 'synthetic-widget'; }, remove: () => {}, reset: () => {} };",
          }),
        );
        await page.route("**/api/shop/settings", (route) =>
          route.fulfill({
            json: { ...settings, shop_checkout_review_required: true },
          }),
        );
        await page.goto("/shop/gutscheine/zeit-gutschein");
        await page
          .getByRole("button", { name: /In den Warenkorb/ })
          .first()
          .click();
        await page.goto("/kasse");
        await page.getByRole("button", { name: "Als Gast fortfahren" }).click();
        await page.locator("#first_name").fill("Demo");
        await page.locator("#last_name").fill("Gast");
        await page.locator("#email").fill("demo@example.com");
        await page.locator("#terms").check();
        const submit = page.getByRole("button", {
          name: enabled ? "Zahlungspflichtig bestellen" : "Bald verfügbar",
          exact: true,
        });
        if (enabled) await expect(submit).toBeEnabled();
        else await expect(submit).toBeDisabled();
        await screenshot(
          page,
          info,
          `voucher-${enabled ? "enabled" : "disabled"}-${width}-${colorScheme}`,
        );
      });
    }
  }
}
