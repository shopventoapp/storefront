import { describe, expect, test } from "bun:test";
import {
  defaultShopProduct,
  englishMessages,
  germanMessages,
  localeMoney,
  mergeBookingLabels,
} from "@shopvento/ui";
import { englishBookingLabels } from "../../src/lib/ui-english";
import { product, voucher } from "../fixtures/shop";

const placeholders = (value: string) =>
  Array.from(new Set(value.match(/\{\d+\}/g) ?? [])).sort();
describe("English package catalogue", () => {
  for (const [name, catalogue] of Object.entries(germanMessages)) {
    test(`${name} ships complete translations with preserved runtime placeholders`, () => {
      const translated = englishMessages[
        name as keyof typeof englishMessages
      ] as Record<string, string>;
      for (const key of Object.keys(catalogue)) {
        expect(translated[key], key).toBeString();
        expect(placeholders(translated[key]), key).toEqual(placeholders(key));
      }
    });
  }
  test("starter experience terminology retains plural voucher copy", () => {
    const labels = mergeBookingLabels(englishBookingLabels, { locale: "en" });
    expect(labels.eventVoucherMissing(1)).toBe(
      "1 place still needs an experience voucher.",
    );
    expect(labels.eventVoucherMissing(2)).toBe(
      "2 places still need an experience voucher.",
    );
  });
  test("package product mapping supplies English voucher descriptions and unit prices", () => {
    expect(defaultShopProduct(voucher, {}, { locale: "en" }).subtitle).toBe(
      "Multi-purpose voucher, redeemable across the entire range",
    );
    const model = defaultShopProduct(
      { ...product, unit_price: { amount_cents: 123456, unit: "kg" } },
      {},
      { locale: "en" },
    );
    expect(model.unitPrice).toBe("€1,234.56 / kg");
    expect(localeMoney(4900, "en")).toBe("€49.00");
  });
});
