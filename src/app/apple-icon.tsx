import { ImageResponse } from "next/og";

// ラスター（PNG）版のブランドアイコン。icon.svg に加え、Google 検索/iOS 等の
// ラスター前提のクライアント向けフォールバックとして apple-touch-icon を提供する。
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#1A1A1A",
          borderRadius: 40,
        }}
      >
        {/* ミ を思わせる3本のアイボリー ストローク */}
        <div style={{ position: "absolute", left: 40, top: 54, width: 68, height: 14, borderRadius: 7, backgroundColor: "#FAFAF7" }} />
        <div style={{ position: "absolute", left: 36, top: 83, width: 81, height: 14, borderRadius: 7, backgroundColor: "#FAFAF7" }} />
        <div style={{ position: "absolute", left: 32, top: 112, width: 95, height: 14, borderRadius: 7, backgroundColor: "#FAFAF7" }} />
        {/* 木目アクセントのドット */}
        <div style={{ position: "absolute", right: 34, bottom: 34, width: 20, height: 20, borderRadius: 10, backgroundColor: "#B8956A" }} />
      </div>
    ),
    { ...size },
  );
}
