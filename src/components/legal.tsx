"use client";

import { type ReactNode, useEffect, useState } from "react";
import { publicHref } from "./runtime";

/** The operator's own legal pages from `GET /api/shop/legal` (#43723). */
export type Legal = {
  published?: boolean;
  imprint_url?: string;
  imprint?: {
    company_name: string;
    street: string;
    postal_code: string;
    city: string;
    country: string;
    vat_id: string;
    phone: string;
    email: string;
    register_entry: string;
  } | null;
  privacy_url?: string;
  privacy_text?: string;
};

export async function loadLegal(signal?: AbortSignal): Promise<Legal> {
  const response = await fetch("/api/shop/legal", {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    redirect: "manual",
    signal,
  });
  if (!response.ok)
    throw new Error(`Legal pages unavailable (${response.status})`);
  const value = await response.json();
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid legal response");
  return value as Legal;
}

/**
 * Renders the installation's own text, or forwards to its own page. The demo
 * placeholder remains only when no installation answers.
 */
export function LegalContent({
  kind,
  title,
  placeholder,
}: {
  kind: "imprint" | "privacy";
  title: string;
  placeholder: ReactNode;
}) {
  const [legal, setLegal] = useState<Legal | null | undefined>(undefined);
  useEffect(() => {
    const controller = new AbortController();
    loadLegal(controller.signal).then(setLegal, () => {
      if (!controller.signal.aborted) setLegal(null);
    });
    return () => controller.abort();
  }, []);
  const configured =
    kind === "imprint" ? legal?.imprint_url : legal?.privacy_url;
  // Only the operator's own external page; a relative value would point back here.
  const link = /^https?:\/\//.test(configured ?? "")
    ? publicHref(configured, "")
    : "";
  useEffect(() => {
    if (link) window.location.replace(link);
  }, [link]);
  if (legal === undefined)
    return (
      <p className="state" role="status">
        Loading …
      </p>
    );
  if (legal === null) return <>{placeholder}</>;
  const intro = (
    <div className="page-intro">
      <h1>{title}</h1>
    </div>
  );
  if (link)
    return (
      <>
        {intro}
        <p>
          <a className="text-link" href={link}>
            Open the {title.toLowerCase()} of this shop
          </a>
        </p>
      </>
    );
  if (kind === "privacy")
    return (
      <>
        {intro}
        {legal.privacy_text ? (
          <div className="legal-text">{legal.privacy_text}</div>
        ) : (
          <p>No privacy policy has been provided yet.</p>
        )}
      </>
    );
  const imprint = legal.imprint;
  if (!imprint)
    return (
      <>
        {intro}
        <p>No legal notice has been provided yet.</p>
      </>
    );
  const rows: [string, ReactNode][] = [
    [
      "Email",
      imprint.email && <a href={`mailto:${imprint.email}`}>{imprint.email}</a>,
    ],
    ["Phone", imprint.phone],
    ["Register entry", imprint.register_entry],
    ["VAT ID", imprint.vat_id],
  ];
  return (
    <>
      {intro}
      <address className="legal-address">
        <strong>{imprint.company_name}</strong>
        <br />
        {imprint.street}
        <br />
        {[imprint.postal_code, imprint.city].filter(Boolean).join(" ")}
        {imprint.country && (
          <>
            <br />
            {imprint.country}
          </>
        )}
      </address>
      <dl className="legal-facts">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
    </>
  );
}
