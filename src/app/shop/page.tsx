import { Commerce } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/shop", "Entdeckungen für zu Hause");
export default function Page() {
  return <Commerce path="/shop" />;
}
