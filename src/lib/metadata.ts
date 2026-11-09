import type { Metadata } from "next";
import { platformMode } from "./platform";
import { demoName, privatePages, publicPages } from "./routes";

// The Worker replaces this reserved origin with the request origin at runtime.
export const buildOrigin = "https://storefront.example";

export function pageMetadata(path: string, title?: string): Metadata {
  const page = [...publicPages, ...privatePages].find(
    (page) =>
      page.path ===
      (platformMode && path === "/gutscheine" ? "/shop/gutscheine" : path),
  );
  const name = platformMode
    ? (page?.title ?? "Dein Besuch")
    : (title ?? page?.title ?? "Your experience");
  const description =
    (page && "description" in page ? page.description : undefined) ??
    (platformMode
      ? "Veranstaltungen und Gutscheine."
      : "Bookings, vouchers and orders at Nebenan Atelier.");
  return {
    title: name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${name} · ${demoName}`,
      description,
      url: path,
      type: "website",
      locale: platformMode ? "de_DE" : "en_GB",
      siteName: demoName,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    robots: {
      index: publicPages.some((item) => item.path === path),
      follow: publicPages.some((item) => item.path === path),
    },
  };
}
