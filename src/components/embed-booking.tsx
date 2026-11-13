"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { EmbedBridge } from "./embed-bridge";

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
  if (
    !/^[1-9]\d*$/.test(location) ||
    !Number.isSafeInteger(Number(location)) ||
    !["table", "tasting", "both", "voucher", "private", "all"].includes(
      offered,
    ) ||
    (params.has("lang") && params.get("lang") !== "de")
  )
    return <p role="status">Dieses Angebot ist gerade nicht verfügbar.</p>;
  const services = [
    { key: "table", label: "Tisch reservieren" },
    { key: "tasting", label: "Veranstaltung buchen" },
    { key: "voucher", label: "Gutschein kaufen" },
    { key: "private", label: "Private Veranstaltung anfragen" },
  ].filter(
    (item) =>
      offered === "all" ||
      offered === item.key ||
      (offered === "both" && ["table", "tasting"].includes(item.key)),
  );
  return (
    <>
      <EmbedBridge />
      <nav aria-label="Angebot auswählen">
        {services.map((item) => (
          <button
            type="button"
            className="button"
            key={item.key}
            aria-pressed={selected === item.key}
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
      {selected === "voucher" ? (
        <Voucher />
      ) : selected === "private" ? (
        <Inquiry locationId={Number(location)} />
      ) : selected ? (
        <Flow service={selected} />
      ) : (
        <p>Wähle Dein Angebot, um zu starten.</p>
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
