import { Reservation } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
import { platformMode } from "@/lib/platform";
export const metadata = pageMetadata("/reservierung");
export default function Page() {
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>{platformMode ? "Tisch reservieren" : "A place for you"}</h1>
        <p>
          {platformMode
            ? "Wähle einen Termin und die Anzahl Deiner Gäste."
            : "Plan your next visit. Find available times and places here."}
        </p>
      </div>
      <Reservation />
    </div>
  );
}
