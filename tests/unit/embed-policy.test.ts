import { describe, expect, test } from "bun:test";
import { isShopProxyPath } from "@shopvento/ui/proxy";
import {
  createEmbedPolicyFetcher,
  embedHeaders,
} from "../../src/lib/embed-policy";
import { tenantTransport } from "../../src/lib/tenant-transport";

const env = {
  SHOPVENTO_API_URL: "https://backend.example",
  STOREFRONT_MULTI_TENANT: "true",
  STOREFRONT_EDGE_SECRET: "synthetic",
};
const policy = {
  enabled: true,
  canonical_origin: "https://a.shopvento.app",
  allowed_origins: ["https://restaurant.example"],
  revision: "a".repeat(64),
};
const request = new Request("https://A.shopvento.app./embed/booking", {
  headers: { "X-Shopvento-Host": "forged.example", Cookie: "private=yes" },
});
const response = () =>
  Response.json(policy, { headers: { ETag: `"${policy.revision}"` } });
function fetcher(
  fn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  return fn as typeof fetch;
}

describe("server-only embed policy", () => {
  test("sets only trusted headers, bypasses caching and revalidates each host independently", async () => {
    const calls: Request[] = [];
    const get = createEmbedPolicyFetcher(
      fetcher(async (input, init) => {
        const req = new Request(input, init);
        calls.push(req);
        return req.headers.has("If-None-Match")
          ? new Response(null, { status: 304 })
          : response();
      }),
    );
    expect(await get(request, env)).toEqual(policy);
    expect(await get(request, env)).toEqual(policy);
    await get(new Request("https://b.shopvento.app/embed/booking"), env);
    expect(calls.map((r) => r.headers.get("If-None-Match"))).toEqual([
      null,
      `"${policy.revision}"`,
      null,
    ]);
    expect(calls[0].url).toBe("https://backend.example/api/edge/embed-policy");
    expect(Object.fromEntries(calls[0].headers)).toEqual({
      "x-shopvento-host": "a.shopvento.app",
      "x-forwarded-host": "a.shopvento.app",
      "x-shopvento-edge": "synthetic",
    });
    expect(calls[0].redirect).toBe("manual");
    expect(calls[0].cache).toBe("no-store");
  });
  test("errors clear prior policy and never serve stale permissions", async () => {
    for (const status of [302, 403, 404, 500]) {
      let count = 0;
      const get = createEmbedPolicyFetcher(
        fetcher(async () =>
          ++count === 1 ? response() : new Response(null, { status }),
        ),
      );
      await get(request, env);
      expect(await get(request, env)).toBeNull();
      expect(
        embedHeaders(await get(request, env)).get("Content-Security-Policy"),
      ).toBe("frame-ancestors 'none'");
    }
    const get = createEmbedPolicyFetcher(
      fetcher(async () => {
        throw new Error("offline");
      }),
    );
    expect(await get(request, env)).toBeNull();
  });
  test("rejects malformed policy and unpaired 304, expires validators", async () => {
    for (const value of [
      {},
      { ...policy, allowed_origins: ["https://good.example;img-src"] },
      { ...policy, allowed_origins: ["*"] },
      { ...policy, enabled: "true" },
    ]) {
      expect(
        await createEmbedPolicyFetcher(
          fetcher(async () => Response.json(value)),
        )(request, env),
      ).toBeNull();
    }
    expect(
      await createEmbedPolicyFetcher(
        fetcher(async () => new Response(null, { status: 304 })),
      )(request, env),
    ).toBeNull();
    let time = 0;
    let count = 0;
    const get = createEmbedPolicyFetcher(
      fetcher(async (_input, init) => {
        if (++count === 2)
          expect(new Headers(init?.headers).has("If-None-Match")).toBe(false);
        return response();
      }),
      () => time,
    );
    await get(request, env);
    time = 60_001;
    await get(request, env);
  });
  test("disabled policy and missing configuration are closed; CSP uses exact origins", async () => {
    expect(embedHeaders(policy).get("Content-Security-Policy")).toBe(
      "frame-ancestors https://a.shopvento.app https://restaurant.example",
    );
    expect(embedHeaders(policy).has("X-Frame-Options")).toBe(false);
    expect(
      embedHeaders({ ...policy, enabled: false }).get("X-Frame-Options"),
    ).toBe("DENY");
    expect(embedHeaders(null).get("Vary")).toBe("Host");
    const get = createEmbedPolicyFetcher(
      fetcher(async () => {
        throw new Error("must not fetch");
      }),
    );
    for (const config of [
      {},
      { ...env, STOREFRONT_EDGE_SECRET: "" },
      { ...env, STOREFRONT_MULTI_TENANT: "false" },
    ])
      expect(await get(request, config)).toBeNull();
  });
  test("browser proxy and tenant transport never admit the internal path", async () => {
    for (const path of ["/api/edge/embed-policy", "/api/edge/embed-policy/"]) {
      expect(isShopProxyPath(path)).toBe(false);
      await expect(
        tenantTransport(request, env)?.fetcher?.(
          `https://backend.example${path}`,
        ),
      ).rejects.toThrow("Invalid storefront upstream");
    }
  });
});
