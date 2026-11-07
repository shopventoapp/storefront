import { readSmallJson } from "@shopvento/ui/proxy";

export interface PublicPaymentStatus {
  online_payments_enabled: boolean;
}

export async function loadPaymentStatus(
  signal?: AbortSignal,
): Promise<PublicPaymentStatus> {
  const response = await fetch("/api/shop/payments/status", {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Payment status unavailable");
  const value = await readSmallJson(response, 4096);
  if (
    !value ||
    typeof value !== "object" ||
    !("online_payments_enabled" in value) ||
    typeof value.online_payments_enabled !== "boolean"
  )
    throw new Error("Invalid payment status");
  return { online_payments_enabled: value.online_payments_enabled };
}
