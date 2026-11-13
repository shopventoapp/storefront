import { expect, test } from "@playwright/test";

test.skip(
  process.env.STOREFRONT_MULTI_TENANT === "true",
  "Default English build",
);
test("restaurant pages are unavailable and absent from the default sitemap", async ({
  page,
  request,
}) => {
  for (const path of ["/speisekarte", "/standorte"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.locator(".restaurant-page")).toHaveCount(0);
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toMatch(/speisekarte|standorte/);
});
