export const demoName = "Nebenan Atelier";

export const publicPages = [
  {
    path: "/",
    title: "Zeit für neue Entdeckungen",
    description:
      "Workshops, Verkostungen und kleine Entdeckungstouren. Finde Dein nächstes Erlebnis im Nebenan Atelier.",
  },
  {
    path: "/events",
    title: "Erlebnisse & Termine",
    description:
      "Entdecke kommende Workshops, Verkostungen und Touren und buche Deinen Platz.",
  },
  {
    path: "/shop/gutscheine",
    title: "Zeit verschenken",
    description:
      "Verschenke gemeinsame Zeit mit einem Gutschein für das Nebenan Atelier.",
  },
  {
    path: "/shop",
    title: "Entdeckungen für zu Hause",
    description:
      "Stöbere durch Produkte und Gutscheine aus dem Nebenan Atelier.",
  },
  {
    path: "/reservierung",
    title: "Deinen Besuch reservieren",
    description: "Plane Deinen Besuch und frage einen Platz im Atelier an.",
  },
  {
    path: "/newsletter",
    title: "Post aus dem Atelier",
    description:
      "Erfahre von neuen Terminen und Ideen. Melde Dich für den Newsletter an.",
  },
  {
    path: "/impressum",
    title: "Impressum – Platzhalter",
    description:
      "Dieser rechtliche Musterbereich muss vor Veröffentlichung ersetzt werden.",
  },
  {
    path: "/datenschutz",
    title: "Datenschutz – Platzhalter",
    description:
      "Dieser rechtliche Musterbereich muss vor Veröffentlichung ersetzt werden.",
  },
  {
    path: "/agb",
    title: "AGB – Platzhalter",
    description:
      "Dieser rechtliche Musterbereich muss vor Veröffentlichung ersetzt werden.",
  },
  {
    path: "/widerruf",
    title: "Widerruf – Platzhalter",
    description:
      "Dieser rechtliche Musterbereich muss vor Veröffentlichung ersetzt werden.",
  },
] as const;

export const privatePages = [
  { path: "/warenkorb", title: "Dein Warenkorb" },
  { path: "/kasse", title: "Zur Kasse" },
  { path: "/kasse/erfolg", title: "Deine Bestellung" },
  { path: "/kasse/abgebrochen", title: "Zahlung unterbrochen" },
  { path: "/bestellung", title: "Deine Bestellung" },
  { path: "/versand", title: "Versand & Abholung" },
  { path: "/buchung", title: "Deine Buchung" },
  { path: "/konto", title: "Dein Konto" },
] as const;

export function shellPath(path: string): string {
  if (path.startsWith("/shop/")) return "/shop";
  if (path.startsWith("/gutscheine/")) return "/gutscheine";
  if (path.startsWith("/konto/")) return "/konto";
  return path;
}
