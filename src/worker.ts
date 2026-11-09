import { loadBranding } from "@shopvento/ui/branding";
import { isShopProxyPath, proxyShopRequest } from "@shopvento/ui/proxy";
import { demoName, privatePages, publicPages, shellPath } from "./lib/routes";
import { tenantTransport } from "./lib/tenant-transport";

interface StorefrontEnv extends CloudflareEnv {
  SHOPVENTO_API_URL?: string;
}

async function runtimeBranding(
  apiUrl?: string,
  fetcher?: typeof fetch,
  multiTenant = false,
): Promise<{ name: string; published: boolean } | null> {
  if (!apiUrl) return { name: demoName, published: true };
  let notFound = false;
  let published = true;
  try {
    const branding = await loadBranding({
      apiUrl,
      fetcher: (async (input, init) => {
        const response = await (fetcher ?? fetch)(input, init);
        notFound = response.status === 404;
        // The package keeps presentation keys only; read the publication state from a copy.
        if (response.ok)
          published = await response
            .clone()
            .json<{ published?: unknown } | null>()
            .then(
              (value) => value?.published !== false,
              () => true,
            );
        return response;
      }) as typeof fetch,
      signal: AbortSignal.timeout(4000),
    });
    return { name: branding.brand_name?.slice(0, 255) || demoName, published };
  } catch {
    if (multiTenant && notFound) return null;
    // Branding outages retain the neutral shell.
  }
  return { name: demoName, published: true };
}

const standaloneHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "CDN-Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

/** Shown until the operator publishes with their own Impressum and privacy policy (#43723). */
function holdingPage(name: string): Response {
  const brand = xmlEscape(name);
  return new Response(
    `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="robots" content="noindex, nofollow"><title>${brand}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;font:18px/1.5 system-ui,sans-serif;text-align:center}h1{font-size:1.6rem;margin:0 0 .5rem}p{margin:0;opacity:.75}</style><main><h1>Hier entsteht der Shop von ${brand}.</h1><p>Schau bald wieder vorbei.</p></main></html>`,
    { status: 200, headers: standaloneHeaders },
  );
}

const privateRoutes = [
  "/konto",
  "/warenkorb",
  "/kasse",
  "/bestellung",
  "/buchung",
  "/versand",
];

function isPrivate(path: string): boolean {
  return privateRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

function xmlEscape(value: string): string {
  return value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[character] ?? character,
  );
}

export default {
  async fetch(request: Request, env: StorefrontEnv): Promise<Response> {
    const url = new URL(request.url);
    const transport = tenantTransport(request, env);
    if (!transport)
      return Response.json(
        { detail: "Storefront unavailable" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    if (url.pathname.replace(/\/$/, "") === "/gutscheine") {
      return Response.redirect(
        new URL(`/shop/gutscheine${url.search}`, request.url),
        308,
      );
    }
    if (isShopProxyPath(url.pathname))
      return proxyShopRequest(request, transport);
    if (url.pathname.startsWith("/api/"))
      return Response.json({ detail: "Not found" }, { status: 404 });
    if (url.pathname === "/robots.txt") {
      return new Response(
        `User-agent: *\nAllow: /\n${privateRoutes.map((route) => `Disallow: ${route}`).join("\n")}\nSitemap: ${url.origin}/sitemap.xml\n`,
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=60",
          },
        },
      );
    }
    if (url.pathname === "/sitemap.xml") {
      const pages = publicPages.filter((page) => !isPrivate(page.path));
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((page) => `<url><loc>${xmlEscape(new URL(page.path, url.origin).href)}</loc></url>`).join("")}</urlset>`,
        {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=60",
          },
        },
      );
    }
    const shellUrl = new URL(url);
    const mappedPath = shellPath(url.pathname);
    if (
      mappedPath !== url.pathname ||
      /^\/(?:shop|konto)\/?$/.test(url.pathname)
    )
      shellUrl.pathname = `${mappedPath.replace(/\/$/, "")}/`;
    if (url.pathname.startsWith("/gutscheine/"))
      shellUrl.pathname = "/gutscheine/";
    const result = await env.ASSETS.fetch(new Request(shellUrl, request));
    if (!result.headers.get("Content-Type")?.includes("text/html"))
      return result;
    const headers = new Headers(result.headers);
    headers.set("Cache-Control", "no-store");
    headers.set("CDN-Cache-Control", "no-store");
    if (isPrivate(url.pathname))
      headers.set("X-Robots-Tag", "noindex, nofollow");
    const response = new Response(result.body, {
      status: result.status,
      headers,
    });
    const branding = await runtimeBranding(
      transport.apiUrl,
      transport.fetcher,
      env.STOREFRONT_MULTI_TENANT === "true",
    );
    if (branding === null) {
      await response.body?.cancel();
      return new Response(
        '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Storefront not found</title><h1>Storefront not found</h1><p>This storefront is unavailable.</p></html>',
        { status: 404, headers: standaloneHeaders },
      );
    }
    if (!branding.published) {
      await response.body?.cancel();
      return holdingPage(branding.name);
    }
    const { name } = branding;
    const page =
      [...publicPages, ...privatePages].find(
        (item) => item.path === url.pathname.replace(/\/$/, ""),
      ) ??
      [...publicPages, ...privatePages].find(
        (item) =>
          item.path.replace(/\/$/, "") === shellUrl.pathname.replace(/\/$/, ""),
      );
    const canonical = new URL(url.pathname, url.origin);
    const title = page ? `${page.title} | ${name}` : name;
    const rewriter = new HTMLRewriter()
      .on("title", {
        element(element) {
          element.setInnerContent(title);
        },
      })
      .on('link[rel="canonical"]', {
        element(element) {
          element.setAttribute("href", canonical.href);
        },
      })
      .on('meta[property="og:url"]', {
        element(element) {
          element.setAttribute("content", canonical.href);
        },
      })
      .on('meta[property="og:title"], meta[name="twitter:title"]', {
        element(element) {
          element.setAttribute("content", title);
        },
      })
      .on('meta[property="og:image"], meta[name="twitter:image"]', {
        element(element) {
          const value = element.getAttribute("content");
          if (value) {
            const image = new URL(value, url.origin);
            image.protocol = url.protocol;
            image.host = url.host;
            element.setAttribute("content", image.href);
          }
        },
      })
      .on('meta[property="og:site_name"]', {
        element(element) {
          element.setAttribute("content", name);
        },
      })
      .on(
        'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]',
        {
          element(element) {
            const value = element.getAttribute("content");
            if (value)
              element.setAttribute("content", value.replaceAll(demoName, name));
          },
        },
      );
    return rewriter.transform(response);
  },
} satisfies ExportedHandler<StorefrontEnv>;
