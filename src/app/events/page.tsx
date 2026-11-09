import { Suspense } from "react";
import { EventsPage } from "@/components/events";
import { pageMetadata } from "@/lib/metadata";
import { platformMode } from "@/lib/platform";
export const metadata = pageMetadata("/events");
export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="wrap state">
          {platformMode
            ? "Veranstaltungen werden geladen …"
            : "Loading experiences …"}
        </p>
      }
    >
      <EventsPage />
    </Suspense>
  );
}
