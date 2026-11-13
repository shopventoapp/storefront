import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { demoName } from "../../src/lib/routes";
import { tenantTransport } from "../../src/lib/tenant-transport";
import worker from "../../src/worker";

const apiUrl = "https://backend.example";
const secret = "synthetic-edge-credential";
const fontPath = `/branding/fonts/${"a".repeat(64)}.woff2`;
const names: Record<string, string> = {
  "atelier.shopvento.app": "Atelier A",
  "bistro.shopvento.app": "Bistro B",
};
const html = `<!doctype html><html><head><title>Demo</title>
<link rel="canonical" href="https://storefront.example/events">
<meta property="og:site_name" content="Demo"></head><body></body></html>`;

function environment() {
  return {
    SHOPVENTO_API_URL: apiUrl,
    STOREFRONT_MULTI_TENANT: "true",
    STOREFRONT_EDGE_SECRET: secret,
    ASSETS: {
      fetch: async () =>
        new Response(html, { headers: { "Content-Type": "text/html" } }),
      connect() {
        throw new Error("Assets do not use sockets");
      },
    } satisfies Fetcher,
  };
}

afterEach(() => {
  // Restore before any other tests use the platform fetch implementation.
  mockFetch?.mockRestore();
  mockFetch = undefined;
});
let mockFetch: ReturnType<typeof spyOn<typeof globalThis, "fetch">> | undefined;

function fakeFetch(
  run: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): typeof fetch {
  return run as typeof fetch;
}

