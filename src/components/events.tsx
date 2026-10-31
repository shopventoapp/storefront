"use client";

import {
  createAccountClient,
  DateList,
  EventBooking,
  useAccountResource,
  useAccountSession,
} from "@shopvento/ui";
import { useSearchParams } from "next/navigation";
import { englishBookingLabels } from "@/lib/ui-english";
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
        Loading upcoming experiences …
      </p>
    );
  if (error)
    return (
      <div className="state" role="status">
        <p>Dates are currently unavailable. Please try again.</p>
        <button type="button" className="text-button" onClick={reload}>
          Reload dates
        </button>
      </div>
    );
  if (!data?.windows.length)
    return (
      <p className="state">
        New dates are on the way. Subscribe to our{" "}
        <a href="/newsletter">Newsletter</a> for updates.
      </p>
    );
  return (
    <DateList
      locale="en"
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
        <h1>{eventId ? "Your next experience" : "Experiences & dates"}</h1>
        <p>
          {eventId
            ? "Choose your date and book a place. We look forward to seeing you."
            : "Learn something new, taste together and explore the neighbourhood. Find your next date here."}
        </p>
      </div>
      {eventId ? (
        <div className="booking-area">
          <a className="text-link" href="/events">
            View all experiences
          </a>
          {session.loading ? (
            <p className="state" role="status">
              Loading your account …
            </p>
          ) : (
            <EventBooking
              labels={englishBookingLabels}
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
