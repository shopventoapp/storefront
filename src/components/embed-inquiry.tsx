"use client";
import { Turnstile } from "@shopvento/ui/booking";
import { useRef, useState } from "react";
import { useResource } from "./embed-resource";

export default function EmbedInquiry({ locationId }: { locationId: number }) {
  const { data, loading, error } = useResource(async (signal) => {
    const [settings, locations] = await Promise.all([
      fetch("/api/shop/settings", { signal, credentials: "omit" }),
      fetch("/api/shop/tastings/locations", { signal, credentials: "omit" }),
    ]);
    if (!settings.ok || !locations.ok) throw new Error("Unavailable");
    const places = (await locations.json()) as { locations?: { id: number }[] };
    if (
      !places.locations?.some(
        (place: { id: number }) => place.id === locationId,
      )
    )
      throw new Error("Unavailable");
    return settings.json() as Promise<{
      turnstile_site_key?: string;
      guest_address?: "du" | "sie";
    }>;
  });
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);
  const [result, setResult] = useState("");
  const [failed, setFailed] = useState("");
  const [challenge, setChallenge] = useState(0);
  if (loading) return <p role="status">Anfrage wird geladen …</p>;
  if (error || !data?.turnstile_site_key)
    return <p role="status">Dieses Angebot ist gerade nicht verfügbar.</p>;
  if (result) return <p role="status">{result}</p>;
  const formal = data.guest_address === "sie";
  const unknownOutcome = formal
    ? "Das Ergebnis ist unklar. Bitte fragen Sie beim Standort nach, bevor Sie erneut anfragen."
    : "Das Ergebnis ist unklar. Bitte frage beim Standort nach, bevor Du erneut anfragst.";
  return (
    <form
      className="sv-booking"
      onSubmit={async (event) => {
        event.preventDefault();
        if (submitted.current || !token) return;
        submitted.current = true;
        setBusy(true);
        setFailed("");
        const values = Object.fromEntries(new FormData(event.currentTarget));
        try {
          const response = await fetch("/api/shop/private-event-requests", {
            method: "POST",
            credentials: "omit",
            redirect: "error",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...values,
              franchise_location_id: locationId,
              guests_provisional: Number(values.guests_provisional),
              terms_privacy_accepted: values.terms_privacy_accepted === "on",
              turnstile_token: token,
            }),
          });
          if (!response.ok) {
            if (response.status >= 500) throw new Error(unknownOutcome);
            submitted.current = false;
            const problem = (await response.json().catch(() => null)) as {
              detail?: unknown;
            } | null;
            throw new Error(
              typeof problem?.detail === "string" && problem.detail.trim()
                ? problem.detail
                : response.status === 429
                  ? formal
                    ? "Bitte warten Sie einen Moment, bevor Sie es erneut versuchen."
                    : "Bitte warte einen Moment, bevor Du es erneut versuchst."
                  : formal
                    ? "Ihre Anfrage konnte nicht verarbeitet werden. Bitte prüfen Sie Ihre Angaben."
                    : "Deine Anfrage konnte nicht verarbeitet werden. Bitte prüfe Deine Angaben.",
            );
          }
          const outcome = (await response.json()) as {
            status?: string;
            message?: string;
          };
          if (outcome.status !== "inquiry") throw new Error(unknownOutcome);
          setResult(
            outcome.message ||
              (formal
                ? "Ihre Anfrage ist eingegangen."
                : "Deine Anfrage ist eingegangen."),
          );
          window.dispatchEvent(
            new CustomEvent("shopvento:embed", {
              detail: { event: "booking_pending", service: "private" },
            }),
          );
        } catch (reason) {
          setFailed(
            submitted.current
              ? unknownOutcome
              : reason instanceof Error
                ? reason.message
                : "Die Anfrage ist derzeit nicht möglich.",
          );
          setToken("");
          setChallenge((value) => value + 1);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Private Veranstaltung anfragen</h2>
      <p>
        {formal
          ? "Ihre Anfrage ist unverbindlich. Sie reserviert noch keinen Termin."
          : "Deine Anfrage ist unverbindlich. Sie reserviert noch keinen Termin."}
      </p>
      <div className="sv-form-grid">
        {[
          ["title", "Anlass", "text"],
          ["contact_name", formal ? "Ihr Name" : "Dein Name", "text"],
          ["contact_email", "E-Mail", "email"],
          ["contact_phone", "Telefon", "tel"],
          ["date", "Wunschtermin", "date"],
          ["start_time", "Beginn", "time"],
          ["end_time", "Ende", "time"],
          ["guests_provisional", "Personen", "number"],
        ].map(([name, label, type]) => (
          <label key={name}>
            {label}
            <input
              name={name}
              type={type}
              required={name !== "contact_phone"}
              min={type === "number" ? 1 : undefined}
              max={type === "number" ? 500 : undefined}
              maxLength={255}
            />
          </label>
        ))}
      </div>
      <label>
        {formal ? "Ihre Wünsche" : "Deine Wünsche"}
        <textarea name="notes" maxLength={4000} rows={3} />
      </label>
      <label>
        <input type="checkbox" name="terms_privacy_accepted" required /> Ich
        akzeptiere die{" "}
        <a href="/datenschutz" target="_blank" rel="noopener">
          Datenschutzhinweise
        </a>
        .
      </label>
      <Turnstile
        key={challenge}
        siteKey={data.turnstile_site_key}
        onToken={setToken}
      />
      {failed && <p role="alert">{failed}</p>}
      <div className="embed-actions">
        <button
          className="button"
          type="submit"
          disabled={busy || !token || submitted.current}
        >
          {busy ? "Wird gesendet …" : "Anfrage senden →"}
        </button>
      </div>
    </form>
  );
}
