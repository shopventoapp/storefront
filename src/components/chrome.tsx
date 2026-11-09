"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { platformMode } from "@/lib/platform";
import { demoName } from "@/lib/routes";
import {
  BrandName,
  publicHref,
  useBranding,
  useDiscovery,
  useLegalLinks,
} from "./runtime";

const navigation = [
  { label: "Experiences", href: "/events" },
  { label: "Vouchers", href: "/gutscheine" },
  { label: "Shop", href: "/shop" },
];

export function SiteHeader() {
  const [pathname, setPathname] = useState("");
  useEffect(() => setPathname(window.location.pathname.replace(/\/$/, "")), []);
  const branding = useBranding();
  const { hasShop, locations, ready } = useDiscovery();
  const links = platformMode
    ? [
        { label: "Veranstaltungen", href: "/events" },
        { label: "Gutscheine", href: "/gutscheine" },
        ...(locations.some((location) => location.table_reservations_enabled)
          ? [{ label: "Tisch reservieren", href: "/reservierung" }]
          : []),
        ...(hasShop ? [{ label: "Shop", href: "/shop" }] : []),
      ]
    : branding.navigation?.length
      ? branding.navigation
      : navigation;
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <a
          className="wordmark"
          href="/"
          aria-label={
            platformMode
              ? `${branding.brand_name || demoName}, Startseite`
              : branding.brand_name || demoName
          }
        >
          {branding.logo_url ? (
            <Image
              src={publicHref(branding.logo_url, "")}
              alt={branding.logo_alt || branding.brand_name || "Logo"}
              width={160}
              height={48}
              unoptimized
            />
          ) : (
            <BrandName />
          )}
        </a>
        <nav
          aria-label={platformMode ? "Hauptnavigation" : "Main navigation"}
          className={platformMode ? "main-nav platform-nav" : "main-nav"}
          data-ready={!platformMode || ready}
          aria-busy={platformMode && !ready}
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={publicHref(link.href, "/")}
              aria-current={
                pathname.replace(/\/$/, "") === link.href ? "page" : undefined
              }
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a
            href="/konto"
            className="icon-link"
            aria-label={platformMode ? "Dein Konto" : "Your account"}
          >
            <Icon kind="person" />
          </a>
          <a
            href="/warenkorb"
            className="icon-link"
            aria-label={platformMode ? "Warenkorb" : "Cart"}
          >
            <Icon kind="bag" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Icon({ kind }: { kind: "person" | "bag" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {kind === "person" ? (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </>
      ) : (
        <>
          <path d="M5 7h14l1 14H4L5 7Z" />
          <path d="M8 8V6a4 4 0 0 1 8 0v2" />
        </>
      )}
    </svg>
  );
}

export function SiteFooter() {
  const branding = useBranding();
  const legal = useLegalLinks();
  const { locations } = useDiscovery();
  const reserve =
    !platformMode ||
    locations.some((location) => location.table_reservations_enabled);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <a className="wordmark" href="/">
            <BrandName />
          </a>
          <p>
            {platformMode
              ? "Schön, dass Du da bist."
              : "Good times. Fresh ideas. Together."}
          </p>
          <a href="/newsletter">
            {platformMode ? "Neuigkeiten" : "News from the atelier"}
          </a>
        </div>
        <div className="footer-links">
          <nav aria-label={platformMode ? "Weitere Links" : "More to explore"}>
            {reserve && (
              <a href="/reservierung">
                {platformMode ? "Tisch reservieren" : "Reservations"}
              </a>
            )}
            <a href="/konto">{platformMode ? "Dein Konto" : "Your account"}</a>
            {branding.location_links?.map((link) => (
              <a key={link.href} href={publicHref(link.href, "/reservierung")}>
                {link.label}
              </a>
            ))}
          </nav>
          <nav aria-label={platformMode ? "Rechtliches" : "Legal"}>
            <a
              href={publicHref(
                legal.imprint_url || branding.imprint_url,
                "/impressum",
              )}
            >
              {platformMode ? "Impressum" : "Legal notice"}
            </a>
            <a
              href={publicHref(
                legal.privacy_url || branding.privacy_url,
                "/datenschutz",
              )}
            >
              {platformMode ? "Datenschutz" : "Privacy"}
            </a>
            <a href={publicHref(legal.terms_url || branding.terms_url, "/agb")}>
              {platformMode ? "AGB" : "Terms"}
            </a>
            <a
              href={publicHref(
                legal.withdrawal_url || branding.withdrawal_url,
                "/widerruf",
              )}
            >
              {platformMode ? "Widerruf" : "Cancellation rights"}
            </a>
          </nav>
        </div>
        {!platformMode && (
          <p className="demo-note">
            Fictional demo atelier · Offers come from the connected
            installation.
          </p>
        )}
      </div>
    </footer>
  );
}
