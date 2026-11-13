"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { EmbedBridge } from "./embed-bridge";
import { useResource } from "./embed-resource";

const Flow = dynamic(() => import("./embed-flow"), {
  ssr: false,
  loading: () => <p role="status">Buchung wird geladen …</p>,
});
const Voucher = dynamic(() => import("./embed-voucher"), { ssr: false });
const Inquiry = dynamic(() => import("./embed-inquiry"), { ssr: false });
export function EmbedBooking() {
  const params = useSearchParams();
  const location = params.get("location") || "";
  const offered = params.get("service") || "both";
  const [selected, setSelected] = useState("");
  const {
    data: settings,
    loading,
    error,
  } = useResource(async (signal) => {
    const response = await fetch("/api/shop/settings", {
      signal,
      credentials: "omit",
    });
    if (!response.ok) throw new Error("Unavailable");
    return response.json() as Promise<{
      guest_address?: "du" | "sie";
      guest_shop_checkout_enabled?: boolean;
    }>;
  });
  const formal = settings?.guest_address === "sie";
  if (
    !/^[1-9]\d*$/.test(location) ||
    !Number.isSafeInteger(Number(location)) ||
    !["table", "tasting", "both", "voucher", "private", "all"].includes(
      offered,
    ) ||
    (params.has("lang") && params.get("lang") !== "de")
  )
    return <p role="status">Dieses Angebot ist gerade nicht verfügbar.</p>;
  if (loading) return <p role="status">Angebote werden geladen …</p>;
  if (error || !settings)
    return <p role="status">Dieses Angebot ist gerade nicht verfügbar.</p>;
  const services = [
    { key: "table", label: "Tisch reservieren" },
    { key: "tasting", label: "Veranstaltung buchen" },
    { key: "voucher", label: "Gutschein kaufen" },
    { key: "private", label: "Private Veranstaltung anfragen" },
  ].filter(
    (item) =>
      (item.key !== "voucher" ||
        settings.guest_shop_checkout_enabled === true) &&
      (offered === "all" ||
        offered === item.key ||
        (offered === "both" && ["table", "tasting"].includes(item.key))),
  );
  const active = services.some((item) => item.key === selected) ? selected : "";
  return (
    <>
      <EmbedBridge />
      <nav aria-label="Angebot auswählen">
        {services.map((item) => (
          <button
            type="button"
            className="button"
            key={item.key}
            aria-pressed={active === item.key}
            onClick={() => {
              setSelected(item.key);
              window.dispatchEvent(
                new CustomEvent("shopvento:embed", {
                  detail: { event: "booking_started", service: item.key },
                }),
              );
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {active === "voucher" ? (
        <Voucher />
      ) : active === "private" ? (
        <Inquiry locationId={Number(location)} />
      ) : active ? (
        <Flow service={active} formal={formal} />
      ) : (
        <p>
          {services.length === 0
            ? "Dieses Angebot ist gerade nicht verfügbar."
            : formal
              ? "Wählen Sie Ihr Angebot, um zu starten."
              : "Wähle Dein Angebot, um zu starten."}
        </p>
      )}
      <p>
        <a href="/konto" target="_blank" rel="noopener">
          Anmelden
        </a>{" "}
        ·{" "}
        <a href="/datenschutz" target="_blank" rel="noopener">
          Datenschutz
        </a>{" "}
        ·{" "}
        <a href="/agb" target="_blank" rel="noopener">
          AGB
        </a>
      </p>
    </>
  );
}
