import { UpcomingEvents } from "@/components/events";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("/");

export default function Home() {
  return (
    <>
      <section className="home-programme">
        <div className="wrap programme-grid">
          <div className="welcome">
            <h1>
              Gute Zeit.
              <br />
              Neue <em>Entdeckungen.</em>
            </h1>
            <p>
              Mit den Händen arbeiten, gemeinsam probieren und den Alltag kurz
              vor der Tür lassen. Entdecke Dein nächstes Erlebnis bei uns.
            </p>
            <a className="button button-coral" href="/events">
              Dein Erlebnis finden <span aria-hidden="true">↗</span>
            </a>
            <p className="small-note">Workshops · Verkostungen · Touren</p>
          </div>
          <div className="programme">
            <h2>Demnächst im Atelier</h2>
            <UpcomingEvents compact />
            <a className="text-link" href="/events">
              Alle Termine entdecken <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>
      <section className="wrap discover">
        <div>
          <h2>
            Etwas Schönes
            <br />
            weitergeben.
          </h2>
          <p>
            Für jemanden, der gern Neues ausprobiert. Oder für die nächste
            gemeinsame Auszeit.
          </p>
          <a className="text-link" href="/gutscheine">
            Zeit verschenken <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="gift-panel">
          <p>
            Die besten Dinge
            <br />
            erlebt man <em>zusammen.</em>
          </p>
          <a className="button" href="/gutscheine">
            Zu den Gutscheinen
          </a>
        </div>
      </section>
      <section className="wrap closing">
        <h2>Ein bisschen Atelier für zu Hause.</h2>
        <p>
          Im Shop findest Du kleine Entdeckungen, mit denen die Freude nach dem
          Erlebnis weitergeht.
        </p>
        <a className="text-link" href="/shop">
          Im Shop stöbern <span aria-hidden="true">→</span>
        </a>
      </section>
    </>
  );
}
