import { shellPath } from "../src/lib/routes";
import { isShopProxyPath, proxyShopRequest } from "../src/lib/shop-proxy";

// Bind before spawning so an occupied port can never replace another server.
function availablePort(start: number): number {
  for (let port = start; port < start + 20; port++) {
    try {
      const probe = Bun.listen({
        hostname: "127.0.0.1",
        port,
        socket: { data() {} },
      });
      probe.stop(true);
      return port;
    } catch {
      /* Try the next local port. */
    }
  }
  throw new Error("No free development port available");
}

const nextPort = availablePort(3200);
const port = availablePort(3100);
const child = Bun.spawn(
  [
    "bun",
    "--bun",
    "next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(nextPort),
  ],
  { stdout: "inherit", stderr: "inherit" },
);

type SocketData = { upstream: WebSocket; pending: (string | Uint8Array)[] };
const server = Bun.serve<SocketData>({
  hostname: "127.0.0.1",
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.replace(/\/$/, "") === "/gutscheine") {
      return Response.redirect(
        new URL(`/shop/gutscheine${url.search}`, request.url),
        308,
      );
    }
    if (
      request.headers.get("Upgrade")?.toLowerCase() === "websocket" &&
      url.pathname === "/_next/hmr"
    ) {
      url.protocol = "ws:";
      url.hostname = "127.0.0.1";
      url.port = String(nextPort);
      const upstream = new WebSocket(url);
      upstream.binaryType = "arraybuffer";
      if (server.upgrade(request, { data: { upstream, pending: [] } })) return;
      upstream.close();
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    if (isShopProxyPath(url.pathname))
      return proxyShopRequest(request, {
        apiUrl: process.env.SHOPVENTO_API_URL,
      });
    const path = url.pathname.replace(/\/$/, "") || "/";
    const shell = shellPath(path);
    if (shell !== path) url.pathname = `${shell}/`;
    url.hostname = "127.0.0.1";
    url.port = String(nextPort);
    try {
      const response = await fetch(new Request(url, request), {
        redirect: "manual",
      });
      // Bun fetch decodes compressed upstream bodies before returning the stream.
      const headers = new Headers(response.headers);
      headers.delete("Content-Encoding");
      headers.delete("Content-Length");
      return new Response(response.body, { status: response.status, headers });
    } catch {
      return new Response(
        "Development server is starting. Refresh in a moment.",
        { status: 503 },
      );
    }
  },
  websocket: {
    open(socket) {
      const upstream = socket.data.upstream;
      upstream.addEventListener("open", () => {
        for (const message of socket.data.pending) upstream.send(message);
        socket.data.pending.length = 0;
      });
      upstream.addEventListener("message", (event) => socket.send(event.data));
      upstream.addEventListener("close", () => socket.close());
      upstream.addEventListener("error", () => socket.close());
    },
    message(socket, message) {
      if (socket.data.upstream.readyState === WebSocket.OPEN)
        socket.data.upstream.send(message);
      else socket.data.pending.push(message);
    },
    close(socket) {
      socket.data.upstream.close();
    },
  },
});
console.info(`Storefront: http://localhost:${server.port}`);
function stop() {
  server.stop(true);
  child.kill();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
const exitCode = await child.exited;
server.stop(true);
process.exit(exitCode);
