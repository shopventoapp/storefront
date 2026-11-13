"use client";

import {
  createBookingClient,
  createShopClient,
  type Location,
  useAccountResource,
} from "@shopvento/ui";
import { type Branding, loadBranding } from "@shopvento/ui/branding";
import { createContext, useContext, useEffect, useState } from "react";
import {
  loadPaymentStatus,
  type PublicPaymentStatus,
} from "@/lib/payment-status";
import { platformMode } from "@/lib/platform";
import { hasMenu, loadRestaurant, reservationLocation } from "@/lib/restaurant";
import { demoName, privatePages, publicPages, shellPath } from "@/lib/routes";
import { PaymentAvailabilityNotice } from "./payment-availability";

export const bookingClient = createBookingClient({
  baseUrl: "",
  credentials: "same-origin",
});

export type { Branding } from "@shopvento/ui/branding";

const shopClient = createShopClient();
const DiscoveryContext = createContext<{
  hasShop: boolean;
  hasEvents: boolean;
  hasVouchers: boolean;
  hasMenu: boolean;
  locations: Location[];
  ready: boolean;
}>({
  hasShop: false,
  hasEvents: false,
  hasVouchers: false,
  hasMenu: false,
  locations: [],
  ready: false,
});
export const useDiscovery = () => useContext(DiscoveryContext);
const LegalLinksContext = createContext<{
  links: Record<string, string>;
  ready: boolean;
}>({ links: {}, ready: false });
export const useLegalResource = () => useContext(LegalLinksContext);
export const useLegalLinks = () => useLegalResource().links;

const RestaurantContext = createContext<{
  data: import("@/lib/restaurant").Restaurant | null;
  loading: boolean;
  error: unknown;
  reload: () => void;
}>({ data: null, loading: true, error: null, reload: () => {} });
export const useRestaurant = () => useContext(RestaurantContext);

const BrandContext = createContext<Branding>({});
export const useBranding = () => useContext(BrandContext);
const PaymentContext = createContext<PublicPaymentStatus | null>(null);
export const usePaymentStatus = () => useContext(PaymentContext);

export function PaymentAvailability() {
  const status = usePaymentStatus();
  return <PaymentAvailabilityNotice status={status} />;
}

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
  const [brandingReady, setBrandingReady] = useState(!platformMode);
  const { data: catalogue, loading: catalogueLoading } = useAccountResource(
    async (signal) =>
      platformMode
        ? shopClient.request("catalogue", undefined, { signal })
        : null,
  );
  const { data: locationData, loading: locationsLoading } = useAccountResource(
    async (signal) =>
      platformMode ? bookingClient.listLocations(signal) : null,
  );
  const { data: legal, loading: legalLoading } = useAccountResource(
    async (signal) => {
      if (!platformMode) return {};
      const response = await fetch("/api/shop/legal", {
        signal,
        cache: "no-store",
        credentials: "same-origin",
        redirect: "manual",
      });
      if (!response.ok) return {};
      const value: unknown = await response.json();
      if (!value || typeof value !== "object" || Array.isArray(value))
        return {};
      return Object.fromEntries(
        Object.entries(value).filter(
          ([key, item]) => key.endsWith("_url") && typeof item === "string",
        ),
      ) as Record<string, string>;
    },
  );
  const restaurant = useAccountResource(async (signal) =>
    platformMode ? loadRestaurant(signal) : null,
  );
  const { data: events, loading: eventsLoading } = useAccountResource(
    async (signal) => (platformMode ? bookingClient.listEvents(signal) : null),
  );
  const { data: payments } = useAccountResource(loadPaymentStatus);
  useEffect(() => {
    const controller = new AbortController();
    loadBranding({ signal: controller.signal })
      .then(setBranding)
      .catch(() => {
        /* Default branding stays usable when the instance is unavailable. */
      })
      .finally(() => {
        if (!controller.signal.aborted) setBrandingReady(true);
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
        : platformMode
          ? `Veranstaltungen und Gutscheine · ${name}`
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
  return (
    <BrandContext value={branding}>
      <DiscoveryContext
        value={{
          hasShop:
            catalogue?.articles.some(
              (article) => article.type === "PHYSICAL",
            ) ?? false,
          hasEvents:
            restaurant.data?.modules.events !== false && !!events?.length,
          hasVouchers:
            restaurant.data?.modules.vouchers !== false &&
            !!catalogue?.vouchers?.length,
          hasMenu: hasMenu(restaurant.data?.menu?.sections ?? []),
          locations:
            restaurant.data?.locations ?? locationData?.locations ?? [],
          ready:
            !locationsLoading &&
            !catalogueLoading &&
            !eventsLoading &&
            !restaurant.loading,
        }}
      >
        <LegalLinksContext
          value={{ links: legal ?? {}, ready: !legalLoading && brandingReady }}
        >
          <RestaurantContext
            value={{
              data: restaurant.data ?? null,
              loading: restaurant.loading,
              error: restaurant.error,
              reload: restaurant.reload,
            }}
          >
            <PaymentContext value={payments ?? null}>{children}</PaymentContext>
          </RestaurantContext>
        </LegalLinksContext>
      </DiscoveryContext>
    </BrandContext>
  );
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
      reservationLocation(
        data.locations,
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get("location"),
      )?.id ?? null,
  };
}
