import { afterEach, expect, spyOn, test } from "bun:test";
import { loadPaymentStatus } from "../../src/lib/payment-status";

let mockFetch: ReturnType<typeof spyOn<typeof globalThis, "fetch">> | undefined;
afterEach(() => mockFetch?.mockRestore());

function fakeFetch(
  run: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): typeof fetch {
  return run as typeof fetch;
}

test("reads the public payment capability over the uncached same-origin transport", async () => {
  const signal = new AbortController().signal;
  for (const enabled of [false, true]) {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation((async (
      input,
      init,
    ) => {
      expect(input).toBe("/api/shop/payments/status");
      expect(init?.cache).toBe("no-store");
      expect(init?.credentials).toBe("same-origin");
      expect(init?.signal).toBe(signal);
      return Response.json({
        online_payments_enabled: enabled,
        checkout_label: "backend copy",
      });
    }) as typeof fetch);
    expect(await loadPaymentStatus(signal)).toEqual({
      online_payments_enabled: enabled,
    });
    mockFetch.mockRestore();
  }
});

test("does not interpret unavailable or malformed payment status as enabled", async () => {
  for (const response of [
    Response.json({ online_payments_enabled: true }, { status: 503 }),
    Response.json({ online_payments_enabled: "false" }),
    Response.json({}),
    Response.json(null),
    Response.json({ online_payments_enabled: true, padding: "x".repeat(4096) }),
  ]) {
    mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      fakeFetch(async () => response),
    );
    await expect(loadPaymentStatus()).rejects.toThrow();
    mockFetch.mockRestore();
  }
});
