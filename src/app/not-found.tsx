import { platformMode } from "@/lib/platform";
import SiteLayout from "./(site)/layout";
export default function NotFound() {
  return (
    <SiteLayout>
      <div className="wrap page-content">
        <div className="page-intro">
          <h1>
            {platformMode
              ? "Seite nicht gefunden"
              : "This page is out of reach."}
          </h1>
          <p>
            {platformMode
              ? "Diese Seite gibt es nicht. Entdecke unsere kommenden Veranstaltungen."
              : "This page does not exist. Explore our upcoming experiences instead."}
          </p>
        </div>
        <a className="button" href="/events">
          {platformMode ? "Veranstaltungen entdecken" : "Explore experiences"}
        </a>
      </div>
    </SiteLayout>
  );
}
