"use client";

import {
  createBookingClient,
  EventBooking,
  useAccountResource,
} from "@shopvento/ui";
import { ReservationForm } from "@shopvento/ui/forms";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { publicHref, useBranding, useLegalLinks } from "./runtime";

const client = createBookingClient({ baseUrl: "", credentials: "omit" });
function Unavailable() {
  return (
    <div role="status">
      <h1>Aktuell keine Buchung möglich</h1>
      <p>
        Dieses Angebot ist gerade nicht verfügbar. Bitte versuche es später
        erneut.
      </p>
    </div>
  );
}

export function EmbedBooking() {
  const params = useSearchParams();
  const value = params.get("location") ?? "";
  const locationId =
    /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
      ? Number(value)
      : null;
  const service = params.get("service") ?? "both";
  const valid =
    locationId !== null &&
    ["table", "tasting", "both"].includes(service) &&
    (!params.has("lang") || params.get("lang") === "de");
  if (!valid) return <Unavailable />;
  return (
    <Booking
      key={`${locationId}:${service}`}
      locationId={locationId}
      service={service}
    />
  );
}

function Booking({
  locationId,
  service,
}: {
  locationId: number;
  service: string;
}) {
  const brand = useBranding();
  const legal = useLegalLinks();
  const [eventId, setEventId] = useState<number | null>(null);
  const { data, loading, error } = useAccountResource(async (signal) => {
    const [{ locations }, settings] = await Promise.all([
      client.listLocations(signal),
      client.getSettings(signal),
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
  if (error || !data) return <Unavailable />;
  const table =
    service !== "tasting" && data.location.table_reservations_enabled === true;
  const tasting = service !== "table" && data.events.length > 0;
  if (!table && !tasting) return <Unavailable />;
  const termsUrl = publicHref(legal.terms_url || brand.terms_url, "/agb");
  const privacyUrl = publicHref(
    legal.privacy_url || brand.privacy_url,
    "/datenschutz",
  );
  return (
    <>
      <h1>{data.location.location_name || "Deine Buchung"}</h1>
      {table && (
        <section aria-label="Tisch reservieren">
          <h2>Tisch reservieren</h2>
          <ReservationForm
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
          <label htmlFor="embed-event">Veranstaltung</label>
          <select
            id="embed-event"
            value={eventId ?? ""}
            onChange={(event) => setEventId(Number(event.target.value) || null)}
          >
            <option value="">Bitte auswählen</option>
            {data.events
              .filter(
                (event, index, events) =>
                  events.findIndex(
                    (item) => item.tasting_id === event.tasting_id,
                  ) === index,
              )
              .map((event) => (
                <option key={event.tasting_id} value={event.tasting_id}>
                  {event.tasting_name}
                </option>
              ))}
          </select>
          {eventId && (
            <EventBooking
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
    </>
  );
}
