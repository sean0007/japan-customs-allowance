import { openapiDoc, preflight, staticJson } from "@/lib/agent-api";
import { API_INFO, ENDPOINTS, PUBLIC_URL } from "@/lib/api";

type Op = { parameters?: Record<string, unknown>[] };

export function GET() {
  const base = openapiDoc(API_INFO, PUBLIC_URL, Object.values(ENDPOINTS)) as {
    paths: Record<string, { get?: Op; post?: Op }>;
    [k: string]: unknown;
  };
  // GET also accepts goods and alcohol as compact CSV strings.
  base.paths["/api/check"].get?.parameters?.push(
    { name: "goods", in: "query", required: false, description: "Other goods as CSV of yen prices of one article: 80000,120000,150000w,3000x3 (xN = quantity, w = duty-free-tariff article like a watch / golf clubs / PC, c = for a child under 6).", schema: { type: "string" } },
    { name: "alcohol", in: "query", required: false, description: "Several drinks as CSV type:ml, e.g. whisky:2280,brandy:700.", schema: { type: "string" } },
  );
  const rules = {
    operationId: "japanCustomsAllowanceRules",
    summary: "Full Japan Customs duty-free allowance table, simplified duty rates, cash declaration rule, assumptions and sources",
    description: "Returns the dated per-person allowance (alcohol, tobacco, perfume, other goods), age rules, simplified duty rates (7106) and where they do not apply, the means-of-payment declaration thresholds, the assumptions this calculator makes, sources and the disclaimer. No inputs.",
    responses: { "200": { description: "Rules JSON with rulesAsOf and sources.", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } } },
  };
  (base.paths as Record<string, unknown>)["/api/rules"] = { get: rules, post: { ...rules, operationId: "japanCustomsAllowanceRulesPost" } };
  return staticJson(base);
}
export const OPTIONS = preflight;
