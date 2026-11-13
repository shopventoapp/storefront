import { MenuPage } from "@/components/restaurant";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/speisekarte");
export default function Page() {
  return <MenuPage />;
}
