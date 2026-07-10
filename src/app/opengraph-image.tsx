import { ImageResponse } from "next/og";

// サイト全体の OGP / Twitter 画像（コード生成）。
export const alt = "楽器卸のミツエス｜楽器・楽譜・音響機器の卸見積もり";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const EYEBROW = "MITSUESU MUSIC";
const TITLE = "楽器卸のミツエス";
const TAGLINE = "楽器・楽譜・音響機器の卸見積もり";
const URLTEXT = "www.mitsuesu-music.com";

// Google Fonts から必要な文字だけのサブセット TTF を取得（Satori 対応形式）。
async function loadNotoSansJp(weight: number): Promise<ArrayBuffer> {
  const text = EYEBROW + TITLE + TAGLINE + URLTEXT;
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const m = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?truetype/);
  if (!m) throw new Error("font subset not found");
  return await (await fetch(m[1])).arrayBuffer();
}

export default async function OpengraphImage() {
  const [regular, medium] = await Promise.all([
    loadNotoSansJp(400),
    loadNotoSansJp(500),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#FAFAF7",
          padding: "0 96px",
          fontFamily: "Noto Sans JP",
          position: "relative",
        }}
      >
        {/* 上部の木目アクセントバー */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            backgroundColor: "#B8956A",
          }}
        />

        {/* ロゴマーク + 英字ブランド */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 18,
              backgroundColor: "#1A1A1A",
              display: "flex",
              position: "relative",
              marginRight: 24,
            }}
          >
            <div style={{ position: "absolute", left: 18, top: 24, width: 30, height: 6, borderRadius: 3, backgroundColor: "#FAFAF7" }} />
            <div style={{ position: "absolute", left: 16, top: 37, width: 36, height: 6, borderRadius: 3, backgroundColor: "#FAFAF7" }} />
            <div style={{ position: "absolute", left: 14, top: 50, width: 42, height: 6, borderRadius: 3, backgroundColor: "#FAFAF7" }} />
            <div style={{ position: "absolute", right: 15, bottom: 15, width: 9, height: 9, borderRadius: 5, backgroundColor: "#B8956A" }} />
          </div>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 10,
              color: "#B8956A",
              fontWeight: 500,
            }}
          >
            {EYEBROW}
          </div>
        </div>

        {/* タイトル（日本語） */}
        <div
          style={{
            fontSize: 84,
            fontWeight: 500,
            color: "#1A1A1A",
            letterSpacing: 2,
            lineHeight: 1.15,
          }}
        >
          {TITLE}
        </div>

        {/* タグライン */}
        <div
          style={{
            fontSize: 34,
            fontWeight: 400,
            color: "#555555",
            marginTop: 26,
            letterSpacing: 1,
          }}
        >
          {TAGLINE}
        </div>

        {/* ドメイン */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: "#8A8A8A",
            marginTop: 46,
            letterSpacing: 2,
          }}
        >
          {URLTEXT}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans JP", data: regular, weight: 400, style: "normal" },
        { name: "Noto Sans JP", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
