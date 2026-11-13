"use client";

import { useEffect, useState } from "react";
import {
  address,
  berlinDate,
  dayWindows,
  intervalLabel,
  type MenuSection,
  type RestaurantLocation,
  weekdays,
} from "@/lib/restaurant";
import { publicHref, useRestaurant } from "./runtime";

export function TodayHours({ location }: { location: RestaurantLocation }) {
  const [date, setDate] = useState<string>();
  useEffect(() => {
    const update = () => setDate(berlinDate(new Date()));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);
  if (!date) return null;
  const windows = dayWindows(location, date);
  return (
    <p className="today-hours">
      <strong>Heute:</strong>{" "}
      {windows === null
        ? "Öffnungszeiten auf Anfrage"
        : windows.length
          ? windows
              .map(([opens, closes]) => `${opens} - ${closes} Uhr`)
              .join(" · ")
          : "Geschlossen"}
    </p>
  );
}

function ContentState() {
  const { loading, error, reload } = useRestaurant();
  if (loading) return <p role="status">Wird geladen …</p>;
  if (error)
    return (
      <div role="status">
        <p>Diese Angaben sind gerade nicht verfügbar.</p>
        <button type="button" className="text-button" onClick={reload}>
          Erneut laden
        </button>
      </div>
    );
  return null;
}

const euros = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});
function MenuGroup({
  section,
  nested = false,
}: {
  section: MenuSection;
  nested?: boolean;
}) {
  if (
    !section.items.length &&
    !section.subsections?.some((row) => row.items.length)
  )
    return null;
  const Heading = nested ? "h3" : "h2";
  const ItemHeading = nested ? "h4" : "h3";
  return (
    <section className="menu-group">
      <Heading>{section.title}</Heading>
      {section.intro_md && (
        <p className="restaurant-copy">{section.intro_md}</p>
      )}
      <ul className="menu-items">
        {section.items.map((item) => (
          <li key={item.token}>
            <div className="menu-item-heading">
              <ItemHeading className="menu-item-title">{item.name}</ItemHeading>
              <div className="menu-prices">
                {item.prices.map((price, index) => (
                  <span key={`${price.label}-${index}`}>
                    {price.label && (
                      <span className="price-label">{price.label} </span>
                    )}
                    {euros.format(price.preis)}
                  </span>
                ))}
              </div>
            </div>
            {item.beschreibung_md && (
              <p className="restaurant-copy">{item.beschreibung_md}</p>
            )}
            {item.allergene && (
              <p className="menu-hints">Allergene: {item.allergene}</p>
            )}
            {item.zusatzstoffe && (
              <p className="menu-hints">Zusatzstoffe: {item.zusatzstoffe}</p>
            )}
          </li>
        ))}
      </ul>
      {section.subsections?.map((row) => (
        <MenuGroup key={row.id} section={row} nested />
      ))}
    </section>
  );
}

export function MenuPage() {
  const { data, loading, error } = useRestaurant();
  return (
    <div className="wrap restaurant-page">
      <h1>Speisekarte</h1>
      <ContentState />
      {!loading &&
        !error &&
        (data?.menu?.total_items ? (
          <>
            <p>
              Entdecke unsere Speisen und Getränke. Alle Preise verstehen sich
              inklusive Mehrwertsteuer.
            </p>
            {data.menu.sections.map((section) => (
              <MenuGroup key={section.id} section={section} />
            ))}
            <p className="menu-hints">
              Bei Fragen zu Allergenen und Zusatzstoffen sprich uns bitte vor
              Deiner Bestellung an.
            </p>
          </>
        ) : (
          <p>Aktuell ist keine Speisekarte veröffentlicht.</p>
        ))}
    </div>
  );
}

function displayDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
function LocationHours({ location }: { location: RestaurantLocation }) {
  return (
    <div>
      <h3>Öffnungszeiten</h3>
      <TodayHours location={location} />
      {location.opening_intervals !== null && (
        <dl className="opening-hours">
          {weekdays.map((day, index) => {
            const rows =
              location.opening_intervals
                ?.filter((row) => row.weekday === index)
                .sort((a, b) => a.opens.localeCompare(b.opens)) ?? [];
            return (
              <div key={day}>
                <dt>{day}</dt>
                <dd>
                  {rows.length
                    ? rows.map((row) => (
                        <span key={row.opens}>
                          {intervalLabel(row.opens, row.closes)}
                        </span>
                      ))
                    : "Geschlossen"}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      {!!location.opening_exceptions.length && (
        <>
          <h4>Abweichende Öffnungszeiten</h4>
          <ul className="opening-exceptions">
            {location.opening_exceptions.map((row, index) => (
              <li key={`${row.from}-${index}`}>
                <strong>
                  {displayDate(row.from)}
                  {row.until !== row.from && ` bis ${displayDate(row.until)}`}
                </strong>
                <span>
                  {row.closed_from && row.closed_until
                    ? `Geschlossen: ${row.closed_from.slice(11, 16)} - ${row.closed_until.slice(11, 16)} Uhr`
                    : row.opens && row.closes
                      ? intervalLabel(row.opens, row.closes)
                      : "Geschlossen"}
                  {row.label && ` · ${row.label}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
export function LocationsPage() {
  const { data, loading, error } = useRestaurant();
  return (
    <div className="wrap restaurant-page">
      <h1>Standorte</h1>
      <ContentState />
      {!loading && !error && !data?.locations.length && (
        <p>Aktuell sind keine Standortangaben veröffentlicht.</p>
      )}
      {data?.locations.map((location) => (
        <section
          className="restaurant-location"
          id={`standort-${location.id}`}
          key={location.id}
        >
          <h2>{location.location_name}</h2>
          <div className="location-columns">
            <div>
              {address(location) && (
                <>
                  <h3>Adresse und Anfahrt</h3>
                  <address className="legal-address">
                    {location.location_street && (
                      <>
                        {location.location_street}
                        <br />
                      </>
                    )}
                    {[location.location_postal_code, location.location_city]
                      .filter(Boolean)
                      .join(" ")}
                  </address>
                  <a
                    className="text-link"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address(location))}`}
                  >
                    Anfahrt planen <span aria-hidden="true">↗</span>
                  </a>
                </>
              )}
              {location.location_phone && (
                <p>
                  <a
                    href={`tel:${location.location_phone.replace(/[^+\d]/g, "")}`}
                  >
                    {location.location_phone}
                  </a>
                </p>
              )}
              {data.company.website_url && (
                <p>
                  <a href={publicHref(data.company.website_url, "/standorte")}>
                    Website besuchen <span aria-hidden="true">↗</span>
                  </a>
                </p>
              )}
              {location.table_reservations_enabled && (
                <a
                  className="button button-coral"
                  href={`/reservierung?location=${location.id}`}
                >
                  Tisch reservieren <span aria-hidden="true">→</span>
                </a>
              )}
            </div>
            <LocationHours location={location} />
          </div>
        </section>
      ))}
    </div>
  );
}
