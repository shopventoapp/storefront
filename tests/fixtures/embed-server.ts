import { resolve } from "node:path";
import worker from "../../src/worker";

const upstream = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/api/edge/embed-policy")
      return Response.json(
        {
          enabled: true,
          canonical_origin: "https://storefront.example",
          allowed_origins: ["https://restaurant.example"],
          revision: "a".repeat(64),
        },
        { headers: { ETag: `"${"a".repeat(64)}"` } },
      );
    if (path === "/api/shop/branding")
      return Response.json({ brand_name: "Testatelier", published: true });
    return Response.json({ detail: "Not found" }, { status: 404 });
  },
});
const root = resolve("out");
const server = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  fetch(request) {
    return worker.fetch(request, {
      SHOPVENTO_API_URL: `http://127.0.0.1:${upstream.port}`,
      STOREFRONT_MULTI_TENANT: "true",
      STOREFRONT_EDGE_SECRET: "synthetic",
      ASSETS: {
        async fetch(input: RequestInfo | URL) {
          const url = new URL(
            input instanceof Request ? input.url : String(input),
          );
          let path = resolve(root, `.${url.pathname}`);
          if (!path.startsWith(`${root}/`)) path = `${root}/index.html`;
          if (!/\.[a-z0-9]+$/i.test(path)) path += "/index.html";
          const file = Bun.file(path);
          return (await file.exists())
            ? new Response(await file.arrayBuffer(), {
                headers: { "Content-Type": file.type },
              })
            : new Response("Not found", { status: 404 });
        },
        connect() {
          throw new Error("No sockets");
        },
      } as Fetcher,
    });
  },
});
console.log(`EMBED_ORIGIN=http://127.0.0.1:${server.port}`);
