import { InputError, type Endpoint, type Input } from "./agent-api";
import { ALCOHOL_TYPES, DISCLAIMER, RuleInputError, checkAllowance } from "./customs";
import { parseCheckInput, toQuery } from "./parse";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const PUBLIC_URL = "https://japan-customs-allowance.vercel.app";
export const API_DISCLAIMER = DISCLAIMER;
export const API_INFO = { title: `${SITE_NAME} API`, description: SITE_TAGLINE, version: "1.0.0" };

export const EXAMPLE_GET = "/api/check?ageYears=35&alcoholBottles=4&alcoholType=whisky&cigarettes=200&goods=120000,130000";

export function computeCheck(input: Input) {
  try {
    const parsed = parseCheckInput(input);
    const result = checkAllowance(parsed);
    return { ...result, sharePath: `/r?${toQuery(parsed)}` };
  } catch (e) {
    if (e instanceof RuleInputError) throw new InputError(e.message);
    throw e;
  }
}

export const ENDPOINTS: Record<"check", Endpoint> = {
  check: {
    path: "/api/check",
    operationId: "japanCustomsAllowanceCheck",
    summary: "Japan Customs duty-free allowance check for travelers entering Japan, with estimated simplified duty in yen and cash declaration",
    description:
      "Per-person duty-free allowance when entering Japan (Japan Customs 7104/7105, as of 2026-10-14): alcohol 3 bottles of about 760 ml (2.28 L), cigarettes 200 OR cigars 50 OR heat-not-burn 10 packages (200 IQOS/glo sticks or 50 Ploom TECH capsules) OR other tobacco 250 g (more than one kind: 250 g total), perfume 2 oz (about 56 ml), other goods ¥200,000 total overseas value (an item kind worth ¥10,000 or less in total is free and not counted; an article worth over ¥200,000 is fully dutiable). Under 20: no alcohol or tobacco allowance; under 6: only items for the child. Accompanied and unaccompanied articles share one allowance. Excess is estimated with the simplified rates (7106): whisky/brandy ¥800/L, rum/gin/vodka ¥500/L, liqueur ¥400/L, distilled ¥300/L, wine/beer/other ¥200/L, cigarettes and heat-not-burn sticks ¥15 each, capsules ¥50 each, other articles 15% of Customs value (overseas price × 0.6), watches/golf clubs/PCs 10% consumption tax only; simplified rates are not applied to an article with Customs value over ¥100,000, cigars or other tobacco (simplifiedDutyApplicable false). Means of payment over ¥1,000,000 (¥100,000 bound for North Korea) must be declared. Returns per-category within/over, excess, estimatedSimplifiedDutyJPY (low) and estimatedSimplifiedDutyHighJPY (strict mixed-tobacco reading), breakdown by tax type truncated to ¥100 as in Customs' worked example, green/red channel, cashDeclarationRequired, warnings, assumptions, sources, rulesAsOf, sharePath, disclaimer. GET takes goods as CSV (80000,120000,150000w,3000x3 — w = duty-free-tariff article such as a watch, xN = quantity, c = for a child); POST takes goods as [{description, valueJPY, quantity, dutyFreeTariff, forChild}] and alcohol as [{type, ml, bottles}].",
    params: [
      { name: "ageYears", type: "number", minimum: 0, maximum: 120, description: "Traveler age. Under 20 = no alcohol/tobacco allowance; under 6 = only items for the child. Default: adult." },
      { name: "travelers", type: "integer", minimum: 1, maximum: 20, default: 1, description: "People in the same age band whose allowances are pooled (multiplies the per-person allowance)." },
      { name: "alcoholBottles", type: "integer", minimum: 0, description: "Bottles of alcohol. Without alcoholMl each bottle is assumed 760 ml." },
      { name: "alcoholMl", type: "number", minimum: 0, description: "Total alcohol volume in ml (allowance 2,280 ml per adult). Overrides the bottle assumption." },
      { name: "alcoholType", type: "string", enum: ALCOHOL_TYPES, default: "other", description: "Type for the simplified rate: whisky/brandy ¥800/L, rum/gin/vodka ¥500/L, liqueur ¥400/L, distilled (shochu) ¥300/L, wine/beer/other ¥200/L." },
      { name: "alcohol", type: "array", description: "POST: several drinks [{type, ml, bottles}]. GET: CSV type:ml, e.g. whisky:2280,brandy:700.", items: { type: "object", properties: { type: { type: "string", enum: ALCOHOL_TYPES }, ml: { type: "number" }, bottles: { type: "integer" } } }, postOnly: true },
      { name: "cigarettes", type: "integer", minimum: 0, description: "Cigarettes (allowance 200; a carton is 200)." },
      { name: "cigars", type: "integer", minimum: 0, description: "Cigars (allowance 50)." },
      { name: "hnbPackages", type: "integer", minimum: 0, description: "Heat-not-burn retail packs (allowance 10). A pack = 20 sticks, or 5 capsules if hnbType=capsules." },
      { name: "hnbSticks", type: "integer", minimum: 0, description: "Loose heat-not-burn sticks (IQOS / glo). Allowance 200." },
      { name: "hnbCapsules", type: "integer", minimum: 0, description: "Heat-not-burn capsules / cartridges (Ploom TECH / with). Allowance 50." },
      { name: "hnbType", type: "string", enum: ["sticks", "capsules"], default: "sticks", description: "What hnbPackages contain." },
      { name: "otherTobaccoGrams", type: "number", minimum: 0, description: "Pipe / roll-your-own / other tobacco in grams (allowance 250 g)." },
      { name: "perfumeMl", type: "number", minimum: 0, description: "Perfume in ml (allowance about 56 ml = 2 oz). Eau de toilette / cologne not counted." },
      { name: "perfumeOz", type: "number", minimum: 0, description: "Perfume in ounces (1 oz ≈ 28 ml)." },
      { name: "goods", type: "array", description: "Other articles. POST: [{description, valueJPY (overseas price of ONE article), quantity, dutyFreeTariff, forChild}]. GET: CSV like 80000,120000,150000w,3000x3.", items: { type: "object", properties: { description: { type: "string" }, valueJPY: { type: "number" }, quantity: { type: "integer" }, dutyFreeTariff: { type: "boolean" }, forChild: { type: "boolean" } }, required: ["valueJPY"] } },
      { name: "goodsTotalJPY", type: "number", minimum: 0, description: "Instead of goods: total overseas value of other articles (approximate check)." },
      { name: "cashJPY", type: "number", minimum: 0, description: "Cash (yen plus foreign currency in yen) carried by one person." },
      { name: "paymentInstrumentsJPY", type: "number", minimum: 0, description: "Checks, travelers checks, promissory notes, securities in yen." },
      { name: "boundForNorthKorea", type: "boolean", default: false, description: "Leaving Japan for North Korea: the declaration threshold is ¥100,000." },
      { name: "goldBullionKg", type: "number", minimum: 0, description: "Gold bullion carried, kg (over 1 kg of 90%+ purity must be declared)." },
    ],
    example: EXAMPLE_GET,
    compute: computeCheck,
  },
};

export const PLUGIN = {
  name: "Japan Customs Allowance Checker",
  nameForModel: "japan_customs_allowance",
  descriptionForHuman: "Japan customs allowance on arrival: alcohol, tobacco, perfume, ¥200k goods, duty, cash rule.",
  descriptionForModel:
    "Use when someone is flying or sailing into Japan and asks how much alcohol, how many cigarettes / IQOS sticks / cigars, how much perfume or how much shopping they can bring duty-free, whether they must declare, how much duty they would pay on the excess, or whether they must declare cash over ¥1,000,000. Deterministic, dated Japan Customs rules (as of 2026-10-14) with the official simplified duty rates and ¥100 rounding. Relay the disclaimer: educational estimate, not customs advice; the Customs officer decides.",
  logo: "/icon.svg",
};
