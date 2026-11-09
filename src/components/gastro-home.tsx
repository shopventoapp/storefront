"use client";

import { UpcomingEvents } from "./events";
import { BrandName, useDiscovery } from "./runtime";

/** Tenant data is read in RuntimeProvider after hydration, never during export. */
export function GastroHome() {
  const { hasShop, locations } = useDiscovery();
  const reservation = locations.find(
    (location) => location.table_reservations_enabled,
  );
  const location = reservation ?? locations[0];
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
            <p>Plane Deinen Besuch und entdecke, was als Nächstes ansteht.</p>
            <div className="gastro-actions">
              {reservation && (
                <a className="button button-coral" href="/reservierung">
                  Tisch reservieren
                </a>
              )}
              <a
                className={reservation ? "text-link" : "button button-coral"}
                href="/events"
              >
                Veranstaltungen
              </a>
            </div>
          </div>
          <div className="programme">
            <h2>Kommende Veranstaltungen</h2>
            <UpcomingEvents compact />
            <a className="text-link" href="/events">
              Alle Veranstaltungen <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>
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
      {reservation && (
        <section className="wrap closing">
          <h2>Plane Deinen Besuch</h2>
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
