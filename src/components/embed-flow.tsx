"use client";

import {
  createBookingClient,
  DateList,
  ReservationForm,
} from "@shopvento/ui/booking";
import { loadBranding } from "@shopvento/ui/branding";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loadPaymentStatus } from "@/lib/payment-status";
import { useResource as useAccountResource } from "./embed-resource";
import { PaymentAvailabilityNotice } from "./payment-availability";

const EventBooking = dynamic(() => import("./embed-event"), { ssr: false });

const client = createBookingClient({ baseUrl: "", credentials: "omit" });
function Unavailable({ formal = false }: { formal?: boolean }) {
  return (
    <div role="status">
      <h1>Aktuell keine Buchung möglich</h1>
      <p>
        {formal
          ? "Dieses Angebot ist gerade nicht verfügbar. Bitte versuchen Sie es später erneut."
          : "Dieses Angebot ist gerade nicht verfügbar. Bitte versuche es später erneut."}
      </p>
    </div>
  );
}

export default function EmbedFlow({
  service: selectedService,
  formal = false,
}: {
  service: string;
  formal?: boolean;
}) {
  const params = useSearchParams();
  const value = params.get("location") ?? "";
  const locationId =
    /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
      ? Number(value)
      : null;
  const service = selectedService;
  const valid =
    locationId !== null &&
    ["table", "tasting", "both"].includes(service) &&
    (!params.has("lang") || params.get("lang") === "de");
  if (!valid) return <Unavailable formal={formal} />;
  return (
    <Booking
      key={`${locationId}:${service}`}
      locationId={locationId}
      service={service}
      formal={formal}
    />
  );
}

function Booking({
  locationId,
  service,
  formal = false,
}: {
  locationId: number;
  service: string;
  formal?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  useEffect(() => {
    const update = () => {
      for (const link of root.current?.querySelectorAll("a[href]") ?? []) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
      }
    };
    update();
    const observer = new MutationObserver(update);
    if (root.current)
      observer.observe(root.current, { childList: true, subtree: true });
    return () => observer.disconnect();
  });
  const [eventId, setEventId] = useState<number | null>(null);
  const { data, loading, error } = useAccountResource(async (signal) => {
    const [{ locations }, settings, branding, legal, payments] =
      await Promise.all([
        client.listLocations(signal),
        client.getSettings(signal),
        loadBranding({ signal }).catch(() => ({})),
        fetch("/api/shop/legal", {
          signal,
          credentials: "omit",
          redirect: "manual",
        })
          .then(async (r): Promise<Record<string, unknown>> => {
            const value: unknown = r.ok ? await r.json() : {};
            return value && typeof value === "object" && !Array.isArray(value)
              ? (value as Record<string, unknown>)
              : {};
          })
          .catch((): Record<string, unknown> => ({})),
        loadPaymentStatus(signal, "omit").catch(() => null),
      ]);
    const location = locations.find((item) => item.id === locationId);
    if (!location) return null;
    const events =
      service !== "table" && settings.guest_booking_enabled
        ? await client.listEvents(signal)
        : [];
    const { timewindows } = events.length
      ? await client.listLocationTimewindows(locationId, { signal })
      : { timewindows: [] };
    return {
      location,
      settings,
      branding,
      legal,
      payments,
      timewindows: timewindows.filter(
        (slot) =>
          slot.franchise_location_id === locationId &&
          events.some((event) => event.tasting_id === slot.tasting_id),
      ),
      events: events.filter((event) =>
        timewindows.some(
          (slot) =>
            slot.tasting_id === event.tasting_id &&
            slot.franchise_location_id === locationId,
        ),
      ),
    };
  });
  if (loading) return <p role="status">Buchung wird geladen …</p>;
  if (error || !data) return <Unavailable formal={formal} />;
  const table =
    service !== "tasting" && data.location.table_reservations_enabled === true;
  const tasting = service !== "table" && data.events.length > 0;
  if (!table && !tasting) return <Unavailable formal={formal} />;
  const termsUrl = publicHref(
    data.legal.terms_url || (data.branding as { terms_url?: string }).terms_url,
    "/agb",
  );
  const privacyUrl = publicHref(
    data.legal.privacy_url ||
      (data.branding as { privacy_url?: string }).privacy_url,
    "/datenschutz",
  );
  return (
    <div ref={root}>
      <h1>{data.location.location_name || "Deine Buchung"}</h1>
      {table && (
        <section aria-label="Tisch reservieren">
          <h2>Tisch reservieren</h2>
          <ReservationForm
            onOutcome={(status) =>
              window.dispatchEvent(
                new CustomEvent("shopvento:embed", {
                  detail: {
                    event:
                      status === "confirmed"
                        ? "booking_confirmed"
                        : "booking_pending",
                    service: "table",
                  },
                }),
              )
            }
            locale="de"
            accountEnabled={false}
            siteKey={data.settings.turnstile_site_key ?? ""}
            publicApi={async () => ({ shopvento: true, locationId })}
            termsEnabled
            termsUrl={termsUrl}
            privacyUrl={privacyUrl}
          />
        </section>
      )}
      {tasting && (
        <section aria-label="Veranstaltung buchen">
          <h2>Veranstaltung buchen</h2>
          <PaymentAvailabilityNotice status={data.payments} />
          <DateList
            locale="de"
            windows={data.timewindows}
            events={data.events}
            locations={[data.location]}
            leadHours={data.settings.online_lead_hours ?? 24}
            onSelect={(slot) => setEventId(slot.tasting_id)}
          />
          <p>Die Zahlung öffnet sich in einem neuen Fenster.</p>
          {checkoutUrl && (
            <p role="status">
              <a href={checkoutUrl} target="_blank" rel="noopener">
                Weiter zur Zahlung
              </a>
            </p>
          )}
          {eventId && (
            <EventBooking
              onOutcome={(status) =>
                window.dispatchEvent(
                  new CustomEvent("shopvento:embed", {
                    detail: {
                      event:
                        status === "confirmed"
                          ? "booking_confirmed"
                          : "booking_pending",
                      service: "tasting",
                    },
                  }),
                )
              }
              onRedirect={(url) => {
                setCheckoutUrl(url);
                window.open(url, "_blank", "noopener");
              }}
              key={eventId}
              client={client}
              baseUrl=""
              credentials="omit"
              eventId={eventId}
              locationId={locationId}
              mode="guest"
              locale="de"
              termsUrl={termsUrl}
              privacyUrl={privacyUrl}
              turnstileSiteKey={data.settings.turnstile_site_key ?? undefined}
            />
          )}
        </section>
      )}
    </div>
  );
}

function publicHref(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  try {
    const url = new URL(value, window.location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
}
