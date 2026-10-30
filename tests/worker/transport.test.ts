import { afterAll, beforeAll, expect, test } from "bun:test";
import { existsSync } from "node:fs";

let upstream: ReturnType<typeof Bun.serve>;
let worker: ReturnType<typeof Bun.spawn>;
let origin: string;
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
      if (path === "/api/shop/branding")
        return Response.json({ brand_name: "Testatelier" });
      if (path === "/branding/theme.css")
        return new Response(
          `@font-face{font-family:"Test";src:url("${fontPath}") format("woff2")} :root{--brand-primary:#125c5f}`,
          {
            headers: { "Content-Type": "text/css" },
          },
        );
      if (path === fontPath)
        return new Response(fontBytes, {
          headers: { "Content-Type": "font/woff2" },
        });
      if (path === "/api/shop/settings")
        return Response.json({ synthetic: true });
      return Response.json({ detail: "Not found" }, { status: 404 });
    },
  });
  const port = availablePort();
  origin = `http://127.0.0.1:${port}`;
  worker = Bun.spawn(
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
      const response = await fetch(`${origin}/robots.txt`);
      if (response.ok) return;
    } catch {
      /* Wait for the local workerd runtime. */
    }
    await Bun.sleep(200);
  }
  throw new Error("Local Worker did not become ready");
}, 35000);

afterAll(async () => {
  worker?.kill();
  if (worker) await worker.exited;
  upstream?.stop(true);
});

test("runtime HTML contains installation branding and request-origin metadata", async () => {
  const response = await fetch(`${origin}/events`);
  const html = await response.text();
  expect(response.status).toBe(200);
  expect(html).toContain("Erlebnisse &amp; Termine | Testatelier");
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
