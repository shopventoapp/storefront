import { brandingStylesheet } from "@shopvento/ui/branding";
import { ShopventoProvider } from "@shopvento/ui/forms";
import type { CSSProperties } from "react";
import { storefrontTokens } from "@/lib/branding-tokens";
import "@fontsource/bricolage-grotesque/latin-600.css";
import "@fontsource/source-sans-3/latin-400.css";
import "@shopvento/ui/styles.css";
import "@shopvento/ui/forms.css";
import "../globals.css";
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className="sv-redesign"
      style={storefrontTokens as CSSProperties}
    >
      <head>
        <link rel="stylesheet" href={brandingStylesheet} />
      </head>
      <body>
        <ShopventoProvider locale="de">{children}</ShopventoProvider>
      </body>
    </html>
  );
}
