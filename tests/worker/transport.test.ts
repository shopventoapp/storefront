import { afterAll, beforeAll, expect, test } from "bun:test";
import { existsSync } from "node:fs";

let upstream: ReturnType<typeof Bun.serve>;
let worker: ReturnType<typeof Bun.spawn>;
let origin: string;
let platformWorker: ReturnType<typeof Bun.spawn>;
let platformOrigin: string;
const edgeSecret = "synthetic-edge-credential";
const tenantNames: Record<string, string> = {
  "atelier.shopvento.app": "Atelier A",
  "bistro.shopvento.app": "Bistro B",
};
const unpublishedHost = "neu.shopvento.app";
const fontPath = `/branding/fonts/${"a".repeat(64)}.woff2`;
const fontBytes = new Uint8Array([119, 79, 70, 50, 1, 2, 3, 4]);

function availablePort(): number {
  const probe = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch: () => new Response(),
  });
  const port = probe.port;
  probe.stop(true);
  if (!port) throw new Error("Could not allocate local Worker port");
  return port;
}

beforeAll(async () => {
  if (!existsSync("out/index.html"))
    throw new Error("Run bun run build before Worker integration tests");
  upstream = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch(request) {
      const path = new URL(request.url).pathname;
      const host = request.headers.get("X-Shopvento-Host");
      if (
        host &&
        (request.headers.get("X-Shopvento-Edge") !== edgeSecret ||
          request.headers.get("X-Forwarded-Host") !== host)
      )
        return new Response(null, { status: 403 });
      const name =
        host === unpublishedHost
          ? "Neu <Bistro>"
          : host
            ? tenantNames[host]
            : "Testatelier";
      if (host && !name)
        return Response.json({ detail: "Not found" }, { status: 404 });
      if (path === "/api/shop/branding")
        return Response.json({
          brand_name: name,
          published: host !== unpublishedHost,
        });
      if (path === "/branding/theme.css")
        return new Response(
          `@font-face{font-family:"${name}";src:url("${fontPath}") format("woff2")} :root{--brand-primary:#125c5f}`,
          {
            headers: { "Content-Type": "text/css" },
          },
        );
      if (path === fontPath)
        return new Response(fontBytes, {
          headers: { "Content-Type": "font/woff2" },
        });
      if (path === "/api/shop/settings")
        return Response.json({
          synthetic: true,
          ...(host ? { host, name } : {}),
        });
      return Response.json({ detail: "Not found" }, { status: 404 });
    },
  });
  ({ origin, worker } = await startWorker());
  ({ origin: platformOrigin, worker: platformWorker } =
    await startWorker(true));
}, 65000);

