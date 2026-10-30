import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Gute Zeit. Neue Entdeckungen.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function Image() {
  const font = await readFile(
    join(
      process.cwd(),
      "node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff",
    ),
  );
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "70px",
        background: "#f5e9e4",
        color: "#351c45",
        fontFamily: "Bricolage Grotesque",
      }}
    >
      <div style={{ fontSize: 32, display: "flex" }}>
        Gemeinsam etwas Neues entdecken.
      </div>
      <div
        style={{
          fontSize: 84,
          lineHeight: 1.1,
          fontWeight: 700,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span>Gute Zeit.</span>
        <span>Neue Entdeckungen.</span>
      </div>
      <div
        style={{
          display: "flex",
          background: "#ff685e",
          padding: "18px 24px",
          fontSize: 26,
          width: "560px",
          borderRadius: "14px",
        }}
      >
        Workshops · Verkostungen · Touren
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Bricolage Grotesque", data: font, weight: 600 }],
    },
  );
}
