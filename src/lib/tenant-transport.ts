import {
  instanceOrigin,
  isShopProxyPath,
  type ProxyOptions,
} from "@shopvento/ui/proxy";

type TenantTransportEnv = Partial<CloudflareEnv> & {
  SHOPVENTO_API_URL?: string;
};

// Keep the package's route, origin, cookie and response protections. Only the
// final upstream fetch adds trusted headers, never headers from the visitor.
export function tenantTransport(
  request: Request,
  env: TenantTransportEnv,
  fetcher: typeof fetch = fetch,
): ProxyOptions | null {
  const options: ProxyOptions = {
    apiUrl: env.SHOPVENTO_API_URL,
    trustVisitorIp: true,
  };
  if (env.STOREFRONT_MULTI_TENANT !== "true") return options;

  const upstream = instanceOrigin(env.SHOPVENTO_API_URL);
  const secret = env.STOREFRONT_EDGE_SECRET;
  if (!upstream || !secret?.trim()) return null;
  const host = new URL(request.url).hostname.toLowerCase().replace(/\.$/, "");

  options.fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const outgoing = new Request(input, init);
    const url = new URL(outgoing.url);
    if (url.origin !== upstream.origin || !isShopProxyPath(url.pathname))
      throw new Error("Invalid storefront upstream");
    const headers = new Headers(outgoing.headers);
    headers.set("X-Shopvento-Host", host);
    headers.set("X-Forwarded-Host", host);
    headers.set("X-Shopvento-Edge", secret);
    // The shared backend URL alone is not a tenant-safe cache key. Bypass
    // upstream caching and never follow a redirect with the edge credential.
    return fetcher(outgoing, {
      headers,
      redirect: "manual",
      cache: "no-store",
    });
  }) as typeof fetch;
  return options;
}
