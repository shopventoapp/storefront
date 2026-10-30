import { Reservation } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/reservierung");
export default function Page() {
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>A place for you</h1>
        <p>Plan your next visit. Find available times and places here.</p>
      </div>
      <Reservation />
    </div>
  );
}
