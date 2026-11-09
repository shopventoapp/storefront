"use client";

import {
  createAccountClient,
  DateList,
  EventBooking,
  useAccountResource,
  useAccountSession,
} from "@shopvento/ui";
import { useSearchParams } from "next/navigation";
import { platformMode, uiLocale } from "@/lib/platform";
import { englishBookingLabels } from "@/lib/ui-english";
import {
  bookingClient,
  PaymentAvailability,
  publicHref,
  useBranding,
} from "./runtime";

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
        {platformMode
          ? "Veranstaltungen werden geladen …"
          : "Loading upcoming experiences …"}
      </p>
    );
  if (error)
    return (
      <div className="state" role="status">
        <p>
          {platformMode
            ? "Termine sind gerade nicht verfügbar. Bitte versuche es erneut."
            : "Dates are currently unavailable. Please try again."}
        </p>
        <button type="button" className="text-button" onClick={reload}>
          {platformMode ? "Termine neu laden" : "Reload dates"}
        </button>
      </div>
    );
  if (!data?.windows.length)
    return (
      <p className="state">
        {platformMode ? (
          "Aktuell gibt es keine kommenden Veranstaltungen."
        ) : (
          <>
            New dates are on the way. Subscribe to our{" "}
            <a href="/newsletter">Newsletter</a> for updates.
          </>
        )}
      </p>
    );
  return (
    <DateList
      locale={uiLocale}
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
        <h1>
          {platformMode
            ? "Veranstaltungen"
            : eventId
              ? "Your next experience"
              : "Experiences & dates"}
        </h1>
        <p>
          {platformMode
            ? "Wähle Deinen Termin und buche Deinen Platz."
            : eventId
              ? "Choose your date and book a place. We look forward to seeing you."
              : "Learn something new, taste together and explore the neighbourhood. Find your next date here."}
        </p>
      </div>
      {eventId ? (
        <div className="booking-area">
          <PaymentAvailability />
          <a className="text-link" href="/events">
            {platformMode ? "Alle Veranstaltungen" : "View all experiences"}
          </a>
          {session.loading ? (
            <p className="state" role="status">
              {platformMode
                ? "Dein Konto wird geladen …"
                : "Loading your account …"}
            </p>
          ) : (
            <EventBooking
              labels={platformMode ? undefined : englishBookingLabels}
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
