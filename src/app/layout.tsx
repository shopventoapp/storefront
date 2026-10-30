import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { RuntimeProvider } from "@/components/runtime";
import { buildOrigin } from "@/lib/metadata";
import { demoName } from "@/lib/routes";
import "@fontsource/bricolage-grotesque/latin-600.css";
import "@fontsource/bricolage-grotesque/latin-700.css";
import "@fontsource/source-sans-3/latin-400.css";
import "@fontsource/source-sans-3/latin-600.css";
import "@shopvento/ui/styles.css";
import "@shopvento/ui/shop.css";
import "@shopvento/ui/shop-flow.css";
import "@shopvento/ui/forms.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(buildOrigin),
  title: { default: demoName, template: `%s · ${demoName}` },
  description: "Discover workshops, tastings and tours at Nebenan Atelier.",
};

const contract =
  "THESIS: Shared time starts with a real upcoming date. OWN-WORLD: Shopvento coral and aubergine, Bricolage Grotesque and Source Sans 3, open programme rows and 14px radii. STORY: Discover a date, book or give an experience, manage it in the account. FIRST VIEWPORT: Large welcome on the left, upcoming programme on the right, clear event action. FORM: open programme, grounded candidate 7, seed 0cb08445. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="sv-redesign">
      <head>
        <link rel="stylesheet" href="/branding/theme.css" />
      </head>
      <body>
        <div
          hidden
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Static build contract contains no external input.
          dangerouslySetInnerHTML={{ __html: `<!-- ${contract} -->` }}
        />
        <a className="skip-link" href="#inhalt">
          Skip to content
        </a>
        <RuntimeProvider>
          <SiteHeader />
          <main id="inhalt">{children}</main>
          <SiteFooter />
        </RuntimeProvider>
      </body>
    </html>
  );
}
