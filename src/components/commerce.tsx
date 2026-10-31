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
import { englishShopCopy } from "@/lib/ui-english";
import {
  publicApi,
  publicHref,
  useBranding,
  usePublicSettings,
} from "./runtime";

const sections: ShopSectionDefinition[] = [
  {
    key: "produkte",
    label: "Products",
    description: "Little discoveries for your home.",
    image: "produkte",
  },
  {
    key: "gutscheine",
    label: "Vouchers",
    description: "Give the gift of time together.",
    image: "gutscheine",
  },
];

function productPresentation(article: ShopArticle) {
  return {
    ...defaultShopProduct(article, {}, { locale: "en-GB" }),
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
      <ShopFlow
        key={path}
        initialPath={path}
        sections={sections}
        categoryKey={categoryFor}
        productModel={productPresentation}
        NewsletterComponent={Newsletter}
        {...englishShopCopy}
        routes={{ events: "/events" }}
        locale="en-GB"
      />
    </div>
  );
}

export function Newsletter(props: Partial<NewsletterSignupProps> = {}) {
  const brand = useBranding();
  const { data } = usePublicSettings();
  return (
    <NewsletterSignup
      {...props}
      locale="en-GB"
      siteKey={data?.turnstile_site_key ?? ""}
      publicApi={publicApi}
      privacyUrl={publicHref(brand.privacy_url, "/datenschutz")}
    />
  );
}

export function Reservation() {
  const brand = useBranding();
  const { data } = usePublicSettings();
  return (
    <ReservationForm
      NewsletterComponent={Newsletter}
      locale="en-GB"
      siteKey={data?.turnstile_site_key ?? ""}
      publicApi={publicApi}
      termsEnabled
      termsUrl={publicHref(brand.terms_url, "/agb")}
      privacyUrl={publicHref(brand.privacy_url, "/datenschutz")}
    />
  );
}
