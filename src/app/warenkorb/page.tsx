import { Commerce } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/warenkorb", "Dein Warenkorb");
export default function Page() {
  return <Commerce path="/warenkorb" />;
}
