export const demoName = "Nebenan Atelier";

export const publicPages = [
  {
    path: "/",
    title: "Time for new discoveries",
    description:
      "Workshops, tastings and little adventures. Find your next experience at Nebenan Atelier.",
  },
  {
    path: "/events",
    title: "Experiences & dates",
    description:
      "Explore upcoming workshops, tastings and tours and book your place.",
  },
  {
    path: "/shop/gutscheine",
    title: "Give time together",
    description: "Give time together with a voucher for Nebenan Atelier.",
  },
  {
    path: "/shop",
    title: "Discoveries for your home",
    description: "Browse products and vouchers from Nebenan Atelier.",
  },
  {
    path: "/reservierung",
    title: "Reserve your visit",
    description: "Plan your visit and request a place at the atelier.",
  },
  {
    path: "/newsletter",
    title: "News from the atelier",
    description: "Discover new dates and ideas. Sign up for our newsletter.",
  },
  {
    path: "/impressum",
    title: "Legal notice – placeholder",
    description: "Replace this legal placeholder before publishing.",
  },
  {
    path: "/datenschutz",
    title: "Privacy – placeholder",
    description: "Replace this legal placeholder before publishing.",
  },
  {
    path: "/agb",
    title: "Terms – placeholder",
    description: "Replace this legal placeholder before publishing.",
  },
  {
    path: "/widerruf",
    title: "Cancellation rights – placeholder",
    description: "Replace this legal placeholder before publishing.",
  },
] as const;

export const privatePages = [
  { path: "/warenkorb", title: "Your cart" },
  { path: "/kasse", title: "Checkout" },
  { path: "/kasse/erfolg", title: "Your order" },
  { path: "/kasse/abgebrochen", title: "Payment interrupted" },
  { path: "/bestellung", title: "Your order" },
  { path: "/versand", title: "Delivery & collection" },
  { path: "/buchung", title: "Your booking" },
  { path: "/konto", title: "Your account" },
] as const;

export function shellPath(path: string): string {
  if (path.startsWith("/shop/")) return "/shop";
  if (path.startsWith("/gutscheine/")) return "/gutscheine";
  if (path.startsWith("/konto/")) return "/konto";
  return path;
}
