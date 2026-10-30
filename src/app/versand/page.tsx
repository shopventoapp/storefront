import { Commerce } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/versand", "Versand & Abholung");
export default function Page() {
  return <Commerce path="/versand" />;
}
