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
              Good times.
              <br />
              New <em>discoveries.</em>
            </h1>
            <p>
              Make something by hand, taste together and leave the everyday at
              the door. Discover your next experience with us.
            </p>
            <a className="button button-coral" href="/events">
              Find your experience <span aria-hidden="true">↗</span>
            </a>
            <p className="small-note">Workshops · Tastings · Tours</p>
          </div>
          <div className="programme">
            <h2>Coming up at the atelier</h2>
            <UpcomingEvents compact />
            <a className="text-link" href="/events">
              Explore all dates <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>
      <section className="wrap discover">
        <div>
          <h2>
            Something lovely
            <br />
            to pass on.
          </h2>
          <p>
            For someone who loves trying new things. Or for your next escape
            together.
          </p>
          <a className="text-link" href="/gutscheine">
            Give time together <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="gift-panel">
          <p>
            The best things
            <br />
            are enjoyed <em>together.</em>
          </p>
          <a className="button" href="/gutscheine">
            Explore vouchers
          </a>
        </div>
      </section>
      <section className="wrap closing">
        <h2>A little atelier for your home.</h2>
        <p>
          Find little discoveries in our shop to keep the joy going after your
          experience.
        </p>
        <a className="text-link" href="/shop">
          Browse the shop <span aria-hidden="true">→</span>
        </a>
      </section>
    </>
  );
}
