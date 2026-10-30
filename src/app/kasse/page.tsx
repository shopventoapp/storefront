import { Commerce } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/kasse", "Zur Kasse");
export default function Page() {
  return <Commerce path="/kasse" />;
}
