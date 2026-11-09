import { Newsletter } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
import { platformMode } from "@/lib/platform";
export const metadata = pageMetadata("/newsletter");
export default function Page() {
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>{platformMode ? "Neuigkeiten" : "News from the atelier"}</h1>
        <p>
          {platformMode
            ? "Erhalte Neuigkeiten und Termine per E-Mail. Du kannst Dich jederzeit abmelden."
            : "New dates and fresh ideas for your next break. Unsubscribe whenever you like."}
        </p>
      </div>
      <Newsletter />
    </div>
  );
}
