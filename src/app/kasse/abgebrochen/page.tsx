import { Commerce } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "/kasse/abgebrochen",
  "Payment interrupted",
);
export default function Page() {
  return <Commerce path="/kasse/abgebrochen" />;
}
