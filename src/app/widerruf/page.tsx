import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/widerruf");
export default function Page() {
  return (
    <article className="wrap legal page-content">
      <div className="page-intro">
        <h1>Cancellation rights</h1>
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
