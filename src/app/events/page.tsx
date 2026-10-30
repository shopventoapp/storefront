import { Suspense } from "react";
import { EventsPage } from "@/components/events";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/events");
export default function Page() {
  return (
    <Suspense fallback={<p className="wrap state">Loading experiences …</p>}>
      <EventsPage />
    </Suspense>
  );
}
