import type { Page } from "@playwright/test";
import type {
  AccountBooking,
  AccountOrder,
  AccountProfile,
  ShopArticle,
  ShopEvent,
  ShopOperations,
  ShopSettings,
  Timewindow,
} from "@shopvento/ui";

// These wire shapes follow the package's public OpenAPI contract.
export const event = {
  tasting_id: 1,
  tasting_name: "Herb workshop",
  full_name: "Herb workshop",
  price: 4900,
  variant_id: null,
  variant_name: null,
} satisfies ShopEvent;

const nextDate = new Date(Date.now() + 14 * 86_400_000)
  .toISOString()
  .slice(0, 10);
export const timewindow = {
  id: "workshop-slot",
  timewindow_id: "workshop-slot",
  tasting_id: 1,
  franchise_location_id: 1,
  date: nextDate,
  start_time: "18:00:00",
  end_time: "20:00:00",
  event_name: event.tasting_name,
  max_participants: 12,
  free_spots: 8,
} satisfies Timewindow;

export const settings = {
  countries: [{ value: "DE", label: "Germany" }],
  installation_country: "DE",
  min_customer_age: 0,
  direct_booking_enabled: true,
  guest_booking_enabled: true,
  guest_shop_checkout_enabled: true,
  shop_checkout_review_required: false,
  guest_max_seats: 8,
  online_lead_hours: 24,
  turnstile_site_key: "1x00000000000000000000AA",
} satisfies ShopSettings;

export const product = {
  id: "kraeuter-set",
  title: "Herb kit",
  slug: "kraeuter-set",
  subtitle: "A little workshop for your home.",
  description: "Discover fresh ideas with your herb kit.",
  price: 2400,
  type: "PHYSICAL",
  vat_rate: { id: 1, bezeichnung: "Standard", satz: 19, aktiv: true },
  variants: [],
  images: [],
  category: {
    id: "produkte",
    name: "Products",
    title: "Products",
    slug: "produkte",
    is_public: true,
    is_voucher: false,
  },
  availability: { state: "AVAILABLE", text: "Available" },
  withdrawal_note: "",
} satisfies ShopArticle;

export const voucher = {
  ...product,
  id: "zeit-gutschein",
  slug: "zeit-gutschein",
  title: "Give time together",
  subtitle: "For workshops, discoveries and shared moments.",
  price: 5000,
  type: "VOUCHER",
  voucher_kind: "MULTI_PURPOSE",
  category: {
    ...product.category,
    id: "gutscheine",
    name: "Vouchers",
    title: "Vouchers",
    slug: "gutscheine",
    is_voucher: true,
  },
} satisfies ShopArticle;

export const catalogue = {
  articles: [product],
  total: 1,
  vouchers: [voucher],
  voucher_total: 1,
} satisfies ShopOperations["catalogue"]["response"];

const pickup = {
  id: "atelier-pickup",
  type: "PICKUP",
  title: "Collection at the atelier",
  price: 0,
  eligible_dates: [nextDate],
} satisfies NonNullable<
  ShopOperations["quote"]["response"]["available_fulfillment_options"]
>[number];

export function quote(
  body: ShopOperations["quote"]["body"],
): ShopOperations["quote"]["response"] {
  const items = body.items.map((item) => {
    const article = item.id === voucher.id ? voucher : product;
    return {
      id: article.id,
      article,
      quantity: item.quantity,
      price: article.price * item.quantity,
      price_per_item: article.price,
      variant: null,
    };
  });
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return {
    items,
    subtotal_price: total,
    total_price: total,
    shipping_cost: 0,
    tax_breakdown: [],
    vouchers_discounts: [],
    available_fulfillment_options: [pickup],
    selected_fulfillment_option: pickup,
  };
}

export const branding = {
  configured: true,
  brand_name: "Nebenan Atelier",
  logo_url: null,
  privacy_url: "/datenschutz",
  terms_url: "/agb",
  imprint_url: "/impressum",
  withdrawal_url: "/widerruf",
  location_links: [],
  navigation: [],
};

export async function mockShop(page: Page) {
  await page.route("**/branding/theme.css", (route) =>
    route.fulfill({
      contentType: "text/css",
      body: ':root { --brand-primary: #315a51; --brand-bg: #edf4f0; --brand-text: #21372d; --brand-font-heading: "Source Sans 3"; }',
    }),
  );
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/\/$/, "");
    const json = (body: unknown, status = 200) =>
      route.fulfill({ json: body, status });
    if (path === "/api/shop/branding") return json(branding);
    if (path === "/api/shop/settings") return json(settings);
    if (path === "/api/shop/tastings") return json([event]);
    if (path === "/api/shop/tastings/locations") {
      return json({
        locations: [{ id: 1, location_name: "Nebenan Atelier" }],
        total: 1,
      });
    }
    if (path === "/api/shop/tastings/timewindows") {
      return json({ timewindows: [timewindow], total: 1 });
    }
    if (path === "/api/shop/articles/catalogue") return json(catalogue);
    if (path === "/api/shop/articles")
      return json({ articles: [voucher], total: 1 });
    if (path === "/api/shop/articles/kraeuter-set") return json(product);
    if (path === "/api/shop/articles/zeit-gutschein") return json(voucher);
    if (path === "/api/shop/cart")
      return json(quote(route.request().postDataJSON()));
    if (path === "/api/shop/user/profile")
      return json({ detail: "Not signed in" }, 401);
    if (path === "/api/shop/user/google-auth/status")
      return json({ enabled: false });
    return json({ detail: `Unexpected test API request: ${path}` }, 501);
  });
}

export const accountProfile = {
  id: 1,
  first_name: "Demo",
  last_name: "Guest",
  full_name: "Demo Guest",
  email: "demo@example.com",
  country: "DE",
  is_email_verified: true,
} satisfies AccountProfile;

export const accountOrder = {
  id: "order-demo",
  order_number: "DEMO-1",
  created_at: "2026-01-01T12:00:00Z",
  status: "PAID",
  items: [],
  fulfillments: [],
  payments: [],
} satisfies AccountOrder;

export const accountBooking = {
  order_id: "booking-demo",
  tasting_id: 1,
  franchise_location: { id: 1, location_name: "Nebenan Atelier" },
  date: nextDate,
  start_time: "18:00:00",
  end_time: "20:00:00",
  event_name: "Herb workshop",
} satisfies AccountBooking;

export async function mockAccount(page: Page) {
  await page.route("**/api/shop/user/profile", (route) =>
    route.fulfill({ json: accountProfile }),
  );
  await page.route("**/api/shop/orders/", (route) =>
    route.fulfill({ json: [accountOrder] }),
  );
  await page.route("**/api/shop/tastings/bookings", (route) =>
    route.fulfill({ json: [accountBooking] }),
  );
  await page.route("**/api/shop/tastings/bookings/booking-demo", (route) =>
    route.fulfill({ json: accountBooking }),
  );
  await page.route("**/api/shop/table-reservations", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/shop/vouchers/customer", (route) =>
    route.fulfill({ json: [] }),
  );
}
