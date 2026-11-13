"use client";
import { useEffect } from "react";

const namespace = "shopvento.booking";
export function EmbedBridge() {
  useEffect(() => {
    if (window.parent === window) return;
    let peer: { origin: string; id: string } | null = null;
    let policy: { allowed_origins: string[]; analytics: boolean } | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const send = (event: string, data: Record<string, unknown> = {}) => {
      if (peer)
        window.parent.postMessage(
          { namespace, version: 1, instanceId: peer.id, event, ...data },
          peer.origin,
        );
    };
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch("/embed/config", {
          credentials: "omit",
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(4000),
          ]),
        });
        const value = response.ok ? await response.json() : null;
        policy =
          value &&
          typeof value === "object" &&
          "allowed_origins" in value &&
          Array.isArray(value.allowed_origins) &&
          value.allowed_origins.every((v: unknown) => typeof v === "string")
            ? {
                allowed_origins: value.allowed_origins,
                analytics: "analytics" in value && value.analytics === true,
              }
            : null;
      } catch {
        policy = null;
      }
      if (controller.signal.aborted) return;
      send("ready", { analytics: policy?.analytics === true });
      if (peer && !policy?.allowed_origins.includes(peer.origin)) peer = null;
    };
    void refresh();
    const policyTimer = setInterval(() => void refresh(), 60000);
    const resize = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => send("resize", { height: document.body.scrollHeight }),
        100,
      );
    };
    const message = (event: MessageEvent) => {
      const m = event.data;
      if (
        event.source !== window.parent ||
        !policy?.allowed_origins.includes(event.origin) ||
        !m ||
        typeof m !== "object" ||
        Array.isArray(m) ||
        m.namespace !== namespace ||
        m.version !== 1 ||
        typeof m.instanceId !== "string" ||
        !/^[a-zA-Z0-9-]{1,64}$/.test(m.instanceId)
      )
        return;
      if (m.command === "hello" && (!peer || peer.id === m.instanceId)) {
        peer = { origin: event.origin, id: m.instanceId };
        send("ready", { analytics: policy.analytics === true });
        resize();
      } else if (m.command === "focus" && peer?.id === m.instanceId) {
        document.querySelector<HTMLElement>("button, input, a[href]")?.focus();
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") send("close_requested");
    };
    const analytics = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (
        detail &&
        [
          "booking_started",
          "booking_submitted",
          "booking_confirmed",
          "booking_pending",
          "booking_failed",
        ].includes(detail.event) &&
        ["table", "tasting", "voucher", "private"].includes(detail.service)
      )
        send(detail.event, {
          service: detail.service,
          eventId: crypto.randomUUID(),
        });
    };
    window.addEventListener("message", message);
    window.addEventListener("keydown", onEscape);
    window.addEventListener("shopvento:embed", analytics);
    const observer = new ResizeObserver(resize);
    observer.observe(document.body);
    // Parent load may precede config. Re-announce readiness to the exact referrer only after policy loads.
    const handshake = setInterval(() => {
      if (peer || !policy) return;
      let origin = "";
      try {
        origin = new URL(document.referrer).origin;
      } catch {
        return;
      }
      if (policy.allowed_origins.includes(origin))
        window.parent.postMessage(
          { namespace, version: 1, event: "hello" },
          origin,
        );
    }, 500);
    return () => {
      controller.abort();
      clearTimeout(timer);
      clearInterval(handshake);
      clearInterval(policyTimer);
      observer.disconnect();
      window.removeEventListener("message", message);
      window.removeEventListener("keydown", onEscape);
      window.removeEventListener("shopvento:embed", analytics);
    };
  }, []);
  return null;
}
