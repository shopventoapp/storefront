import { describe, expect, test } from "bun:test";
import { publicHref } from "../../src/components/runtime";
import { shellPath } from "../../src/lib/routes";

describe("runtime branding links", () => {
  test("preserves supported public destinations", () => {
    for (const value of [
      "/datenschutz",
      "https://example.com/privacy",
      "mailto:hello@example.com",
      "tel:+490000000",
    ]) {
      expect(publicHref(value, "/datenschutz")).toBe(value);
    }
  });

  test("rejects executable and opaque URL schemes", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,test",
      "file:///private",
      "vbscript:test",
    ]) {
      expect(publicHref(value, "/datenschutz")).toBe("/datenschutz");
    }
    expect(publicHref(undefined, "/datenschutz")).toBe("/datenschutz");
  });
});

describe("static route shells", () => {
  test("maps package product and account detail URLs to their shells", () => {
    expect(shellPath("/shop/produkte/kraeuter-set")).toBe("/shop");
    expect(shellPath("/gutscheine/zeit-gutschein")).toBe("/gutscheine");
    expect(shellPath("/konto/buchungen/t-demo")).toBe("/konto");
  });

  test("preserves distinct checkout returns and unrelated paths", () => {
    for (const path of [
      "/kasse/erfolg",
      "/kasse/abgebrochen",
      "/buchung",
      "/events",
      "/unknown",
      "/shopper",
    ]) {
      expect(shellPath(path)).toBe(path);
    }
  });
});

// Verify the exported shell stays English independently of API-authored content.
describe("English page metadata", () => {
  test("uses an English locale and copy for public and private pages", async () => {
    const { pageMetadata } = await import("../../src/lib/metadata");
    const publicPage = pageMetadata("/events");
    expect(publicPage.title).toBe("Experiences & dates");
    expect(publicPage.openGraph).toMatchObject({ locale: "en_GB" });
    expect(publicPage.description).toContain("book your place");
    expect(pageMetadata("/konto", "Your account").description).toBe(
      "Bookings, vouchers and orders at Nebenan Atelier.",
    );
  });
});
