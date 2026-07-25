import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Paylaşım (OG) görseli üreticisi — makale ve site geneli rotalarınca paylaşılır.
 *
 * Dosya yükleme/depolama altyapısı olmadığı için her görsel istek anında başlık + marka
 * renkleri + logodan üretilir. `satori` (ImageResponse'un altındaki motor) yalnızca sınırlı bir
 * CSS altkümesini destekler: her `div` için `display` açıkça verilmeli ve stiller inline olmalı.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const COLORS = {
  cream: "#F6F3EC",
  ink: "#1C2230",
  inkDeep: "#161B27",
  gold: "#9C7C4A",
  muted: "#5B6270",
  line: "#E4DFD5",
};

async function logoDataUri(): Promise<string> {
  const bytes = await readFile(join(process.cwd(), "public", "yaka-logo.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

export async function renderOgImage({
  eyebrow,
  title,
  footerLeft,
  footerRight,
}: {
  eyebrow: string;
  title: string;
  footerLeft: string;
  footerRight?: string;
}) {
  const logo = await logoDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: COLORS.cream,
          padding: "64px 72px",
          justifyContent: "space-between",
        }}
      >
        {/* Üst bant: logo + kategori */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" width={52} height={52} />
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 6,
                color: COLORS.ink,
                marginLeft: 18,
              }}
            >
              YAKA
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 3,
              color: COLORS.gold,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        </div>

        {/* Başlık */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 70 ? 58 : 72,
            fontWeight: 600,
            lineHeight: 1.14,
            color: COLORS.ink,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        {/* Alt bant: altın çizgi + adres */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ display: "flex", width: 96, height: 4, background: COLORS.gold }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              marginTop: 22,
              fontSize: 22,
              color: COLORS.muted,
            }}
          >
            <div style={{ display: "flex" }}>{footerLeft}</div>
            {footerRight ? (
              <div style={{ display: "flex", letterSpacing: 2, color: COLORS.gold }}>
                {footerRight}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
