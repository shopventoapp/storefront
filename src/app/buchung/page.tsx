import { BookingReturn } from "@/components/booking-return";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/buchung", "Your booking");
export default function Page() {
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>Your booking</h1>
      </div>
      <BookingReturn />
    </div>
  );
}
