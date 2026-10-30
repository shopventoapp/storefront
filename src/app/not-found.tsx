export default function NotFound() {
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>Hier geht es gerade nicht weiter.</h1>
        <p>
          Diese Seite gibt es nicht. Entdecke stattdessen die nächsten
          Erlebnisse.
        </p>
      </div>
      <a className="button" href="/events">
        Zu den Erlebnissen
      </a>
    </div>
  );
}