async function startWorker(multiTenant = false) {
  const port = availablePort();
  const localOrigin = `http://127.0.0.1:${port}`;
  const localWorker = Bun.spawn(
    [
      "bunx",
      "wrangler",
      "dev",
      "--local",
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
      "--inspector-port",
      String(availablePort()),
      "--var",
      `SHOPVENTO_API_URL:http://127.0.0.1:${upstream.port}`,
      ...(multiTenant
        ? [
            "--var",
            "STOREFRONT_MULTI_TENANT:true",
            "--var",
            `STOREFRONT_EDGE_SECRET:${edgeSecret}`,
          ]
        : []),
      "--show-interactive-dev-session=false",
      "--log-level",
      "error",
    ],
    {
      stdout: "ignore",
      stderr: "inherit",
      env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    },
  );
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${localOrigin}/robots.txt`);
      if (response.ok) return { origin: localOrigin, worker: localWorker };
    } catch {
      /* Wait for the local workerd runtime. */
    }
    await Bun.sleep(200);
  }
  localWorker.kill();
  await localWorker.exited;
  throw new Error("Local Worker did not become ready");
}

afterAll(async () => {
  worker?.kill();
  platformWorker?.kill();
  if (worker) await worker.exited;
  if (platformWorker) await platformWorker.exited;
  upstream?.stop(true);
});

test("runtime HTML contains installation branding and request-origin metadata", async () => {
  const response = await fetch(`${origin}/events`);
  const html = await response.text();
  expect(response.status).toBe(200);
  expect(html).toContain("Experiences &amp; dates | Testatelier");
  expect(html).toContain('lang="en"');
  expect(html).toContain('content="en_GB"');
  expect(html.includes(`href="${response.url}"`)).toBe(true);
  expect(html.includes(`property="og:url" content="${response.url}"`)).toBe(
    true,
  );
  expect(html).toContain(`property="og:site_name" content="Testatelier"`);
  expect(html).not.toContain('content="https://storefront.example/og-image');
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});

test("nested package routes receive their page shells and private routes stay noindex", async () => {
  for (const path of [
    "/shop/workshops/entdecken",
    "/gutscheine/zeit/verschenken",
    "/konto/bestellungen/1",
  ]) {
    const response = await fetch(origin + path);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain(`href="${origin}${path}"`);
    if (path.startsWith("/konto"))
      expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  }
});

test("robots and sitemap use the active host and omit private routes", async () => {
  const robots = await (await fetch(`${origin}/robots.txt`)).text();
  expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);
  expect(robots).toContain("Disallow: /konto");
  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  expect(sitemap).toContain(`<loc>${origin}/events</loc>`);
  expect(sitemap).not.toContain("/konto");
  expect(sitemap).not.toContain("/kasse");
});

test("API and branding assets use the configured instance and reject foreign mutations", async () => {
  const response = await fetch(`${origin}/api/shop/settings`);
  expect(await response.json()).toEqual({ synthetic: true });
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await (await fetch(`${origin}/branding/theme.css`)).text()).toContain(
    "--brand-primary",
  );
  const rejected = await fetch(`${origin}/api/shop/user/logout`, {
    method: "POST",
    headers: { Origin: "https://foreign.example" },
  });
  expect(rejected.status).toBe(403);
});

test("relative font-face URLs load through the read-only same-origin font route", async () => {
  const css = await (await fetch(`${origin}/branding/theme.css`)).text();
  expect(css).toContain(`src:url("${fontPath}")`);
  const response = await fetch(origin + fontPath);
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("font/woff2");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(fontBytes);
  const head = await fetch(origin + fontPath, { method: "HEAD" });
  expect(head.status).toBe(200);
  expect(await head.text()).toBe("");
  const rejected = await fetch(origin + fontPath, {
    method: "POST",
    headers: { Origin: origin },
  });
  expect(rejected.status).toBe(405);
  const unknown = await fetch(`${origin}/branding/fonts/not-a-font.woff2`);
  expect(unknown.status).toBe(404);
});

test("workerd isolates tenant metadata, theme assets and proxy identity", async () => {
  await Promise.all(
    Object.entries(tenantNames).map(async ([host, name]) => {
      const headers = {
        Host: host,
        "X-Shopvento-Host": "forged.example",
        "X-Shopvento-Edge": "forged",
      };
      const response = await fetch(`${platformOrigin}/events`, { headers });
      const html = await response.text();
      expect(response.status).toBe(200);
      expect(html).toContain(`Veranstaltungen | ${name}`);
      expect(html).toContain('lang="de"');
      expect(html).toContain('content="de_DE"');
      expect(html.includes(`href="http://${host}/events/"`)).toBe(true);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(html).not.toContain(edgeSecret);
      const settings = await fetch(`${platformOrigin}/api/shop/settings`, {
        headers,
      });
      expect(await settings.json()).toEqual({ synthetic: true, host, name });
      const css = await fetch(`${platformOrigin}/branding/theme.css`, {
        headers,
      });
      expect(await css.text()).toContain(`font-family:"${name}"`);
      expect(css.headers.get("Cache-Control")).toBe("no-store");
    }),
  );
});

test("workerd returns a standalone 404 for unknown or suspended storefronts", async () => {
  for (const host of ["unknown.shopvento.app", "suspended.shopvento.app"]) {
    const response = await fetch(`${platformOrigin}/events`, {
      headers: { Host: host },
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const html = await response.text();
    expect(html).toContain("Seite nicht gefunden");
    expect(html).not.toContain("Nebenan Atelier");
    expect(html).not.toContain("<script");
  }
});

test("an unpublished storefront shows only the neutral holding page (#43723)", async () => {
  for (const path of ["/", "/events", "/impressum", "/konto"]) {
    const response = await fetch(platformOrigin + path, {
      headers: { Host: unpublishedHost },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const html = await response.text();
    expect(html).toContain("Hier entsteht der Shop von Neu &lt;Bistro&gt;.");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("Nebenan Atelier");
  }
  // The backend stays authoritative for API traffic.
  const settings = await fetch(`${platformOrigin}/api/shop/settings`, {
    headers: { Host: unpublishedHost },
  });
  expect(await settings.json()).toEqual({
    synthetic: true,
    host: unpublishedHost,
    name: "Neu <Bistro>",
  });
});

test("published tenants and older backends without the flag keep the shop", async () => {
  const response = await fetch(`${origin}/impressum`);
  const html = await response.text();
  expect(response.status).toBe(200);
  expect(html).not.toContain("Hier entsteht");
});

test("platform homepage export is neutral and German", async () => {
  if (process.env.STOREFRONT_MULTI_TENANT !== "true") return;
  const response = await fetch(`${platformOrigin}/`, {
    headers: { Host: "bistro.shopvento.app" },
  });
  const html = await response.text();
  expect(response.status).toBe(200);
  expect(html).toContain('lang="de"');
  expect(html).toContain("Gutscheine verschenken");
  expect(html).toContain("Kommende Veranstaltungen");
  expect(html).not.toContain("Nebenan Atelier");
  expect(html).not.toContain("Good times.");
  expect(html).not.toContain("Coming up at the atelier");
});
