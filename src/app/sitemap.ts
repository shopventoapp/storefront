import type { MetadataRoute } from "next";
import { buildOrigin } from "@/lib/metadata";
import { publicPages } from "@/lib/routes";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((page) => ({
    url: new URL(page.path, buildOrigin).href,
  }));
}
