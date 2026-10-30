import type { MetadataRoute } from "next";
import { buildOrigin } from "@/lib/metadata";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/konto", "/kasse", "/warenkorb", "/bestellung", "/buchung"],
    },
    sitemap: `${buildOrigin}/sitemap.xml`,
  };
}
