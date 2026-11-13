import { notFound } from "next/navigation";
import { MenuPage } from "@/components/restaurant";
import { pageMetadata } from "@/lib/metadata";
import { platformMode } from "@/lib/platform";
export const metadata = pageMetadata("/speisekarte");
export default function Page() {
  if (!platformMode) notFound();
  return <MenuPage />;
}
