import type { Metadata } from "next";
import { Suspense } from "react";
import { EmbedBooking } from "@/components/embed-booking";

export const metadata: Metadata = {
  title: "Deine Buchung",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main id="inhalt" className="wrap page-content embed-booking" lang="de">
      <Suspense fallback={<p role="status">Buchung wird geladen …</p>}>
        <EmbedBooking />
      </Suspense>
    </main>
  );
}
