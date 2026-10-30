import { Commerce } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/bestellung", "Deine Bestellung");
export default function Page() {
  return <Commerce path="/bestellung" />;
}
