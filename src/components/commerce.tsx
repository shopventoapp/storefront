"use client";

import type { ShopArticle, ShopSectionDefinition } from "@shopvento/ui";
import {
  NewsletterSignup,
  type NewsletterSignupProps,
  ReservationForm,
} from "@shopvento/ui/forms";
import { ShopFlow } from "@shopvento/ui/shop-flow";
import {
  englishMessages,
  englishProductPresentation,
  englishShopCopy,
} from "@/lib/ui-english";
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

const images = {
  regal: "/catalogue.svg",
  produkte: "/catalogue.svg",
  gutscheine: "/catalogue.svg",
  laden: "/catalogue.svg",
  lieferung: "/catalogue.svg",
};
function productPresentation(article: ShopArticle) {
  return {
    ...englishProductPresentation(article),
    category: categoryFor(article),
    placeholder: "gift" as const,
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
        images={images}
        NewsletterComponent={Newsletter}
        {...englishShopCopy}
        routes={{ events: "/events" }}
        labels={englishMessages}
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
      labels={englishMessages}
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
      labels={englishMessages}
      siteKey={data?.turnstile_site_key ?? ""}
      publicApi={publicApi}
      termsEnabled
      termsUrl={publicHref(brand.terms_url, "/agb")}
      privacyUrl={publicHref(brand.privacy_url, "/datenschutz")}
    />
  );
}
