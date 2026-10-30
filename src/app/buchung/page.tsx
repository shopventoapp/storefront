import { BookingReturn } from "@/components/booking-return";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/buchung", "Deine Buchung");
export default function Page() {
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>Deine Buchung</h1>
      </div>
      <BookingReturn />
    </div>
  );
}
