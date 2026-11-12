import { Commerce } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/warenkorb", "Your cart");
export default function Page() {
  return <Commerce path="/warenkorb" />;
}
