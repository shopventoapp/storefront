import { Newsletter } from "@/components/commerce";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/newsletter");
export default function Page() {
  return (
    <div className="wrap page-content">
      <div className="page-intro">
        <h1>News from the atelier</h1>
        <p>
          New dates and fresh ideas for your next break. Unsubscribe whenever
          you like.
        </p>
      </div>
      <Newsletter />
    </div>
  );
}
