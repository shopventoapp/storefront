import { demoName, privatePages, publicPages, shellPath } from "./lib/routes";
import {
  instanceOrigin,
  isShopProxyPath,
  proxyShopRequest,
  readSmallJson,
} from "./lib/shop-proxy";

interface StorefrontEnv extends CloudflareEnv {
  SHOPVENTO_API_URL?: string;
}

async function brandName(apiUrl?: string): Promise<string> {
  const origin = instanceOrigin(apiUrl);
  if (!origin) return demoName;
  try {
    const result = await fetch(new URL("/api/shop/branding", origin), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!result.ok) return demoName;
    const value = await readSmallJson(result, 131072);
    if (
      value &&
      typeof value === "object" &&
      "brand_name" in value &&
      typeof value.brand_name === "string" &&
      value.brand_name.trim()
    )
      return value.brand_name.trim().slice(0, 255);
  } catch {
    // Branding outages retain the neutral shell without exposing infrastructure.
  }
  return demoName;
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
    if (url.pathname.replace(/\/$/, "") === "/gutscheine") {
      return Response.redirect(
        new URL(`/shop/gutscheine${url.search}`, request.url),
        308,
      );
    }
    if (isShopProxyPath(url.pathname))
      return proxyShopRequest(request, {
        apiUrl: env.SHOPVENTO_API_URL,
        trustVisitorIp: true,
      });
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
    const name = await brandName(env.SHOPVENTO_API_URL);
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
