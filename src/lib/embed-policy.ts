// Worker-only module. Never import into a page, client component or API proxy.
import { instanceOrigin } from "@shopvento/ui/proxy";

type PolicyEnv = Partial<CloudflareEnv> & { SHOPVENTO_API_URL?: string };
export interface EmbedPolicy {
  enabled: boolean;
  analytics_events_enabled?: boolean;
  preview_origin?: string;
  canonical_origin: string;
  allowed_origins: string[];
  revision: string;
}
type Entry = { policy: EmbedPolicy; etag: string; expires: number };
const maximumEntries = 256;
const lifetime = 60_000;

function origin(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      /^[a-z0-9.-]+$/.test(url.hostname) &&
      url.protocol === "https:" &&
      url.origin === value &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
function parse(value: unknown): EmbedPolicy | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Partial<EmbedPolicy>;
  return typeof p.enabled === "boolean" &&
    origin(p.canonical_origin) &&
    (p.preview_origin === undefined || origin(p.preview_origin)) &&
    Array.isArray(p.allowed_origins) &&
    p.allowed_origins.length <= 20 &&
    p.allowed_origins.every(origin) &&
    typeof p.revision === "string" &&
    /^[a-f0-9]{64}$/.test(p.revision)
    ? (p as EmbedPolicy)
    : null;
}

/** Cache validators only: every document revalidates, and errors never use stale policy. */
export function createEmbedPolicyFetcher(
  fetcher: typeof fetch = fetch,
  now = Date.now,
) {
  const cache = new Map<string, Entry>();
  return async (
    request: Request,
    env: PolicyEnv,
  ): Promise<EmbedPolicy | null> => {
    const upstream = instanceOrigin(env.SHOPVENTO_API_URL);
    const secret = env.STOREFRONT_EDGE_SECRET;
    if (env.STOREFRONT_MULTI_TENANT !== "true" || !upstream || !secret?.trim())
      return null;
    const host = new URL(request.url).hostname.toLowerCase().replace(/\.$/, "");
    const key = `${upstream.origin}|${host}`;
    const previous = cache.get(key);
    const entry = previous && previous.expires > now() ? previous : undefined;
    cache.delete(key);
    try {
      const headers = new Headers({
        "X-Shopvento-Host": host,
        "X-Forwarded-Host": host,
        "X-Shopvento-Edge": secret,
      });
      if (entry) headers.set("If-None-Match", entry.etag);
      const response = await fetcher(
        new URL("/api/edge/embed-policy", upstream),
        {
          headers,
          redirect: "manual",
          cache: "no-store",
          signal: AbortSignal.timeout(4000),
        },
      );
      const policy =
        response.status === 304
          ? (entry?.policy ?? null)
          : response.status === 200
            ? parse(await response.json())
            : null;
      if (!policy) return null;
      const etag =
        response.headers.get("ETag") ??
        (response.status === 304 ? entry?.etag : undefined);
      if (etag === `"${policy.revision}"`) {
        if (cache.size >= maximumEntries)
          cache.delete(cache.keys().next().value as string);
        cache.set(key, { policy, etag, expires: now() + lifetime });
      }
      return policy;
    } catch {
      return null;
    }
  };
}

export function embedHeaders(policy: EmbedPolicy | null): Headers {
  const headers = new Headers({
    "Content-Security-Policy": policy?.enabled
      ? `frame-ancestors ${[policy.canonical_origin, ...policy.allowed_origins, ...(policy.preview_origin ? [policy.preview_origin] : [])].join(" ")}`
      : "frame-ancestors 'none'",
    "Cache-Control": "no-store",
    "CDN-Cache-Control": "no-store",
    Vary: "Host",
    "X-Robots-Tag": "noindex, nofollow",
  });
  if (!policy?.enabled) headers.set("X-Frame-Options", "DENY");
  return headers;
}
