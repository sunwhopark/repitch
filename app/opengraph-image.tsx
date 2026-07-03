import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Node runtime so we can read the logo + fonts from the filesystem.
export const runtime = "nodejs";

export const alt = "repitch — 크리에이터가 먼저 제안하는 시대";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [logo, medium] = await Promise.all([
    readFile(join(process.cwd(), "public/repitch_wordmark.png")),
    readFile(
      join(process.cwd(), "Pretendard-1/web/static/woff/Pretendard-Medium.woff"),
    ),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          fontFamily: "Pretendard",
          padding: "0 70px",
          gap: 48,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={300} height={106} alt="repitch" />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 42, fontWeight: 500, color: "#52525b" }}>
            크리에이터가 먼저 제안하는 시대,
          </div>
          <div style={{ fontSize: 42, fontWeight: 500, color: "#52525b" }}>
            진정성과 수익성 모두 잡는 협업의 시작
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: medium, style: "normal", weight: 500 },
      ],
    },
  );
}
