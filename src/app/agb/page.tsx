import { PlatformLegalPage } from "@/components/legal";
import { pageMetadata } from "@/lib/metadata";
import { platformMode } from "@/lib/platform";
export const metadata = pageMetadata("/agb");
export default function Page() {
  if (platformMode) return <PlatformLegalPage kind="terms" title="AGB" />;
  return (
    <article className="wrap legal page-content">
      <div className="page-intro">
        <h1>Terms and conditions</h1>
        <p>Demo placeholder</p>
      </div>
      <h2>Replace before publishing</h2>
      <p>
        This is a demo placeholder. Add the information required for your
        business and have it reviewed before publishing. This fictional atelier
        has no real address or contact details.
      </p>
      <p>
        The connected installation settings can link to your own legal pages.
      </p>
      <a className="text-link" href="/">
        Back to home
      </a>
    </article>
  );
}
