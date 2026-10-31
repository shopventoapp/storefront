"use client";

import { createBookingClient, useAccountResource } from "@shopvento/ui";
import { type Branding, loadBranding } from "@shopvento/ui/branding";
import { createContext, useContext, useEffect, useState } from "react";
import { demoName, privatePages, publicPages, shellPath } from "@/lib/routes";

export const bookingClient = createBookingClient({
  baseUrl: "",
  credentials: "same-origin",
});

export type { Branding } from "@shopvento/ui/branding";

const BrandContext = createContext<Branding>({});
export const useBranding = () => useContext(BrandContext);

export function publicHref(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  try {
    const url = new URL(value, "https://storefront.example");
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol)
      ? value
      : fallback;
  } catch {
    return fallback;
  }
}

export function RuntimeProvider({
  children,
  initialBranding = {},
}: {
  children: React.ReactNode;
  initialBranding?: Branding;
}) {
  const [branding, setBranding] = useState<Branding>(initialBranding);
  useEffect(() => {
    const controller = new AbortController();
    loadBranding({ signal: controller.signal })
      .then(setBranding)
      .catch(() => {
        /* Default branding stays usable when the instance is unavailable. */
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    const pages = [...publicPages, ...privatePages];
    const page =
      pages.find((item) => item.path === path) ??
      pages.find((item) => item.path === shellPath(path));
    if (!page) return;
    const name = branding.brand_name || demoName;
    const description =
      "description" in page
        ? page.description.replaceAll(demoName, name)
        : `Bookings, vouchers and orders · ${name}`;
    function syncMetadata() {
      const set = (selector: string, attribute: string, value: string) => {
        for (const element of document.querySelectorAll(selector))
          element.setAttribute(attribute, value);
      };
      document.title = `${page?.title} · ${name}`;
      set('link[rel="canonical"]', "href", `${window.location.origin}${path}`);
      set(
        'meta[property="og:title"], meta[name="twitter:title"]',
        "content",
        document.title,
      );
      set('meta[property="og:site_name"]', "content", name);
      set(
        'meta[property="og:url"]',
        "content",
        `${window.location.origin}${path}`,
      );
      set(
        'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]',
        "content",
        description,
      );
      set(
        'meta[property="og:image"], meta[name="twitter:image"]',
        "content",
        `${window.location.origin}/opengraph-image`,
      );
    }
    syncMetadata();
    // Next may stream metadata after client hydration. Keep those entries aligned too.
    const observer = new MutationObserver(syncMetadata);
    observer.observe(document.head, { childList: true });
    return () => observer.disconnect();
  }, [branding]);
  return <BrandContext value={branding}>{children}</BrandContext>;
}

export function BrandName() {
  return <>{useBranding().brand_name || demoName}</>;
}

export function usePublicSettings() {
  return useAccountResource((signal) => bookingClient.getSettings(signal));
}

export async function publicApi() {
  const data = await bookingClient.listLocations();
  return {
    shopvento: true,
    locationId:
      (
        data.locations.find(
          (location) => location.table_reservations_enabled,
        ) ?? data.locations[0]
      )?.id ?? null,
  };
}
