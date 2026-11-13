"use client";

import { UpcomingEvents } from "./events";
import { TodayHours } from "./restaurant";
import { BrandName, useDiscovery, useRestaurant } from "./runtime";

/** Tenant data is read in RuntimeProvider after hydration, never during export. */
export function GastroHome() {
  const { hasShop, hasEvents, hasVouchers, hasMenu, locations, ready } =
    useDiscovery();
  const { data: restaurant } = useRestaurant();
  const reservation = locations.find(
    (location) => location.table_reservations_enabled,
  );
  const location = reservation ?? locations[0];
  const publicLocation = restaurant?.locations.find(
    (row) => row.id === location?.id,
  );
  const city = [location?.location_postal_code, location?.location_city]
    .filter(Boolean)
    .join(" ");
  const address = location?.location_street || city;
  return (
    <>
      <section className="home-programme">
        <div className="wrap programme-grid">
          <div className="welcome">
            <h1>
              <BrandName />
            </h1>
            {restaurant?.company.name ? (
              <p>
                {restaurant.company.name}
                {restaurant.company.city && ` in ${restaurant.company.city}`}.
                Schön, dass Du da bist.
              </p>
            ) : (
              <p>Plane Deinen Besuch und entdecke, was als Nächstes ansteht.</p>
            )}
            {publicLocation && <TodayHours location={publicLocation} />}
            <div
              className="gastro-actions"
              data-ready={ready}
              aria-busy={!ready}
            >
              {reservation && (
                <a className="button button-coral" href="/reservierung">
                  Tisch reservieren
                </a>
              )}
              {hasEvents && (
                <a
                  className={reservation ? "text-link" : "button button-coral"}
                  href="/events"
                >
                  Veranstaltungen
                </a>
              )}
              {hasVouchers && (
                <a className="text-link" href="/gutscheine">
                  Gutschein verschenken
                </a>
              )}
            </div>
          </div>
          {hasEvents ? (
            <div className="programme">
              <h2>Kommende Veranstaltungen</h2>
              <UpcomingEvents compact />
              <a className="text-link" href="/events">
                Alle Veranstaltungen <span aria-hidden="true">→</span>
              </a>
            </div>
          ) : (
            (hasMenu || !!restaurant?.locations.length) && (
              <div className="programme">
                {hasMenu && (
                  <>
                    <h2>Unsere Speisekarte</h2>
                    <p>Entdecke unsere Speisen und Getränke.</p>
                    <a className="text-link" href="/speisekarte">
                      Zur Speisekarte <span aria-hidden="true">→</span>
                    </a>
                  </>
                )}
                {!!restaurant?.locations.length && (
                  <p>
                    <a className="text-link" href="/standorte">
                      Dein Weg zu uns <span aria-hidden="true">→</span>
                    </a>
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </section>
      {hasVouchers && (
        <section className="wrap discover">
          <div>
            <h2>Gutscheine verschenken</h2>
            <p>
              Mach jemandem eine Freude mit einem Gutschein für gemeinsame Zeit.
            </p>
            <a className="text-link" href="/gutscheine">
              Gutscheine entdecken <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="gift-panel">
            <p>Zeit gemeinsam genießen.</p>
            <a className="button" href="/gutscheine">
              Gutschein auswählen
            </a>
          </div>
        </section>
      )}
      {reservation && (
        <section className="wrap closing">
          <h2>Tisch reservieren</h2>
          <p>Wähle einen Termin und die Anzahl Deiner Gäste.</p>
          <a className="button button-coral" href="/reservierung">
            Tisch reservieren
          </a>
        </section>
      )}
      {address && (
        <section className="wrap closing">
          <h2>Hier findest Du uns</h2>
          <address className="legal-address">
            {location?.location_name && (
              <>
                <strong>{location.location_name}</strong>
                <br />
              </>
            )}
            {location?.location_street && (
              <>
                {location.location_street}
                <br />
              </>
            )}
            {city}
          </address>
          {!!restaurant?.locations.length && (
            <a className="text-link" href="/standorte">
              Öffnungszeiten und Anfahrt <span aria-hidden="true">→</span>
            </a>
          )}
        </section>
      )}
      {hasShop && (
        <section className="wrap closing" data-testid="home-shop">
          <h2>Entdecke unseren Shop</h2>
          <p>Hier findest Du unsere Produkte.</p>
          <a className="text-link" href="/shop">
            Zum Shop <span aria-hidden="true">→</span>
          </a>
        </section>
      )}
    </>
  );
}
