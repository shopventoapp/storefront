import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/gutscheine");
export default function Page() {
  return (
    <>
      <div className="wrap page-intro">
        <h1>Zeit verschenken</h1>
        <p>
          Ein Gutschein lässt Raum für Vorfreude. Den passenden Moment sucht
          sich die beschenkte Person selbst aus.
        </p>
      </div>
      <div className="wrap page-content">
        <a className="button" href="/shop/gutscheine">
          Gutscheine entdecken
        </a>
      </div>
    </>
  );
}
