import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/gutscheine");
export default function Page() {
  return (
    <>
      <div className="wrap page-intro">
        <h1>Give time together</h1>
        <p>
          A voucher gives something to look forward to. The recipient chooses
          the moment that suits them.
        </p>
      </div>
      <div className="wrap page-content">
        <a className="button" href="/shop/gutscheine">
          Explore vouchers
        </a>
      </div>
    </>
  );
}
