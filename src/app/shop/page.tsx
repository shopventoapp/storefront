import { Commerce } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/shop", "Discoveries for your home");
export default function Page() {
  return <Commerce path="/shop" />;
}
