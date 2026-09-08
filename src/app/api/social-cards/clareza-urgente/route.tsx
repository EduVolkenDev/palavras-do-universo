import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { normalizeLocale, type Locale } from "@/lib/i18n/config";

const size = {
  width: 1200,
  height: 630,
};

const readingArt = await readFile(
  join(process.cwd(), "public", "assets", "clareza-urgente-social.png")
);
const readingArtSource = `data:image/png;base64,${readingArt.toString("base64")}`;

const COPY: Record<Locale, { eyebrow: string; title: string; lead: string }> = {
  "pt-BR": {
    eyebrow: "Palavras do Universo",
    title: "Clareza Urgente",
    lead: "Uma leitura para quando o ruído aperta.",
  },
  en: {
    eyebrow: "Palavras do Universo",
    title: "Urgent Clarity",
    lead: "A reading for when the noise gets loud.",
  },
};

export async function GET(request: Request) {
  const locale = normalizeLocale(new URL(request.url).searchParams.get("lang"));
  const copy = COPY[locale];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#0b0910",
          color: "#fff6e5",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 18% 16%, rgba(244, 213, 141, 0.2), transparent 30%), radial-gradient(circle at 78% 58%, rgba(88, 102, 188, 0.32), transparent 42%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 56,
            right: 56,
            height: 1,
            display: "flex",
            background: "rgba(244, 213, 141, 0.46)",
          }}
        />
        <div
          style={{
            width: "56%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 0 56px 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#f4d58d",
              fontFamily: "sans-serif",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            {copy.eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              maxWidth: 560,
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1.03,
            }}
          >
            {copy.title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              color: "#d8d0c9",
              fontFamily: "sans-serif",
              fontSize: 25,
              lineHeight: 1.35,
            }}
          >
            {copy.lead}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 36,
            bottom: 30,
            width: 482,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* ImageResponse renders a standalone PNG, so next/image cannot optimize this source. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={readingArtSource}
            width="500"
            height="500"
            style={{
              display: "flex",
              width: 500,
              height: 500,
              objectFit: "cover",
              borderRadius: 250,
              border: "1px solid rgba(244, 213, 141, 0.54)",
              boxShadow: "0 30px 70px rgba(0, 0, 0, 0.45)",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