describe("multi-tenant Worker", () => {
  test("an edge secret without the exact platform flag fails closed on every route", async () => {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async () => {
        throw new Error("Must not fetch");
      }),
    );
    for (const flag of [undefined, "", "false", "TRUE"]) {
      const env = { ...environment(), STOREFRONT_MULTI_TENANT: flag };
      const assets = spyOn(env.ASSETS, "fetch");
      for (const path of [
        "/events",
        "/api/shop/settings",
        "/api/shop/restaurant",
        "/branding/theme.css",
        fontPath,
        "/gutscheine",
        "/robots.txt",
      ]) {
        const response = await worker.fetch(
          new Request(`https://atelier.shopvento.app${path}`),
          env as ReturnType<typeof environment>,
        );
        expect(response.status).toBe(503);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
      }
      expect(assets).not.toHaveBeenCalled();
    }
    expect(mockFetch).not.toHaveBeenCalled();
    expect(
      tenantTransport(new Request("https://single.example"), {
        STOREFRONT_EDGE_SECRET: "",
      }),
    ).toBeNull();
  });

  test("unknown and suspended tenants receive a standalone uncached 404 without demo branding", async () => {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async (input, init) => {
        const outgoing = new Request(input, init);
        expect(new URL(outgoing.url).pathname).toBe("/api/shop/branding");
        return Response.json({ detail: "Not found" }, { status: 404 });
      }),
    );
    for (const host of ["unknown.shopvento.app", "suspended.shopvento.app"]) {
      const response = await worker.fetch(
        new Request(`https://${host}/events`),
        environment(),
      );
      expect(response.status).toBe(404);
      expect(response.headers.get("Content-Type")).toContain("text/html");
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.headers.get("CDN-Cache-Control")).toBe("no-store");
      expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
      const body = await response.text();
      expect(body).toContain("Seite nicht gefunden");
      expect(body).not.toContain(demoName);
      expect(body).not.toContain("<script");
    }
  });

  test("single-installation branding failures still retain the demo shell", async () => {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async () => new Response(null, { status: 404 })),
    );
    const response = await worker.fetch(
      new Request("https://single.example/events"),
      {
        ...environment(),
        STOREFRONT_MULTI_TENANT: "false",
        STOREFRONT_EDGE_SECRET: undefined,
      },
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(demoName);
  });

  test("reservation creation forwards the exact bare public path, body and trusted tenant headers", async () => {
    const body = JSON.stringify({
      franchise_location_id: 1,
      num_guests: 2,
      date: "2099-11-03",
      time: "19:00",
    });
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async (input, init) => {
        const outgoing = new Request(input, init);
        expect(outgoing.url).toBe(`${apiUrl}/api/table-reservations/public`);
        expect(outgoing.method).toBe("POST");
        expect(outgoing.headers.get("X-Shopvento-Host")).toBe(
          "atelier.shopvento.app",
        );
        expect(outgoing.headers.get("X-Shopvento-Edge")).toBe(secret);
        expect(await outgoing.text()).toBe(body);
        return Response.json({ id: 42 }, { status: 201 });
      }),
    );
    const response = await worker.fetch(
      new Request(
        "https://atelier.shopvento.app/api/table-reservations/public",
        {
          method: "POST",
          headers: {
            Origin: "https://atelier.shopvento.app",
            "Content-Type": "application/json",
          },
          body,
        },
      ),
      environment(),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 42 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("payment status stays tenant scoped and uncached", async () => {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async (input, init) => {
        const outgoing = new Request(input, init);
        expect(new URL(outgoing.url).pathname).toBe(
          "/api/shop/payments/status",
        );
        expect(outgoing.headers.get("X-Shopvento-Host")).toBe(
          "atelier.shopvento.app",
        );
        expect(outgoing.headers.get("X-Shopvento-Edge")).toBe(secret);
        return Response.json({
          online_payments_enabled: false,
          checkout_label: "Bald verfügbar",
        });
      }),
    );
    const response = await worker.fetch(
      new Request("https://atelier.shopvento.app/api/shop/payments/status"),
      environment(),
    );
    expect(await response.json()).toEqual({
      online_payments_enabled: false,
      checkout_label: "Bald verfügbar",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("CDN-Cache-Control")).toBe("no-store");
  });

  test("upstream redirects return to the requesting tenant host", async () => {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(
        async () =>
          new Response(null, {
            status: 302,
            statusText: "Found",
            headers: { Location: `${apiUrl}/buchung?reference=synthetic` },
          }),
      ),
    );
    for (const host of Object.keys(names)) {
      const response = await worker.fetch(
        new Request(`https://${host}/api/shop/stripe/success`),
        environment(),
      );
      expect(response.status).toBe(302);
      expect(response.statusText).toBe("Found");
      expect(response.headers.get("Location")).toBe(
        `https://${host}/buchung?reference=synthetic`,
      );
    }
  });

  test("interleaved hosts receive their own branding, assets and trusted proxy headers", async () => {
    const seen: { host: string; path: string }[] = [];
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async (input, init) => {
        const outgoing = new Request(input, init);
        const host = outgoing.headers.get("X-Shopvento-Host") ?? "";
        const path = new URL(outgoing.url).pathname;
        expect(new URL(outgoing.url).origin).toBe(apiUrl);
        expect(outgoing.headers.get("X-Forwarded-Host")).toBe(host);
        expect(outgoing.headers.get("X-Shopvento-Edge")).toBe(secret);
        expect(outgoing.redirect).toBe("manual");
        expect(outgoing.cache).toBe("no-store");
        seen.push({ host, path });
        // Reverse completion order to expose accidental process-wide state.
        if (host.startsWith("atelier")) await Bun.sleep(5);
        if (path === "/api/shop/branding")
          return Response.json({
            brand_name: names[host],
            logo_url: "/api/shop/media/logo",
          });
        return new Response(`${names[host]}:${path}`, {
          headers: { "Cache-Control": "public, max-age=3600" },
        });
      }),
    );
    const env = environment();
    await Promise.all(
      [
        "atelier.shopvento.app",
        "bistro.shopvento.app",
        "atelier.shopvento.app",
      ].map(async (host) => {
        const headers = {
          "X-Shopvento-Host": "forged.example",
          "X-Forwarded-Host": "forged.example",
          "X-Shopvento-Edge": "forged",
        };
        const response = await worker.fetch(
          new Request(`https://${host}/events`, { headers }),
          env,
        );
        const body = await response.text();
        expect(body).toContain(`Veranstaltungen | ${names[host]}`);
        expect(body).toContain(`content="${names[host]}"`);
        expect(body).toContain(`href="https://${host}/events"`);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
        expect(response.headers.get("CDN-Cache-Control")).toBe("no-store");
        expect(body).not.toContain(secret);
        expect(body).not.toContain(
          names[
            host.startsWith("atelier")
              ? "bistro.shopvento.app"
              : "atelier.shopvento.app"
          ],
        );
        for (const path of [
          "/api/shop/settings",
          "/api/shop/restaurant",
          "/api/shop/branding",
          "/api/shop/media/logo",
          "/branding/theme.css",
          fontPath,
          "/api/table-reservations/public/settings",
        ]) {
          const asset = await worker.fetch(
            new Request(`https://${host}${path}`, { headers }),
            env,
          );
          expect(await asset.text()).toContain(names[host]);
          expect(asset.headers.get("Cache-Control")).toBe("no-store");
          expect(asset.headers.has("X-Shopvento-Edge")).toBe(false);
        }
      }),
    );
    expect(seen).toHaveLength(24);
    expect(seen.every(({ host }) => host in names)).toBe(true);
  });

  test("missing, empty or whitespace secrets fail closed without fetching assets or upstream", async () => {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async () => {
        throw new Error("Must not fetch");
      }),
    );
    for (const value of [undefined, "", "   "]) {
      const env = { ...environment(), STOREFRONT_EDGE_SECRET: value };
      const assets = spyOn(env.ASSETS, "fetch");
      for (const path of [
        "/events",
        "/api/shop/settings",
        "/api/shop/restaurant",
        "/branding/theme.css",
        fontPath,
      ]) {
        const response = await worker.fetch(
          new Request(`https://atelier.shopvento.app${path}`),
          env,
        );
        expect(response.status).toBe(503);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
      }
      expect(assets).not.toHaveBeenCalled();
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("single-instance mode needs no secret and strips visitor tenant credentials", async () => {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async (input, init) => {
        const outgoing = new Request(input, init);
        expect(outgoing.headers.get("X-Shopvento-Host")).toBeNull();
        expect(outgoing.headers.get("X-Shopvento-Edge")).toBeNull();
        expect(outgoing.headers.get("X-Forwarded-Host")).toBe("single.example");
        return Response.json({ single: true });
      }),
    );
    const env = {
      ...environment(),
      STOREFRONT_MULTI_TENANT: "false",
      STOREFRONT_EDGE_SECRET: undefined,
    };
    const response = await worker.fetch(
      new Request("https://single.example/api/shop/settings", {
        headers: {
          "X-Shopvento-Host": "forged.example",
          "X-Shopvento-Edge": "forged",
        },
      }),
      env,
    );
    expect(await response.json()).toEqual({ single: true });
    expect(
      tenantTransport(new Request("https://single.example"), {}),
    ).not.toBeNull();
  });

  test("the credential adapter refuses foreign origins and non-public routes", async () => {
    const fetcher = spyOn(globalThis, "fetch");
    mockFetch = fetcher;
    const transport = tenantTransport(
      new Request("https://ATELIER.shopvento.app.:8443"),
      environment(),
    );
    for (const target of [
      "https://foreign.example/api/shop/settings",
      `${apiUrl}/api/admin/users`,
    ])
      await expect(transport?.fetcher?.(target)).rejects.toThrow(
        "Invalid storefront upstream",
      );
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("tenant mutations preserve bodies and first-party sessions with a normalized hostname", async () => {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async (input, init) => {
        const outgoing = new Request(input, init);
        expect(outgoing.headers.get("X-Shopvento-Host")).toBe(
          "atelier.shopvento.app",
        );
        expect(outgoing.headers.get("Cookie")).toBe(
          "shop_access_token=synthetic",
        );
        expect(outgoing.headers.get("Authorization")).toBeNull();
        expect(outgoing.method).toBe("POST");
        expect(await outgoing.text()).toBe('{"items":[]}');
        return Response.json({ ok: true });
      }),
    );
    const response = await worker.fetch(
      new Request("https://ATELIER.shopvento.app.:8443/api/shop/cart/", {
        method: "POST",
        headers: {
          Origin: "https://atelier.shopvento.app.:8443",
          Cookie: "shop_access_token=synthetic; unrelated=private",
          Authorization: "Bearer ignored",
          "Content-Type": "application/json",
        },
        body: '{"items":[]}',
      }),
      environment(),
    );
    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("mutation checks and manual redirect handling remain enforced", async () => {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(
        async () =>
          new Response(null, {
            status: 302,
            headers: { Location: "https://foreign.example/return" },
          }),
      ),
    );
    const env = environment();
    const rejected = await worker.fetch(
      new Request("https://atelier.shopvento.app/api/shop/user/logout", {
        method: "POST",
        headers: { Origin: "https://bistro.shopvento.app" },
      }),
      env,
    );
    expect(rejected.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
    const response = await worker.fetch(
      new Request("https://atelier.shopvento.app/api/shop/stripe/success"),
      env,
    );
    expect(response.status).toBe(302);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

test("embed policy starts before branding completes and unpublished stays denied", async () => {
  let policyStarted = false;
  mockFetch = spyOn(globalThis, "fetch").mockImplementation(
    fakeFetch(async (input) => {
      if (String(input).includes("/api/edge/embed-policy")) {
        policyStarted = true;
        return Response.json({
          enabled: true,
          canonical_origin: "https://atelier.shopvento.app",
          allowed_origins: [],
          revision: "a".repeat(64),
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(policyStarted).toBe(true);
      return Response.json({ brand_name: "Hidden", published: false });
    }),
  );
  const response = await worker.fetch(
    new Request("https://atelier.shopvento.app/embed/booking"),
    environment(),
  );
  expect(policyStarted).toBe(true);
  expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  expect(response.headers.get("Content-Security-Policy")).toBe(
    "frame-ancestors 'none'",
  );
});

test("embed review probes preserve deny headers, private routing, and host isolation", async () => {
  const seen: Request[] = [];
  mockFetch = spyOn(globalThis, "fetch").mockImplementation(
    fakeFetch(async (input, init) => {
      const request = new Request(input, init);
      seen.push(request);
      if (request.url.includes("/api/edge/embed-policy")) {
        const host = request.headers.get("X-Shopvento-Host");
        if (host === "atelier.shopvento.app")
          await new Promise((resolve) => setTimeout(resolve, 20));
        return Response.json({
          enabled: true,
          canonical_origin: `https://${host}`,
          allowed_origins: [],
          revision: "b".repeat(64),
        });
      }
      return Response.json({ brand_name: "Published", published: true });
    }),
  );
  const responses = await Promise.all(
    ["ATELIER.SHOPVENTO.APP.:8443", "bistro.shopvento.app"].map((host) =>
      worker.fetch(
        new Request(`https://${host}/embed/booking`, {
          headers: {
            Cookie: "private=yes",
            "X-Forwarded-Host": "forged.example",
            "X-Shopvento-Host": "forged.example",
          },
        }),
        environment(),
      ),
    ),
  );
  for (const [index, host] of [
    "atelier.shopvento.app",
    "bistro.shopvento.app",
  ].entries()) {
    expect(responses[index].headers.get("Content-Security-Policy")).toBe(
      `frame-ancestors https://${host}`,
    );
    expect(responses[index].headers.get("Cache-Control")).toBe("no-store");
    expect(responses[index].headers.get("Vary")).toBe("Host");
    expect(responses[index].headers.has("X-Frame-Options")).toBe(false);
  }
  for (const request of seen.filter((item) =>
    item.url.includes("/api/edge/"),
  )) {
    expect(request.headers.get("Cookie")).toBeNull();
    expect(request.redirect).toBe("manual");
  }
  for (const path of [
    "/agb/",
    "/reservierung/",
    "/embed/booking/index.html",
    "/embed/%62ooking/",
  ]) {
    const response = await worker.fetch(
      new Request(`https://atelier.shopvento.app${path}`),
      environment(),
    );
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  }
  for (const [path, status] of [
    ["/api/edge/embed-policy", 404],
    ["/api/shop/%2e%2e/%2e%2e/api/edge/embed-policy", 404],
    ["/api/shop/..%2f..%2fapi/edge/embed-policy", 400],
  ] as const) {
    const response = await worker.fetch(
      new Request(`https://atelier.shopvento.app${path}`, {
        headers: { "X-Shopvento-Edge": secret },
      }),
      environment(),
    );
    expect(response.status).toBe(status);
    expect(await response.text()).not.toContain(secret);
  }
});

test("embed review fail-closed probes including timeout and HEAD", async () => {
  for (const mode of [
    "disabled",
    "404",
    "malformed",
    "redirect",
    "injection",
    "timeout",
  ]) {
    mockFetch?.mockRestore();
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async (input, init) => {
        if (!String(input).includes("/api/edge/embed-policy"))
          return Response.json({ published: true });
        if (mode === "timeout")
          return new Promise((_resolve, reject) =>
            init?.signal?.addEventListener(
              "abort",
              () => reject(new Error("timeout")),
              { once: true },
            ),
          );
        if (mode === "404") return new Response(null, { status: 404 });
        if (mode === "redirect")
          return new Response(null, {
            status: 302,
            headers: { Location: "https://elsewhere.example" },
          });
        if (mode === "malformed") return new Response("{");
        return Response.json({
          enabled: mode !== "disabled",
          canonical_origin: "https://atelier.shopvento.app",
          allowed_origins:
            mode === "injection" ? ["https://good.example;script-src *"] : [],
          revision: "c".repeat(64),
        });
      }),
    );
    const response = await worker.fetch(
      new Request("https://atelier.shopvento.app/embed/booking", {
        method: "HEAD",
      }),
      environment(),
    );
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Content-Security-Policy")).toBe(
      "frame-ancestors 'none'",
    );
  }
}, 10000);
