import { platformMode } from "./platform";

export const demoName = platformMode ? "Willkommen bei uns" : "Nebenan Atelier";

const englishPublicPages = [
  {
    path: "/speisekarte",
    title: "Menu",
    description: "Discover our food, drinks and prices.",
  },
  {
    path: "/standorte",
    title: "Locations",
    description: "Find our locations, opening hours and directions.",
  },
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

const englishPrivatePages = [
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

type PagePath =
  | (typeof englishPublicPages)[number]["path"]
  | (typeof englishPrivatePages)[number]["path"];
const germanCopy: Record<PagePath, [string, string]> = {
  "/speisekarte": [
    "Speisekarte",
    "Entdecke unsere Speisen, Getränke und Preise mit Hinweisen zu Allergenen und Zusatzstoffen.",
  ],
  "/standorte": [
    "Standorte",
    "Hier findest Du unsere Adressen, Öffnungszeiten und Hinweise zur Anfahrt.",
  ],
  "/": [
    "Willkommen bei uns",
    "Entdecke kommende Veranstaltungen und verschenke Gutscheine.",
  ],
  "/events": [
    "Veranstaltungen",
    "Entdecke kommende Veranstaltungen und buche Deinen Platz.",
  ],
  "/shop/gutscheine": [
    "Gutscheine verschenken",
    "Verschenke einen Gutschein für gemeinsame Zeit.",
  ],
  "/shop": ["Shop", "Entdecke Produkte und Gutscheine."],
  "/reservierung": [
    "Tisch reservieren",
    "Finde einen freien Tisch für Deinen Besuch.",
  ],
  "/newsletter": ["Neuigkeiten", "Erhalte Neuigkeiten und Termine per E-Mail."],
  "/impressum": ["Impressum", "Angaben zum Anbieter."],
  "/datenschutz": ["Datenschutz", "Informationen zum Datenschutz."],
  "/agb": ["AGB", "Allgemeine Geschäftsbedingungen des Anbieters."],
  "/widerruf": ["Widerruf", "Informationen zum Widerruf."],
  "/warenkorb": ["Dein Warenkorb", ""],
  "/kasse": ["Kasse", ""],
  "/kasse/erfolg": ["Deine Bestellung", ""],
  "/kasse/abgebrochen": ["Zahlung unterbrochen", ""],
  "/bestellung": ["Deine Bestellung", ""],
  "/versand": ["Versand und Abholung", ""],
  "/buchung": ["Deine Buchung", ""],
  "/konto": ["Dein Konto", ""],
};

export function pagesFor(platform: boolean) {
  return {
    publicPages: englishPublicPages
      .filter(
        (page) =>
          platform ||
          (page.path !== "/speisekarte" && page.path !== "/standorte"),
      )
      .map((page) => ({
        ...page,
        title: platform ? germanCopy[page.path][0] : page.title,
        description: platform ? germanCopy[page.path][1] : page.description,
      })),
    privatePages: englishPrivatePages.map((page) => ({
      ...page,
      title: platform ? germanCopy[page.path][0] : page.title,
    })),
  };
}
export const { publicPages, privatePages } = pagesFor(platformMode);
