import { notFound } from "next/navigation";
import { LocationsPage } from "@/components/restaurant";
import { pageMetadata } from "@/lib/metadata";
import { platformMode } from "@/lib/platform";
export const metadata = pageMetadata("/standorte");
export default function Page() {
  if (!platformMode) notFound();
  return <LocationsPage />;
}
