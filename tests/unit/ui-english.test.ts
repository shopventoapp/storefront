import { describe, expect, test } from "bun:test";
import {
  defaultBookingLabels,
  defaultNewsletterLabels,
  defaultReservationLabels,
  defaultShopFlowLabels,
} from "@shopvento/ui";
import {
  englishBookingLabels,
  englishMessages,
  englishProductPresentation,
  formatEnglishPrice,
} from "../../src/lib/ui-english";
import { product, voucher } from "../fixtures/shop";

const placeholders = (value: string) => value.match(/\{\d+\}/g)?.sort() ?? [];

describe("English package overrides", () => {
  for (const [name, catalogue] of Object.entries({
    shop: defaultShopFlowLabels,
    newsletter: defaultNewsletterLabels,
    reservation: defaultReservationLabels,
  })) {
    test(`${name} has complete overrides with preserved runtime placeholders`, () => {
      for (const key of Object.keys(catalogue)) {
        const value = englishMessages[key];
        expect(value, key).toBeString();
        expect(value?.length, key).toBeGreaterThan(0);
        expect(placeholders(value ?? ""), key).toEqual(placeholders(key));
      }
    });
  }

  test("booking overrides cover function-valued copy and plural places", () => {
    expect(Object.keys(englishBookingLabels).sort()).toEqual(
      Object.keys(defaultBookingLabels).sort(),
    );
    expect(englishBookingLabels.eventVoucherMissing(1)).toBe(
      "1 place still needs an experience voucher.",
    );
    expect(englishBookingLabels.eventVoucherMissing(2)).toBe(
      "2 places still need an experience voucher.",
    );
  });

  test("product presentation translates package voucher descriptions and unit prices", () => {
    expect(englishProductPresentation(voucher).subtitle).toBe(
      "Multi-purpose voucher, redeemable across the entire range",
    );
    const model = englishProductPresentation({
      ...product,
      unit_price: { amount_cents: 123456, unit: "kg" },
    });
    expect(model.unitPrice).toBe("€1,234.56 / kg");
    expect(formatEnglishPrice(4900)).toBe("€49.00");
  });
});
