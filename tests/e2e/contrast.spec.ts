import { expect, test } from "@playwright/test";
import { mockShop } from "../fixtures/shop";

function contrast(a: string, b: string) {
  function luminance(color: string) {
    const channels = color
      .match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
    if (channels?.length !== 3) throw new Error(`Invalid color: ${color}`);
    const [r, g, b] = channels.map((value) => {
      const s = value / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const palette of [
  {
    primary: "#315a51",
    accent: "#ff685e",
    onPrimary: "#ffffff",
    onAccent: "#000000",
  },
  {
    primary: "#fff8ec",
    accent: "#93452f",
    onPrimary: "#000000",
    onAccent: "#ffffff",
  },
]) {
  test(`tenant contrast primary=${palette.primary} accent=${palette.accent}`, async ({
    page,
  }) => {
    await mockShop(page);
    await page.route("**/branding/theme.css", (route) =>
      route.fulfill({
        contentType: "text/css",
        body: `:root { --brand-primary: ${palette.primary}; --brand-accent: ${palette.accent}; --brand-text: #21372d; --brand-on-primary: ${palette.onPrimary}; --brand-on-accent: ${palette.onAccent}; }`,
      }),
    );
    await page.goto("/");
    await expect(page.locator(".gift-panel .button")).toBeVisible();
    for (const button of await page
      .locator("main .button-coral, .gift-panel .button")
      .all()) {
      for (const hover of [false, true]) {
        if (hover) await button.hover();
        const colors = await button.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.color, style.backgroundColor];
        });
        expect(
          contrast(colors[0], colors[1]),
          `${await button.getAttribute("class")} hover=${hover} ${colors}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
    if (process.env.STOREFRONT_MULTI_TENANT !== "true") {
      const emphasis = page.locator(".gift-panel > p > em");
      const colors = await emphasis.evaluate((element) => ({
        text: getComputedStyle(element).color,
        decoration: getComputedStyle(element).textDecorationLine,
        background: getComputedStyle(
          element.parentElement?.parentElement ?? element,
        ).backgroundColor,
      }));
      expect(contrast(colors.text, colors.background)).toBeGreaterThanOrEqual(
        3,
      );
      expect(colors.decoration).toContain("underline");
    }
  });
}

test("accent buttons retain the existing text fallback without backend token", async ({
  page,
}) => {
  await mockShop(page);
  await page.route("**/branding/theme.css", (route) =>
    route.fulfill({
      contentType: "text/css",
      body: ":root { --brand-text: #21372d; }",
    }),
  );
  await page.goto("/");
  await expect(page.locator(".gift-panel .button")).toHaveCSS(
    "color",
    "rgb(33, 55, 45)",
  );
});
