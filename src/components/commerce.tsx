"use client";

import {
  defaultShopProduct,
  type ShopArticle,
  type ShopSectionDefinition,
} from "@shopvento/ui";
import { NewsletterSignup, ReservationForm } from "@shopvento/ui/forms";
import { ShopFlow } from "@shopvento/ui/shop-flow";
import {
  publicApi,
  publicHref,
  useBranding,
  usePublicSettings,
} from "./runtime";

const sections: ShopSectionDefinition[] = [
  {
    key: "produkte",
    label: "Produkte",
    description: "Kleine Entdeckungen für zu Hause.",
    image: "produkte",
  },
  {
    key: "gutscheine",
    label: "Gutscheine",
    description: "Gemeinsame Zeit verschenken.",
    image: "gutscheine",
  },
];

const labels = {
  "Noch nichts im Korb.": "Dein Warenkorb ist leer.",
  "Wein, Winzer, Rebsorte suchen": "Produkte und Gutscheine suchen",
  "Wein, Feinkost oder ein Geschenk: Such Dir etwas Schönes aus.":
    "Eine neue Idee oder ein Geschenk: Such Dir etwas Schönes aus.",
};
const images = {
  regal: "/catalogue.svg",
  produkte: "/catalogue.svg",
  gutscheine: "/catalogue.svg",
  laden: "/catalogue.svg",
  lieferung: "/catalogue.svg",
};
function productPresentation(article: ShopArticle) {
  return {
    ...defaultShopProduct(article),
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
        labels={labels}
      />
    </div>
  );
}

export function Newsletter() {
  const brand = useBranding();
  const { data } = usePublicSettings();
  return (
    <NewsletterSignup
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
      siteKey={data?.turnstile_site_key ?? ""}
      publicApi={publicApi}
      termsEnabled
      termsUrl={publicHref(brand.terms_url, "/agb")}
      privacyUrl={publicHref(brand.privacy_url, "/datenschutz")}
    />
  );
}
