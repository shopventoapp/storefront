import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  env: {
    NEXT_PUBLIC_STOREFRONT_PLATFORM: String(
      process.env.STOREFRONT_MULTI_TENANT === "true",
    ),
  },
  devIndicators: false,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default config;
