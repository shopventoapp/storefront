"use client";
import { createShopClient, ShopFlow } from "@shopvento/ui/shop-flow";
import { useState } from "react";
import "@shopvento/ui/shop-flow.css";
import "@shopvento/ui/shop.css";

const guestClient = createShopClient({
  fetcher: (input, init) => fetch(input, { ...init, credentials: "omit" }),
});

export default function EmbedVoucher() {
  const [path, setPath] = useState("/shop/gutscheine");
  const [checkout, setCheckout] = useState("");
  function navigate(target: string) {
    const url = new URL(target, window.location.origin);
    if (
      url.origin === window.location.origin &&
      /^\/(shop|warenkorb|kasse)(\/|$)/.test(url.pathname) &&
      !/\/kasse\/(erfolg|abgebrochen)/.test(url.pathname)
    )
      setPath(url.pathname + url.search);
    else if (
      url.protocol === "https:" &&
      (url.origin === window.location.origin ||
        (url.hostname === "checkout.stripe.com" &&
          !url.username &&
          !url.password))
    ) {
      setCheckout(url.href);
      window.open(url.href, "_blank", "noopener");
    }
  }
  return (
    <section
      aria-label="Gutschein kaufen"
      onClickCapture={(event) => {
        const link = (event.target as HTMLElement).closest("a[href]");
        if (link instanceof HTMLAnchorElement) {
          event.preventDefault();
          event.stopPropagation();
          navigate(link.href);
        }
      }}
    >
      <h2>Gutschein kaufen</h2>
      <p>Die Zahlung öffnet sich in einem neuen Fenster.</p>
      {checkout && (
        <p role="status">
          <a href={checkout} target="_blank" rel="noopener">
            Weiter zur Zahlung
          </a>
        </p>
      )}
      <ShopFlow
        client={guestClient}
        embedded
        initialPath={path}
        onNavigate={navigate}
        accountEnabled={false}
        eventsEnabled={false}
        locale="de"
        restrictSections
        sections={[
          {
            key: "gutscheine",
            label: "Gutscheine",
            description: "Verschenke gemeinsame Zeit.",
            image: "gutscheine",
          },
        ]}
        categoryKey={(article) =>
          article.type === "VOUCHER" || article.category?.is_voucher
            ? "gutscheine"
            : "excluded"
        }
        sectionEnabled={(slug) => slug === "gutscheine"}
      />
    </section>
  );
}
