import { Newsletter } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/newsletter");
export default function Page() {
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>Post aus dem Atelier</h1>
        <p>
          Neue Termine und frische Ideen für Deine nächste Auszeit. Du
          entscheidest, wann Du wieder abbestellst.
        </p>
      </div>
      <Newsletter />
    </div>
  );
}
