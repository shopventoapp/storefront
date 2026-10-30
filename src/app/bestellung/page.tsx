import { Commerce } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/bestellung", "Your order");
export default function Page() {
  return <Commerce path="/bestellung" />;
}
