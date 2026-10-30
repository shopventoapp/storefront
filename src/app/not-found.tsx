export default function NotFound() {
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>This page is out of reach.</h1>
        <p>
          This page does not exist. Explore our upcoming experiences instead.
        </p>
      </div>
      <a className="button" href="/events">
        Explore experiences
      </a>
    </div>
  );
}
