import { ImageResponse } from "next/og";
import { checkAllowance } from "@/lib/customs";
import { EXAMPLE_SHARED, overText, parseShared, yen } from "@/lib/share";

export async function GET(req: Request) {
  const shared = parseShared(new URL(req.url).searchParams) ?? EXAMPLE_SHARED;
  const r = checkAllowance(shared);
  const items = [
    r.alcohol.declaredMl > 0 && { label: "alcohol", ok: r.alcohol.withinAllowance, value: `${(r.alcohol.declaredMl / 1000).toFixed(2)} L` },
    r.tobacco.kinds.length > 0 && { label: "tobacco", ok: r.tobacco.withinAllowance, value: r.tobacco.kinds.map((k) => `${k.quantity} ${k.unit}`).join(" + ") },
    r.perfume.declaredMl > 0 && { label: "perfume", ok: r.perfume.withinAllowance, value: `${r.perfume.declaredMl} ml` },
    r.otherGoods.mode !== "none" && { label: "goods", ok: r.otherGoods.withinAllowance, value: yen(r.otherGoods.countedValueJPY) },
    r.cash.totalJPY > 0 && { label: "cash", ok: !r.cashDeclarationRequired, value: yen(r.cash.totalJPY) },
  ].filter(Boolean) as { label: string; ok: boolean; value: string }[];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f0b429" }}>Japan Customs Allowance</div>
          <div style={{ display: "flex", fontSize: 22, color: "#9b9588" }}>rules {r.rulesAsOf}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 32, color: "#c9c3b6" }}>{r.withinAllowance ? "Within the duty-free allowance" : `Over on ${overText(r.overCategories)}`}</div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 6 }}>
            <span style={{ fontSize: 112, fontWeight: 800, letterSpacing: "-0.04em", color: r.withinAllowance ? "#99f6e4" : "#f0b429", lineHeight: 1 }}>{r.withinAllowance ? "¥0 duty" : `≈ ${yen(r.estimatedSimplifiedDutyJPY)}`}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {items.slice(0, 4).map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", flex: 1, border: `2px solid ${s.ok ? "#23252c" : "#7f1d1d"}`, borderRadius: 24, padding: "14px 20px", background: "#101218" }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: "#f3efe4" }}>{s.value}</span>
              <span style={{ fontSize: 20, color: s.ok ? "#9b9588" : "#fca5a5" }}>
                {s.label} · {s.ok ? "ok" : s.label === "cash" ? "declare" : "over"}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#6f6a60" }}>
          <span>japan-customs-allowance.vercel.app · free, no login</span>
          <span>Estimate. The Customs officer decides.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
