import { Reservation } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/reservierung");
export default function Page() {
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>Ein Platz für Dich</h1>
        <p>
          Plane Deinen nächsten Besuch. Verfügbare Zeiten und Plätze findest Du
          hier.
        </p>
      </div>
      <Reservation />
    </div>
  );
}
