"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BrandName, publicHref, useBranding } from "./runtime";

const navigation = [
  { label: "Erlebnisse", href: "/events" },
  { label: "Gutscheine", href: "/gutscheine" },
  { label: "Shop", href: "/shop" },
];

export function SiteHeader() {
  const [pathname, setPathname] = useState("");
  useEffect(() => setPathname(window.location.pathname.replace(/\/$/, "")), []);
  const branding = useBranding();
  const links = branding.navigation?.length ? branding.navigation : navigation;
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <a
          className="wordmark"
          href="/"
          aria-label={branding.brand_name || "Nebenan Atelier – Startseite"}
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
        <nav aria-label="Hauptnavigation" className="main-nav">
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
          <a href="/konto" className="icon-link" aria-label="Dein Konto">
            <Icon kind="person" />
          </a>
          <a href="/warenkorb" className="icon-link" aria-label="Warenkorb">
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
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <a className="wordmark" href="/">
            <BrandName />
          </a>
          <p>Gute Zeit. Neue Ideen. Miteinander.</p>
          <a href="/newsletter">Post aus dem Atelier</a>
        </div>
        <div className="footer-links">
          <nav aria-label="Weitere Angebote">
            <a href="/reservierung">Reservierung</a>
            <a href="/konto">Dein Konto</a>
            {branding.location_links?.map((link) => (
              <a key={link.href} href={publicHref(link.href, "/reservierung")}>
                {link.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Rechtliches">
            <a href={publicHref(branding.imprint_url, "/impressum")}>
              Impressum
            </a>
            <a href={publicHref(branding.privacy_url, "/datenschutz")}>
              Datenschutz
            </a>
            <a href={publicHref(branding.terms_url, "/agb")}>AGB</a>
            <a href={publicHref(branding.withdrawal_url, "/widerruf")}>
              Widerruf
            </a>
          </nav>
        </div>
        <p className="demo-note">
          Fiktives Demo-Atelier · Angebote kommen aus der verbundenen Instanz.
        </p>
      </div>
    </footer>
  );
}
