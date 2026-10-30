import { AccountPage } from "@/components/account";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/konto", "Dein Konto");
export default function Page() {
  return (
    <div className="wrap page-content">
      <AccountPage />
    </div>
  );
}
