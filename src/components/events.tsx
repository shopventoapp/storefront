"use client";

import {
  createAccountClient,
  DateList,
  EventBooking,
  useAccountResource,
  useAccountSession,
} from "@shopvento/ui";
import { useSearchParams } from "next/navigation";
import { bookingClient, publicHref, useBranding } from "./runtime";

const accountClient = createAccountClient();

export function UpcomingEvents({ compact = false }: { compact?: boolean }) {
  const { data, error, loading, reload } = useAccountResource(
    async (signal) => {
      const [events, { locations }, settings] = await Promise.all([
        bookingClient.listEvents(signal),
        bookingClient.listLocations(signal),
        bookingClient.getSettings(signal),
      ]);
      const result = await Promise.all(
        locations.map((location) =>
          bookingClient.listLocationTimewindows(location.id, { signal }),
        ),
      );
      return {
        events,
        locations,
        settings,
        windows: result
          .flatMap((result) => result.timewindows)
          .sort((a, b) =>
            `${a.date}T${a.start_time}`.localeCompare(
              `${b.date}T${b.start_time}`,
            ),
          ),
      };
    },
  );
  if (loading)
    return (
      <p className="state" role="status">
        Die nächsten Erlebnisse werden geladen …
      </p>
    );
  if (error)
    return (
      <div className="state" role="status">
        <p>
          Die Termine sind gerade nicht erreichbar. Bitte versuche es noch
          einmal.
        </p>
        <button type="button" className="text-button" onClick={reload}>
          Termine erneut laden
        </button>
      </div>
    );
  if (!data?.windows.length)
    return (
      <p className="state">
        Neue Termine sind in Planung. Im <a href="/newsletter">Newsletter</a>{" "}
        erfährst Du davon.
      </p>
    );
  return (
    <DateList
      windows={compact ? data.windows.slice(0, 3) : data.windows}
      events={data.events}
      locations={data.locations}
      leadHours={data.settings.online_lead_hours ?? 24}
      onSelect={(window) => {
        windowNavigate(`/events?event=${window.tasting_id}`);
      }}
    />
  );
}

function windowNavigate(path: string) {
  window.location.assign(path);
}

export function EventsPage() {
  const session = useAccountSession(accountClient);
  const params = useSearchParams();
  const brand = useBranding();
  const value = params.get("event");
  const eventId = value && /^\d+$/.test(value) ? Number(value) : null;
  const { data } = useAccountResource((signal) =>
    bookingClient.getSettings(signal),
  );
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>{eventId ? "Dein nächstes Erlebnis" : "Erlebnisse & Termine"}</h1>
        <p>
          {eventId
            ? "Wähle Deinen Termin und sichere Dir einen Platz. Wir freuen uns auf Dich."
            : "Etwas Neues lernen, gemeinsam probieren, die Umgebung entdecken. Hier findest Du die nächsten Termine."}
        </p>
      </div>
      {eventId ? (
        <div className="booking-area">
          <a className="text-link" href="/events">
            Alle Erlebnisse ansehen
          </a>
          {session.loading ? (
            <p className="state" role="status">
              Dein Zugang wird geladen …
            </p>
          ) : (
            <EventBooking
              key={eventId}
              client={bookingClient}
              baseUrl=""
              credentials="same-origin"
              eventId={eventId}
              mode={session.authenticated ? "account" : "guest"}
              termsUrl={publicHref(brand.terms_url, "/agb")}
              privacyUrl={publicHref(brand.privacy_url, "/datenschutz")}
              turnstileSiteKey={data?.turnstile_site_key ?? undefined}
            />
          )}
        </div>
      ) : (
        <UpcomingEvents />
      )}
    </div>
  );
}
