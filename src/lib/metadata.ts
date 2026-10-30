import type { Metadata } from "next";
import { demoName, publicPages } from "./routes";

// The Worker replaces this reserved origin with the request origin at runtime.
export const buildOrigin = "https://storefront.example";

export function pageMetadata(path: string, title?: string): Metadata {
  const page = publicPages.find((page) => page.path === path);
  const name = title ?? page?.title ?? "Dein Erlebnis";
  const description =
    page?.description ??
    "Buchungen, Gutscheine und Bestellungen im Nebenan Atelier.";
  return {
    title: name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${name} · ${demoName}`,
      description,
      url: path,
      type: "website",
      locale: "de_DE",
      siteName: demoName,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    robots: { index: Boolean(page), follow: Boolean(page) },
  };
}
