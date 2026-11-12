import type { PublicPaymentStatus } from "@/lib/payment-status";
import { platformMode } from "@/lib/platform";
export function PaymentAvailabilityNotice({
  status,
}: {
  status: PublicPaymentStatus | null;
}) {
  if (status?.online_payments_enabled !== false) return null;
  return (
    <p className="state" role="status">
      {platformMode ? (
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
