import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PaymentAvailabilityNotice } from "../../src/components/payment-availability";
import { uiLocale } from "../../src/lib/platform";

const unavailable = { online_payments_enabled: false };
const german =
  "Kartenzahlung ist bald verfügbar. Du kannst weiterhin Gutscheine einlösen.";

test("the German embed can override the storefront payment notice locale", () => {
  expect(
    renderToStaticMarkup(
      createElement(PaymentAvailabilityNotice, {
        status: unavailable,
        locale: "de",
      }),
    ),
  ).toContain(german);
});

test("ordinary storefront payment copy keeps the configured default locale", () => {
  const markup = renderToStaticMarkup(
    createElement(PaymentAvailabilityNotice, {
      status: unavailable,
    }),
  );
  expect(markup).toContain(uiLocale === "de" ? german : "Card payments:");
});

test("available or unknown payments do not render an unavailable notice", () => {
  for (const status of [null, { online_payments_enabled: true }]) {
    expect(
      renderToStaticMarkup(
        createElement(PaymentAvailabilityNotice, {
          status,
          locale: "de",
        }),
      ),
    ).toBe("");
  }
});
