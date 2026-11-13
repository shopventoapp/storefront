import type { PublicPaymentStatus } from "@/lib/payment-status";
import { uiLocale } from "@/lib/platform";
export function PaymentAvailabilityNotice({
  status,
  locale = uiLocale,
}: {
  status: PublicPaymentStatus | null;
  locale?: "de" | "en-GB";
}) {
  if (status?.online_payments_enabled !== false) return null;
  return (
    <p className="state" role="status">
      {locale === "de" ? (
        "Kartenzahlung ist bald verfügbar. Du kannst weiterhin Gutscheine einlösen."
      ) : (
        <>
          Card payments: <span lang="de">Bald verfügbar</span>. Voucher-only
          redemption and free reservations remain available.
        </>
      )}
    </p>
  );
}
