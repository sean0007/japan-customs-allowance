# Japan Customs Allowance Checker

Free, unofficial checker for **Japan Customs' duty-free allowance** for travelers entering Japan: alcohol, tobacco, perfume and ¥200,000 of other goods per person, with an estimated simplified duty in yen and the cash-over-¥1,000,000 declaration rule.

- Live: https://japan-customs-allowance.vercel.app
- API: `GET/POST /api/check`, `GET/POST /api/rules`
- Agent docs: `/llms.txt`, `/openapi.json`, `/.well-known/ai-plugin.json`
- MCP tool: `japan_customs_allowance_check` on https://free-agent-tools.vercel.app/mcp

**Educational estimate, not customs, tax or legal advice. Not affiliated with Japan Customs.** The Customs officer's assessment is final.

## Example

```
GET https://japan-customs-allowance.vercel.app/api/check?ageYears=35&alcoholBottles=4&alcoholType=whisky&cigarettes=200&goods=120000,130000
```
→ `withinAllowance: false`, `overCategories: ["alcohol","otherGoods"]`, `estimatedSimplifiedDutyJPY: 11400` (whisky 0.76 L × ¥800 = ¥608 → ¥600; the ¥130,000 item is exempted, the ¥120,000 item pays 15% × ¥72,000 = ¥10,800).

```
curl -X POST https://japan-customs-allowance.vercel.app/api/check -H 'Content-Type: application/json' \
  -d '{"alcohol":[{"type":"whisky","bottles":3},{"type":"brandy","ml":700}],"cigarettes":400,"hnbPackages":10,"hnbType":"capsules","goods":[{"description":"Handbag","valueJPY":80000},{"description":"Ring","valueJPY":120000},{"description":"Clothes","valueJPY":50000},{"description":"Watch","valueJPY":150000,"dutyFreeTariff":true}]}'
```
→ Japan Customs' own worked example (zeigaku.htm): `estimatedSimplifiedDutyHighJPY: 19400` (matches the official ¥19,400), `estimatedSimplifiedDutyJPY: 18800` under the 250 g mixed-tobacco reading.

## Rules implemented (checked 2026-10-14 JST)

- Per adult (20+): alcohol 3 bottles × 760 ml (assessed as 2,280 ml); cigarettes 200 / cigars 50 / heat-not-burn 10 packages (200 sticks, 50 capsules) / other tobacco 250 g, mixed kinds 250 g total; perfume 2 oz ≈ 56 ml; other goods ¥200,000 total overseas value, item kinds ≤ ¥10,000 excluded, articles > ¥200,000 fully dutiable. Under 20: no alcohol/tobacco. Under 6: only children's items.
- Simplified rates (7106) on the excess, Customs value = overseas price × 0.6, each tax type truncated to ¥100. Not applied (flagged `simplifiedDutyApplicable: false`) to articles with Customs value > ¥100,000, cigars and other tobacco.
- Means of payment > ¥1,000,000 (¥100,000 bound for North Korea) → declaration form; gold bullion > 1 kg too.
- Assumptions (tobacco weights, bottle size, best-subset exemption, travelers pooling) are listed in `lib/customs.ts`, `/api/rules` and `/legal/disclaimer`.

Snapshots of the official pages: `money-research/customs-allowance-sources/` on the build box.

## Honest comparison

- **Lanrenkit customs-duty-free** is a human-only within/over check (data as of 2026-08-08): no excess-duty yen, no cash declaration, no keyless API or MCP.
- **japan-tariff-mcp** covers commercial HS-code tariffs, not passenger allowances.
- **TravelSafe Japan** has a Visit Japan Web guide but no customs allowance calculator API.
- This tool is an estimate built from public pages; it does not know your product's HS code, the weekly exchange rate Customs uses, or how an officer will classify your goods.

## Dev

```
npm ci
npm test
npm run build
```

MIT license.
