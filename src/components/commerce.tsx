"use client";

import {
  defaultShopProduct,
  type ShopArticle,
  type ShopSectionDefinition,
} from "@shopvento/ui";
import {
  NewsletterSignup,
  type NewsletterSignupProps,
  ReservationForm,
} from "@shopvento/ui/forms";
import { ShopFlow } from "@shopvento/ui/shop-flow";
import { platformMode, uiLocale } from "@/lib/platform";
import { englishShopCopy } from "@/lib/ui-english";
import {
  PaymentAvailability,
  publicApi,
  publicHref,
  useBranding,
  useLegalLinks,
  usePublicSettings,
} from "./runtime";

const sections: ShopSectionDefinition[] = [
  {
    key: "produkte",
    label: platformMode ? "Produkte" : "Products",
    description: platformMode
      ? "Entdecke unsere Produkte."
      : "Little discoveries for your home.",
    image: "produkte",
  },
  {
    key: "gutscheine",
    label: platformMode ? "Gutscheine" : "Vouchers",
    description: platformMode
      ? "Verschenke gemeinsame Zeit."
      : "Give the gift of time together.",
    image: "gutscheine",
  },
];

function productPresentation(article: ShopArticle) {
  return {
    ...defaultShopProduct(article, {}, { locale: uiLocale }),
    category: categoryFor(article),
  };
}
function categoryFor(article: ShopArticle) {
  return article.type === "VOUCHER" || article.category?.is_voucher
    ? "gutscheine"
    : "produkte";
}
export function Commerce({ path }: { path: string }) {
  return (
    <div className="wrap commerce">
      <PaymentAvailability />
      <ShopFlow
        key={path}
        initialPath={path}
        sections={sections}
        categoryKey={categoryFor}
        productModel={productPresentation}
        NewsletterComponent={Newsletter}
        {...(platformMode ? {} : englishShopCopy)}
        routes={{ events: "/events" }}
        locale={uiLocale}
      />
    </div>
  );
}

export function Newsletter(props: Partial<NewsletterSignupProps> = {}) {
  const brand = useBranding();
  const legal = useLegalLinks();
  const { data } = usePublicSettings();
  return (
    <NewsletterSignup
      {...props}
      locale={uiLocale}
      siteKey={data?.turnstile_site_key ?? ""}
      publicApi={publicApi}
      privacyUrl={publicHref(
        legal.privacy_url || brand.privacy_url,
        "/datenschutz",
      )}
    />
  );
}

export function Reservation() {
  const brand = useBranding();
  const legal = useLegalLinks();
  const { data } = usePublicSettings();
  return (
    <ReservationForm
      NewsletterComponent={Newsletter}
      locale={uiLocale}
      siteKey={data?.turnstile_site_key ?? ""}
      publicApi={publicApi}
      termsEnabled
      termsUrl={publicHref(legal.terms_url || brand.terms_url, "/agb")}
      privacyUrl={publicHref(
        legal.privacy_url || brand.privacy_url,
        "/datenschutz",
      )}
    />
  );
}
