import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/agb");
export default function Page() {
  return (
    <article className="wrap legal page-content">
      <div className="page-intro">
        <h1>Allgemeine Geschäftsbedingungen</h1>
        <p>Platzhalter für die Demo</p>
      </div>
      <h2>Vor Veröffentlichung ersetzen</h2>
      <p>
        Dies ist kein rechtsgültiger Text. Ergänze hier die für Dein Angebot
        erforderlichen Angaben und lasse sie fachlich prüfen. Dieses fiktive
        Atelier hat keine echte Anschrift oder Kontaktadresse.
      </p>
      <p>
        Die verbundenen Instanzeinstellungen können auf Deine eigenen
        rechtlichen Seiten verweisen.
      </p>
      <a className="text-link" href="/">
        Zur Startseite
      </a>
    </article>
  );
}
