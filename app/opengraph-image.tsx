import { ImageResponse } from "next/og";

export const alt = "Japan Customs Allowance Checker: duty-free allowance on arrival in Japan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "64px", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.28em", textTransform: "uppercase", color: "#f0b429" }}>Free · Arriving in Japan · Customs</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.05, letterSpacing: "-0.03em", maxWidth: 1050 }}>Is your duty-free haul within Japan&apos;s customs allowance?</div>
          <div style={{ display: "flex", fontSize: 30, color: "#9b9588", maxWidth: 1000, lineHeight: 1.35 }}>3 bottles · 200 cigarettes · 2 oz perfume · ¥200,000 goods · cash over ¥1M declared</div>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 22, color: "#9b9588" }}>
          <span style={{ color: "#99f6e4" }}>Duty estimate in yen</span>
          <span>Red or green channel</span>
          <span>Free JSON API · no login</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
