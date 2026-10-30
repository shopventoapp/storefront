import { Commerce } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "/kasse/abgebrochen",
  "Zahlung unterbrochen",
);
export default function Page() {
  return <Commerce path="/kasse/abgebrochen" />;
}
