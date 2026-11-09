/** Public build choice only. Tenant identity and API configuration stay server-only. */
export const platformMode =
  process.env.NEXT_PUBLIC_STOREFRONT_PLATFORM === "true";
export const uiLocale = platformMode ? "de" : "en-GB";
