/* Shopvento booking loader v1. Functional messaging never requires analytics consent. */
(() => {
  const script = document.currentScript;
  if (!script || window.ShopventoBooking) return;
  const origin = new URL(script.src).origin;
  const namespace = "shopvento.booking";
  const instances = new Map();
  let consent = false;
  const events = new Set([
    "booking_started",
    "booking_submitted",
    "booking_confirmed",
    "booking_pending",
    "booking_failed",
  ]);
  function send(item, command) {
    item.frame.contentWindow?.postMessage(
      { namespace, version: 1, instanceId: item.id, command },
      origin,
    );
  }
  function mount(anchor) {
    let url;
    try {
      url = new URL(anchor.href);
    } catch {
      return;
    }
    if (
      url.origin !== origin ||
      url.pathname.replace(/\/$/, "") !== "/embed/booking" ||
      !/^[1-9]\d*$/.test(url.searchParams.get("location") || "")
    )
      return;
    const mode = anchor.dataset.shopvento;
    if (!["inline", "popup"].includes(mode)) return;
    if (anchor.dataset.shopventoMounted) return;
    anchor.dataset.shopventoMounted = "true";
    const id = crypto.randomUUID();
    const frame = document.createElement("iframe");
    frame.title = "Buchung";
    frame.name = id;
    frame.width = "100%";
    frame.height = "720";
    frame.style.border = "0";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.loading = "lazy";
    const item = {
      id,
      frame,
      anchor,
      seen: new Set(),
      last: 0,
      count: 0,
      analytics: false,
      dialog: null,
    };
    instances.set(id, item);
    frame.addEventListener("load", () => send(item, "hello"));
    frame.src = url.href;
    if (mode === "inline") {
      anchor.before(frame);
      return;
    }
    anchor.addEventListener("click", (event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      if (!item.dialog) {
        const dialog = document.createElement("dialog");
        const heading = document.createElement("h2");
        heading.textContent = "Deine Buchung";
        heading.id = `shopvento-${id}`;
        dialog.setAttribute("aria-labelledby", heading.id);
        dialog.style.cssText =
          "box-sizing:border-box;width:min(960px,calc(100% - 24px));max-height:90dvh;padding:16px;border:0;border-radius:8px";
        const close = document.createElement("button");
        close.type = "button";
        close.textContent = "Schließen";
        close.style.cssText = "min-height:44px;float:right";
        close.addEventListener("click", () => dialog.close());
        dialog.append(close, heading, frame);
        document.body.append(dialog);
        dialog.addEventListener("close", () => anchor.focus());
        item.dialog = dialog;
      }
      item.dialog.showModal();
      send(item, "focus");
    });
  }
  window.addEventListener("message", (event) => {
    const m = event.data;
    if (
      event.origin === origin &&
      m?.namespace === namespace &&
      m.version === 1 &&
      m.event === "hello"
    ) {
      for (const item of instances.values())
        if (event.source === item.frame.contentWindow) send(item, "hello");
      return;
    }
    if (
      event.origin !== origin ||
      !m ||
      typeof m !== "object" ||
      Array.isArray(m) ||
      m.namespace !== namespace ||
      m.version !== 1 ||
      typeof m.instanceId !== "string"
    )
      return;
    const item = instances.get(m.instanceId);
    if (!item || event.source !== item.frame.contentWindow) return;
    const now = Date.now();
    if (now - item.last >= 1000) {
      item.last = now;
      item.count = 0;
    }
    if (++item.count > 20) return;
    if (m.event === "ready") {
      item.analytics = m.analytics === true;
      if (item.dialog?.open) send(item, "focus");
      return;
    }
    if (m.event === "resize" && Number.isFinite(m.height)) {
      item.frame.height = String(
        Math.max(240, Math.min(4000, Math.ceil(m.height))),
      );
      return;
    }
    if (m.event === "close_requested") {
      item.dialog?.close();
      return;
    }
    if (
      !consent ||
      !item.analytics ||
      !events.has(m.event) ||
      typeof m.eventId !== "string" ||
      !/^[a-zA-Z0-9-]{1,64}$/.test(m.eventId) ||
      !["table", "tasting", "voucher", "private"].includes(m.service) ||
      item.seen.has(m.eventId)
    )
      return;
    if (item.seen.size >= 256) return;
    item.seen.add(m.eventId);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: `shopvento_${m.event}`,
      service: m.service,
    });
  });
  window.ShopventoBooking = Object.freeze({
    setConsent(value) {
      consent = value === true;
    },
    mount() {
      document.querySelectorAll("a[data-shopvento]").forEach(mount);
    },
  });
  window.ShopventoBooking.mount();
})();
