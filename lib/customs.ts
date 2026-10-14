// Japan Customs duty-free allowance for travelers entering Japan, plus a simplified-duty estimate.
// Pure, deterministic logic. Every number below comes from Japan Customs pages listed in SOURCES,
// snapshotted on RULES_AS_OF. Educational estimate only: the Customs officer's assessment is final.

export const RULES_AS_OF = "2026-10-14";

export const DISCLAIMER =
  "Educational estimate only, not customs, tax or legal advice. Not affiliated with Japan Customs (税関) or the Ministry of Finance. Allowances and rates can change, and the Customs officer's assessment at the airport or port is final.";

export const SOURCES = [
  "https://www.customs.go.jp/english/summary/passenger.htm",
  "https://www.customs.go.jp/english/c-answer_e/keitaibetsuso/7104-2_e.htm",
  "https://www.customs.go.jp/english/c-answer_e/keitaibetsuso/7105_e.htm",
  "https://www.customs.go.jp/english/c-answer_e/keitaibetsuso/7106_e.htm",
  "https://www.customs.go.jp/kaigairyoko/zeigaku.htm",
  "https://www.customs.go.jp/kaigairyoko/menzei.htm",
  "https://www.customs.go.jp/english/summary/cigarette_leaflet_e.pdf",
] as const;

export class RuleInputError extends Error {}

/* ---------------- Allowances (per person, age 20+) ---------------- */

export const ALLOWANCE = {
  alcoholBottles: 3,
  bottleMl: 760,
  alcoholMl: 2280,
  cigarettes: 200,
  cigars: 50,
  hnbPackages: 10,
  hnbSticks: 200,
  hnbCapsules: 50,
  otherTobaccoGrams: 250,
  mixedTobaccoGrams: 250,
  perfumeOz: 2,
  perfumeMl: 56,
  otherGoodsJPY: 200_000,
  smallItemJPY: 10_000,
} as const;

export const ML_PER_OZ = 28;
export const ADULT_AGE = 20;
export const CHILD_AGE = 6;

export const CASH_THRESHOLD_JPY = 1_000_000;
export const CASH_THRESHOLD_NORTH_KOREA_JPY = 100_000;
export const GOLD_DECLARATION_KG = 1;

/* ---------------- Simplified duty rates (7106) ---------------- */

export const ALCOHOL_TYPES = ["whisky", "brandy", "rum", "gin", "vodka", "liqueur", "distilled", "wine", "beer", "other"] as const;
export type AlcoholType = (typeof ALCOHOL_TYPES)[number];

export const ALCOHOL_RATE_PER_L: Record<AlcoholType, number> = {
  whisky: 800,
  brandy: 800,
  rum: 500,
  gin: 500,
  vodka: 500,
  liqueur: 400,
  distilled: 300,
  wine: 200,
  beer: 200,
  other: 200,
};

export const ALCOHOL_LABEL: Record<AlcoholType, string> = {
  whisky: "Whisky",
  brandy: "Brandy",
  rum: "Rum",
  gin: "Gin",
  vodka: "Vodka",
  liqueur: "Liqueur",
  distilled: "Distilled spirits (shochu etc.)",
  wine: "Wine",
  beer: "Beer",
  other: "Other liquor",
};

export const TOBACCO_RATE = { cigaretteJPY: 15, hnbStickJPY: 15, hnbCapsuleJPY: 50 } as const;
export const GOODS_SIMPLIFIED_RATE = 0.15;
/** Customs value of souvenirs = overseas retail price × 0.6 (zeigaku.htm). */
export const CUSTOMS_VALUE_RATIO = 0.6;
/** Simplified rates do not apply to an article or set whose Customs value exceeds ¥100,000. */
export const SIMPLIFIED_MAX_CUSTOMS_VALUE_JPY = 100_000;
/** Duty-free-tariff articles (watches, golf clubs, PCs...) pay consumption tax only: 7.8% national + 22/78 local = 10%. */
export const CONSUMPTION_NATIONAL_RATE = 0.078;
export const LOCAL_CONSUMPTION_RATIO = 22 / 78;
/** passenger.htm: dutiable goods over ¥300,000 need commercial-cargo procedures. */
export const COMMERCIAL_THRESHOLD_JPY = 300_000;

/* ---------------- Tobacco weight assumptions (mixed-kind 250 g rule) ---------------- */

export const STICKS_PER_HNB_PACKAGE = 20;
export const CAPSULES_PER_HNB_PACKAGE = 5;
export const TOBACCO_GRAMS = { cigarette: 1, cigar: 5, hnbStick: 1, hnbCapsule: 4 } as const;
export const HNB_TYPES = ["sticks", "capsules"] as const;
export type HnbType = (typeof HNB_TYPES)[number];

export const ASSUMPTIONS = [
  `Alcohol is assessed by volume: 3 bottles × ${ALLOWANCE.bottleMl} ml = ${ALLOWANCE.alcoholMl} ml per adult. If you give only a bottle count, each bottle is assumed to be ${ALLOWANCE.bottleMl} ml. When drinks of different types exceed the allowance, the allowance is applied to the highest-rate drink first (Customs chooses in the traveler's favor).`,
  `Heat-not-burn: 10 individual packages = ${ALLOWANCE.hnbSticks} sticks (IQOS / glo, ${STICKS_PER_HNB_PACKAGE} per pack) or ${ALLOWANCE.hnbCapsules} capsules (Ploom TECH / with type, ${CAPSULES_PER_HNB_PACKAGE} per pack), per Japan Customs' own examples.`,
  `More than one kind of tobacco: the English rule says the total allowance is 250 g. For that reading we use cigarette ≈ ${TOBACCO_GRAMS.cigarette} g, cigar ≈ ${TOBACCO_GRAMS.cigar} g, heat-not-burn stick ≈ ${TOBACCO_GRAMS.hnbStick} g, heat-not-burn capsule ≈ ${TOBACCO_GRAMS.hnbCapsule} g (one pack ≈ 20 cigarettes), cap each kind at its single-kind allowance, and use the 250 g on cigars / other tobacco first, then cigarettes and sticks, then capsules. Japan Customs' own worked example (zeigaku.htm) instead exempts only the one most favorable kind in full and taxes the rest, so the high estimate uses that stricter reading.`,
  `Perfume: 2 oz ≈ ${ALLOWANCE.perfumeMl} ml (1 oz ≈ ${ML_PER_OZ} ml). Eau de toilette and eau de cologne are not counted as perfume (menzei.htm).`,
  `Other goods: a line (one kind of item) whose total overseas value is ¥10,000 or less is free and not counted (menzei.htm: 1品目ごとの合計額が1万円以下). Each article worth more than ¥200,000 is fully dutiable. The ¥200,000 is then filled with the articles that save the most duty (best-subset search).`,
  `Customs value = overseas retail price × ${CUSTOMS_VALUE_RATIO} (zeigaku.htm). Simplified 15% applies to that Customs value; articles whose Customs value exceeds ¥100,000 (overseas price above about ¥166,667) use the general tariff and are not estimated. Duty-free-tariff articles (wristwatches, golf clubs, PCs, loose gemstones, paintings) pay 10% consumption tax only.`,
  `Rounding follows the official example: yen are truncated per line, then each tax type (liquor tax, tobacco tax, customs duty, consumption tax) is truncated to ¥100; the consumption tax base is truncated to ¥1,000.`,
  `travelers multiplies the per-person allowance and assumes everyone is in the same age band; articles are pooled. Run minors separately for an exact split.`,
];

/* ---------------- Types ---------------- */

export type AlcoholItem = { type: AlcoholType; ml: number; bottles?: number | null; mlAssumed?: boolean };
export type GoodsItem = { description?: string; valueJPY: number; quantity?: number; dutyFreeTariff?: boolean; forChild?: boolean };

export type CheckInput = {
  ageYears?: number | null;
  travelers?: number;
  alcohol?: AlcoholItem[];
  cigarettes?: number;
  cigars?: number;
  hnbType?: HnbType;
  /** Individual heat-not-burn units (sticks or capsules, by hnbType), packs already converted. */
  hnbUnits?: number;
  otherTobaccoGrams?: number;
  perfumeMl?: number;
  goods?: GoodsItem[];
  goodsTotalJPY?: number | null;
  cashJPY?: number;
  paymentInstrumentsJPY?: number;
  boundForNorthKorea?: boolean;
  goldBullionKg?: number;
};

const floor100 = (n: number) => Math.floor(n / 100) * 100;
const floor1000 = (n: number) => Math.floor(n / 1000) * 1000;
const yen = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;

export type AgeBand = "adult" | "minor" | "child_under_6";
export function ageBand(age: number | null | undefined): AgeBand {
  if (age === null || age === undefined) return "adult";
  if (age < CHILD_AGE) return "child_under_6";
  if (age < ADULT_AGE) return "minor";
  return "adult";
}

/* ---------------- Alcohol ---------------- */

function checkAlcohol(items: AlcoholItem[], band: AgeBand, travelers: number) {
  const allowanceMl = band === "adult" ? ALLOWANCE.alcoholMl * travelers : 0;
  const declaredMl = items.reduce((s, i) => s + i.ml, 0);
  const bottleCounts = items.map((i) => i.bottles).filter((b): b is number => typeof b === "number");
  const declaredBottles = bottleCounts.length === items.length && items.length ? bottleCounts.reduce((s, b) => s + b, 0) : null;
  // Traveler's favor: allowance goes to the highest-rate drink first.
  const order = items.map((it, idx) => ({ it, idx })).sort((a, b) => ALCOHOL_RATE_PER_L[b.it.type] - ALCOHOL_RATE_PER_L[a.it.type]);
  let left = allowanceMl;
  const lines: { type: AlcoholType; label: string; ml: number; bottles: number | null; freeMl: number; excessMl: number; ratePerLiterJPY: number; dutyJPY: number }[] = new Array(items.length);
  for (const { it, idx } of order) {
    const free = Math.min(it.ml, left);
    left -= free;
    const excessMl = it.ml - free;
    const rate = ALCOHOL_RATE_PER_L[it.type];
    lines[idx] = { type: it.type, label: ALCOHOL_LABEL[it.type], ml: it.ml, bottles: it.bottles ?? null, freeMl: free, excessMl, ratePerLiterJPY: rate, dutyJPY: Math.floor((excessMl * rate) / 1000) };
  }
  const excessMl = Math.max(0, declaredMl - allowanceMl);
  return {
    allowanceMl,
    allowanceBottles: band === "adult" ? ALLOWANCE.alcoholBottles * travelers : 0,
    declaredMl,
    declaredBottles,
    withinAllowance: excessMl === 0,
    excessMl,
    excessLiters: Math.round(excessMl) / 1000,
    lines,
    dutyJPY: lines.reduce((s, l) => s + l.dutyJPY, 0),
  };
}

/* ---------------- Tobacco ---------------- */

type TobaccoKindId = "cigarettes" | "cigars" | "heatNotBurn" | "otherTobacco";
type Kind = { id: TobaccoKindId; quantity: number; unit: string; singleAllowance: number; grams: number; rate: number | null; priority: number };

function tobaccoKinds(i: CheckInput, travelers: number): Kind[] {
  const capsules = i.hnbType === "capsules";
  const kinds: Kind[] = [
    { id: "cigars", quantity: i.cigars ?? 0, unit: "cigars", singleAllowance: ALLOWANCE.cigars * travelers, grams: TOBACCO_GRAMS.cigar, rate: null, priority: 0 },
    { id: "otherTobacco", quantity: i.otherTobaccoGrams ?? 0, unit: "g", singleAllowance: ALLOWANCE.otherTobaccoGrams * travelers, grams: 1, rate: null, priority: 0 },
    { id: "cigarettes", quantity: i.cigarettes ?? 0, unit: "cigarettes", singleAllowance: ALLOWANCE.cigarettes * travelers, grams: TOBACCO_GRAMS.cigarette, rate: TOBACCO_RATE.cigaretteJPY, priority: 1 },
    {
      id: "heatNotBurn",
      quantity: i.hnbUnits ?? 0,
      unit: capsules ? "capsules" : "sticks",
      singleAllowance: (capsules ? ALLOWANCE.hnbCapsules : ALLOWANCE.hnbSticks) * travelers,
      grams: capsules ? TOBACCO_GRAMS.hnbCapsule : TOBACCO_GRAMS.hnbStick,
      rate: capsules ? TOBACCO_RATE.hnbCapsuleJPY : TOBACCO_RATE.hnbStickJPY,
      priority: capsules ? 2 : 1,
    },
  ];
  return kinds.filter((k) => k.quantity > 0);
}

function tobaccoDuty(kinds: Kind[], free: Record<string, number>) {
  let known = 0;
  let unknownExcess = false;
  let tobaccoTax = 0; // cigarettes + sticks (tobacco tax bucket)
  let customsDuty = 0; // capsules (customs duty bucket, per zeigaku example)
  const rows = kinds.map((k) => {
    const f = free[k.id] ?? 0;
    const excess = k.quantity - f;
    const duty = k.rate === null ? null : excess * k.rate;
    if (duty === null && excess > 0) unknownExcess = true;
    if (duty !== null) {
      known += duty;
      if (k.id === "heatNotBurn" && k.unit === "capsules") customsDuty += duty;
      else tobaccoTax += duty;
    }
    return { id: k.id, quantity: k.quantity, unit: k.unit, singleKindAllowance: k.singleAllowance, free: f, excess, ratePerUnitJPY: k.rate, dutyJPY: excess > 0 ? duty : 0 };
  });
  return { rows, known, unknownExcess, tobaccoTax, customsDuty };
}

function checkTobacco(i: CheckInput, band: AgeBand, travelers: number) {
  const kinds = tobaccoKinds(i, travelers);
  const mixed = kinds.length > 1;
  const adult = band === "adult";
  const budgetG = adult ? ALLOWANCE.mixedTobaccoGrams * travelers : 0;

  // Reading A (main / low): single kind = its own allowance; mixed = 250 g pooled.
  const freeA: Record<string, number> = {};
  let gramsUsed = 0;
  if (adult) {
    if (!mixed) for (const k of kinds) freeA[k.id] = Math.min(k.quantity, k.singleAllowance);
    else {
      let left = budgetG;
      for (const k of [...kinds].sort((a, b) => a.priority - b.priority)) {
        const f = Math.min(k.quantity, k.singleAllowance, Math.floor(left / k.grams));
        freeA[k.id] = f;
        left -= f * k.grams;
        gramsUsed += f * k.grams;
      }
    }
  }
  // Reading B (strict / high): only the one most favorable kind is exempt in full (zeigaku.htm worked example).
  const freeB: Record<string, number> = {};
  let strictKind: TobaccoKindId | null = null;
  if (adult && kinds.length) {
    const best = [...kinds].sort((a, b) => {
      const va = a.rate === null ? Infinity : Math.min(a.quantity, a.singleAllowance) * a.rate;
      const vb = b.rate === null ? Infinity : Math.min(b.quantity, b.singleAllowance) * b.rate;
      return vb - va;
    })[0];
    strictKind = best.id;
    freeB[best.id] = Math.min(best.quantity, best.singleAllowance);
  }
  const a = tobaccoDuty(kinds, freeA);
  const b = tobaccoDuty(kinds, freeB);
  const withinA = a.rows.every((r) => r.excess === 0);
  const withinB = b.rows.every((r) => r.excess === 0);
  return {
    kinds: a.rows,
    mixedKinds: mixed,
    mixedAllowanceGrams: mixed ? budgetG : null,
    mixedGramsUsed: mixed ? gramsUsed : null,
    withinAllowance: withinA,
    simplifiedDutyApplicable: !a.unknownExcess,
    dutyJPY: a.known,
    buckets: { tobaccoTax: a.tobaccoTax, customsDuty: a.customsDuty },
    strictReading: mixed
      ? { exemptKind: strictKind, kinds: b.rows, withinAllowance: withinB, dutyJPY: b.known, simplifiedDutyApplicable: !b.unknownExcess, buckets: { tobaccoTax: b.tobaccoTax, customsDuty: b.customsDuty } }
      : null,
  };
}

/* ---------------- Perfume ---------------- */

function checkPerfume(ml: number, band: AgeBand, travelers: number) {
  const allowanceMl = band === "child_under_6" ? 0 : ALLOWANCE.perfumeMl * travelers;
  const excessMl = Math.max(0, ml - allowanceMl);
  return { allowanceMl, allowanceOz: band === "child_under_6" ? 0 : ALLOWANCE.perfumeOz * travelers, declaredMl: ml, withinAllowance: excessMl === 0, excessMl };
}

/* ---------------- Other goods ---------------- */

export type GoodsTreatment = "excluded_under_10k" | "free" | "dutiable" | "dutiable_over_200k" | "partly_free";
type Unit = { line: number; value: number; tax: number };

/** Best subset of units (sum of value ≤ cap) that maximises the tax saved. Exact for small inputs, ¥-granular DP otherwise. */
export function bestSubset(units: { value: number; tax: number }[], cap: number): boolean[] {
  const n = units.length;
  const chosen = new Array<boolean>(n).fill(false);
  if (!n || cap <= 0) return chosen;
  const total = units.reduce((s, u) => s + u.value, 0);
  if (total <= cap) return chosen.fill(true);
  const MAX_CELLS = 8_000_000;
  const g = Math.max(1, Math.ceil((n * (cap + 1)) / MAX_CELLS));
  const C = Math.floor(cap / g);
  const w = units.map((u) => Math.ceil(u.value / g));
  const best = new Float64Array(C + 1);
  const keep = new Uint8Array(n * (C + 1));
  for (let k = 0; k < n; k++) {
    const wk = w[k];
    const vk = units[k].tax + 1e-6 * units[k].value; // tie-break: exempt more value
    for (let c = C; c >= wk; c--) {
      const cand = best[c - wk] + vk;
      if (cand > best[c]) {
        best[c] = cand;
        keep[k * (C + 1) + c] = 1;
      }
    }
  }
  let c = C;
  for (let k = n - 1; k >= 0; k--) {
    if (keep[k * (C + 1) + c]) {
      chosen[k] = true;
      c -= w[k];
    }
  }
  return chosen;
}

function unitTaxProxy(value: number, dutyFreeTariff: boolean) {
  const cv = Math.floor(value * CUSTOMS_VALUE_RATIO);
  return dutyFreeTariff ? cv * 0.1 : cv * GOODS_SIMPLIFIED_RATE;
}

function checkGoods(goods: GoodsItem[] | undefined, goodsTotalJPY: number | null | undefined, band: AgeBand, travelers: number) {
  const allowanceJPY = ALLOWANCE.otherGoodsJPY * travelers;
  const child = band === "child_under_6";
  if (goods && goods.length) {
    const units: Unit[] = [];
    const lines = goods.map((g, line) => {
      const qty = g.quantity ?? 1;
      const lineValue = g.valueJPY * qty;
      const eligible = !child || !!g.forChild;
      const small = eligible && lineValue <= ALLOWANCE.smallItemJPY;
      if (!small && eligible && g.valueJPY <= ALLOWANCE.otherGoodsJPY) for (let q = 0; q < qty; q++) units.push({ line, value: g.valueJPY, tax: unitTaxProxy(g.valueJPY, !!g.dutyFreeTariff) });
      return { g, qty, lineValue, eligible, small };
    });
    const pick = bestSubset(units, child ? allowanceJPY : allowanceJPY);
    const freeUnits = new Array<number>(goods.length).fill(0);
    units.forEach((u, idx) => {
      if (pick[idx]) freeUnits[u.line] += 1;
    });

    let excludedSmallJPY = 0;
    let freeValueJPY = 0;
    let dutiableValueJPY = 0;
    let goods15CustomsValue = 0;
    let consumptionCustomsValue = 0;
    const generalTariff: string[] = [];
    const items = lines.map(({ g, qty, lineValue, eligible, small }, idx) => {
      const cv = Math.floor(g.valueJPY * CUSTOMS_VALUE_RATIO);
      const label = g.description?.trim() || `Item ${idx + 1}`;
      const base = { description: label, unitValueJPY: g.valueJPY, quantity: qty, lineValueJPY: lineValue, dutyFreeTariff: !!g.dutyFreeTariff, forChild: !!g.forChild, customsValuePerUnitJPY: cv };
      if (small) {
        excludedSmallJPY += lineValue;
        return { ...base, treatment: "excluded_under_10k" as GoodsTreatment, freeUnits: qty, dutiableUnits: 0, rate: null, estimatedTaxJPY: 0 };
      }
      const free = freeUnits[idx];
      const dutiable = qty - free;
      freeValueJPY += free * g.valueJPY;
      dutiableValueJPY += dutiable * g.valueJPY;
      let rate: "15%" | "consumption_tax_10%" | "general_tariff" | null = null;
      let est: number | null = 0;
      if (dutiable > 0) {
        if (g.dutyFreeTariff) {
          rate = "consumption_tax_10%";
          consumptionCustomsValue += cv * dutiable;
          est = Math.floor(cv * dutiable * 0.1);
        } else if (cv > SIMPLIFIED_MAX_CUSTOMS_VALUE_JPY) {
          rate = "general_tariff";
          est = null;
          generalTariff.push(label);
        } else {
          rate = "15%";
          goods15CustomsValue += cv * dutiable;
          est = Math.floor(cv * dutiable * GOODS_SIMPLIFIED_RATE);
        }
      }
      const treatment: GoodsTreatment = dutiable === 0 ? "free" : free > 0 ? "partly_free" : eligible && g.valueJPY > ALLOWANCE.otherGoodsJPY ? "dutiable_over_200k" : "dutiable";
      return { ...base, treatment, freeUnits: free, dutiableUnits: dutiable, rate, estimatedTaxJPY: est };
    });
    const countedValueJPY = items.filter((x) => x.treatment !== "excluded_under_10k").reduce((s, x) => s + x.lineValueJPY, 0);
    return {
      mode: "items" as const,
      allowanceJPY,
      countedValueJPY,
      excludedSmallItemsJPY: excludedSmallJPY,
      freeValueJPY,
      dutiableValueJPY,
      withinAllowance: dutiableValueJPY === 0,
      items,
      goods15CustomsValue,
      consumptionCustomsValue,
      generalTariff,
    };
  }
  if (goodsTotalJPY !== null && goodsTotalJPY !== undefined && goodsTotalJPY > 0) {
    const cap = child ? 0 : allowanceJPY;
    const dutiable = Math.max(0, goodsTotalJPY - cap);
    return {
      mode: "total" as const,
      allowanceJPY,
      countedValueJPY: goodsTotalJPY,
      excludedSmallItemsJPY: 0,
      freeValueJPY: goodsTotalJPY - dutiable,
      dutiableValueJPY: dutiable,
      withinAllowance: dutiable === 0,
      items: [],
      goods15CustomsValue: Math.floor(dutiable * CUSTOMS_VALUE_RATIO),
      consumptionCustomsValue: 0,
      generalTariff: [] as string[],
    };
  }
  return { mode: "none" as const, allowanceJPY, countedValueJPY: 0, excludedSmallItemsJPY: 0, freeValueJPY: 0, dutiableValueJPY: 0, withinAllowance: true, items: [], goods15CustomsValue: 0, consumptionCustomsValue: 0, generalTariff: [] as string[] };
}

/* ---------------- Cash / means of payment ---------------- */

export function checkCash(cashJPY = 0, instrumentsJPY = 0, northKorea = false) {
  const totalJPY = cashJPY + instrumentsJPY;
  const thresholdJPY = northKorea ? CASH_THRESHOLD_NORTH_KOREA_JPY : CASH_THRESHOLD_JPY;
  const required = totalJPY > thresholdJPY;
  return {
    totalJPY,
    thresholdJPY,
    boundForNorthKorea: northKorea,
    declarationRequired: required,
    form: required ? "Declaration of Carrying of Means of Payment, etc. (支払手段等の携帯輸出・輸入申告書)" : null,
    rule: `Cash (yen or foreign), checks, travelers checks, promissory notes and securities totaling more than ${yen(thresholdJPY)} per person must be declared on the dedicated form${northKorea ? " (¥100,000 when bound for North Korea)" : ""}.`,
  };
}

/* ---------------- Main ---------------- */

export function hasAnythingToCheck(i: CheckInput): boolean {
  return (
    (i.alcohol?.some((a) => a.ml > 0) ?? false) ||
    (i.cigarettes ?? 0) > 0 ||
    (i.cigars ?? 0) > 0 ||
    (i.hnbUnits ?? 0) > 0 ||
    (i.otherTobaccoGrams ?? 0) > 0 ||
    (i.perfumeMl ?? 0) > 0 ||
    (i.goods?.length ?? 0) > 0 ||
    (i.goodsTotalJPY ?? 0) > 0 ||
    (i.cashJPY ?? 0) > 0 ||
    (i.paymentInstrumentsJPY ?? 0) > 0 ||
    (i.goldBullionKg ?? 0) > 0
  );
}

export function checkAllowance(input: CheckInput) {
  if (!hasAnythingToCheck(input)) throw new RuleInputError("Nothing to check. Send at least one of: alcoholBottles / alcoholMl, cigarettes, cigars, hnbPackages / hnbSticks, otherTobaccoGrams, perfumeMl / perfumeOz, goods / goodsTotalJPY, cashJPY / paymentInstrumentsJPY.");
  const travelers = input.travelers ?? 1;
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20) throw new RuleInputError("travelers must be a whole number from 1 to 20");
  const age = input.ageYears ?? null;
  if (age !== null && (!Number.isFinite(age) || age < 0 || age > 120)) throw new RuleInputError("ageYears must be 0-120");
  const band = ageBand(age);

  const warnings: string[] = [];
  const notes: string[] = [];
  const notEstimated: string[] = [];
  const simplifiedDutyNotes: string[] = [];

  const alcohol = checkAlcohol(input.alcohol ?? [], band, travelers);
  const tobacco = checkTobacco(input, band, travelers);
  const perfume = checkPerfume(input.perfumeMl ?? 0, band, travelers);
  const goods = checkGoods(input.goods, input.goodsTotalJPY, band, travelers);
  const cash = checkCash(input.cashJPY ?? 0, input.paymentInstrumentsJPY ?? 0, !!input.boundForNorthKorea);

  if (age === null) notes.push("Age not given: adult (20+) allowances assumed.");
  if (band !== "adult" && (alcohol.declaredMl > 0 || tobacco.kinds.length)) warnings.push("Under 20: there is no duty-free allowance for alcohol or tobacco, so all of it is dutiable.");
  if (band === "child_under_6") warnings.push("Under 6: only items clearly for the child (such as toys) get a duty-free allowance. Mark them forChild: true.");
  if (input.alcohol?.some((a) => a.mlAssumed)) notes.push(`Bottle size assumed ${ALLOWANCE.bottleMl} ml. Enter alcoholMl for the real total volume.`);
  if (alcohol.declaredBottles !== null && alcohol.declaredBottles > alcohol.allowanceBottles && alcohol.withinAllowance && band === "adult")
    warnings.push(`You have ${alcohol.declaredBottles} bottles but ${alcohol.declaredMl} ml is within ${alcohol.allowanceMl} ml. Small bottles are usually assessed by volume, but the allowance is written as ${ALLOWANCE.alcoholBottles} bottles, so an officer could count bottles.`);

  if (tobacco.mixedKinds && tobacco.strictReading && tobacco.strictReading.dutyJPY !== tobacco.dutyJPY)
    warnings.push(`You carry more than one kind of tobacco. Under the 250 g mixed rule the estimate is lower; under the stricter reading in Japan Customs' own worked example (only ${tobacco.strictReading.exemptKind} exempt) tobacco duty would be ${yen(tobacco.strictReading.dutyJPY)} instead of ${yen(tobacco.dutyJPY)}.`);
  else if (tobacco.mixedKinds && tobacco.strictReading && tobacco.strictReading.withinAllowance !== tobacco.withinAllowance)
    warnings.push("You carry more than one kind of tobacco. It fits the 250 g mixed allowance, but under the stricter reading in Japan Customs' worked example some of it would be dutiable.");
  if (!tobacco.simplifiedDutyApplicable || (tobacco.strictReading && !tobacco.strictReading.simplifiedDutyApplicable)) {
    simplifiedDutyNotes.push("Excess cigars and other tobacco (pipe, roll-your-own, etc.) are not covered by the simplified rates; general tariff and tobacco tax apply.");
    notEstimated.push("excess cigars / other tobacco");
  }
  if (!perfume.withinAllowance) {
    notEstimated.push("excess perfume (taxed on its value; keep the receipt)");
  }
  if (perfume.declaredMl > 0) notes.push("Eau de toilette and eau de cologne do not count toward the perfume allowance.");

  if (goods.generalTariff.length) {
    simplifiedDutyNotes.push(`Simplified rates do not apply to an article or set whose Customs value (≈ overseas price × 0.6) exceeds ¥100,000: ${goods.generalTariff.join(", ")}. The general tariff rate for its HS code applies.`);
    notEstimated.push(`general-tariff goods: ${goods.generalTariff.join(", ")}`);
  }
  if (goods.mode === "total") {
    notes.push("goodsTotalJPY assumes no single article is over ¥200,000 and items of ¥10,000 or less per kind are already left out. List items in goods[] for an exact check.");
    if (!goods.withinAllowance) notes.push("The excess is estimated at the simplified 15% on Customs value (overseas price × 0.6). Duty-free-tariff items such as watches pay 10% instead.");
  }
  if (goods.mode === "items") {
    for (const it of goods.items) {
      if (it.treatment === "dutiable_over_200k") warnings.push(`${it.description} (${yen(it.unitValueJPY)}) is over ¥200,000 by itself, so its whole value is dutiable. The ¥200,000 allowance cannot be applied to part of it.`);
      if (it.quantity > 3) warnings.push(`${it.description}: more than 3 of the same item may be treated as commercial rather than personal (Customs FAQ 7104).`);
    }
    if (band === "child_under_6" && goods.items.some((x) => !x.forChild)) notes.push("Items not marked forChild get no allowance for a child under 6.");
  }
  if (goods.dutiableValueJPY > COMMERCIAL_THRESHOLD_JPY) warnings.push(`Dutiable goods worth more than ${yen(COMMERCIAL_THRESHOLD_JPY)} may need commercial-cargo (general import) procedures instead of the passenger desk (passenger.htm).`);
  if (travelers > 1) notes.push(`Allowances multiplied by ${travelers} travelers, all assumed to be in the same age band. Cash is declared by each person carrying it, so enter cash for one person.`);

  if (cash.declarationRequired) warnings.push(`Means of payment total ${yen(cash.totalJPY)} is over ${yen(cash.thresholdJPY)}: you must declare it on the Declaration of Carrying of Means of Payment, etc. Ask a Customs officer for the form.`);
  let gold: { kg: number; declarationRequired: boolean; note: string } | null = null;
  if ((input.goldBullionKg ?? 0) > 0) {
    const kg = input.goldBullionKg ?? 0;
    gold = {
      kg,
      declarationRequired: kg > GOLD_DECLARATION_KG,
      note: `Answer "Yes" to gold on the customs declaration for any amount. Gold bullion of 90%+ purity over ${GOLD_DECLARATION_KG} kg also needs the means-of-payment declaration, and gold is subject to consumption tax on import.`,
    };
    warnings.push(gold.note);
    notEstimated.push("gold (consumption tax on its value)");
  }

  // Duty buckets (official example: truncate each tax type to ¥100).
  const consumptionBase = floor1000(goods.consumptionCustomsValue);
  const consumptionNational = floor100(consumptionBase * CONSUMPTION_NATIONAL_RATE);
  const consumptionLocal = floor100(consumptionNational * LOCAL_CONSUMPTION_RATIO);
  const goods15 = Math.floor(floor1000(goods.goods15CustomsValue) * GOODS_SIMPLIFIED_RATE);
  function buckets(t: { tobaccoTax: number; customsDuty: number }) {
    const raw = { alcoholJPY: alcohol.dutyJPY, tobaccoTaxJPY: t.tobaccoTax, customsDutyJPY: goods15 + t.customsDuty, consumptionTaxJPY: consumptionNational + consumptionLocal };
    const rounded = { alcoholJPY: floor100(raw.alcoholJPY), tobaccoTaxJPY: floor100(raw.tobaccoTaxJPY), customsDutyJPY: floor100(raw.customsDutyJPY), consumptionTaxJPY: raw.consumptionTaxJPY };
    const total = rounded.alcoholJPY + rounded.tobaccoTaxJPY + rounded.customsDutyJPY + rounded.consumptionTaxJPY;
    return { raw, rounded, total };
  }
  const main = buckets(tobacco.buckets);
  const high = tobacco.strictReading ? buckets(tobacco.strictReading.buckets) : main;

  const overCategories = [
    !alcohol.withinAllowance && "alcohol",
    !tobacco.withinAllowance && "tobacco",
    !perfume.withinAllowance && "perfume",
    !goods.withinAllowance && "otherGoods",
  ].filter(Boolean) as string[];
  const withinAllowance = overCategories.length === 0;
  const simplifiedDutyApplicable = simplifiedDutyNotes.length === 0;
  const mustDeclare = !withinAllowance || cash.declarationRequired || !!gold?.declarationRequired;

  notes.push("Everyone entering Japan submits a customs declaration (paper form or Visit Japan Web QR), even when within the allowance.");
  if (!withinAllowance) notes.push("Over the allowance: use the red channel and pay at the bank counter in the Customs area.");
  if (!withinAllowance && simplifiedDutyApplicable) notes.push("You may ask Customs not to use simplified rates; then the general tariff applies to everything.");

  return {
    rulesAsOf: RULES_AS_OF,
    travelers,
    ageYears: age,
    ageBand: band,
    withinAllowance,
    overCategories,
    channel: mustDeclare ? ("red" as const) : ("green" as const),
    estimatedSimplifiedDutyJPY: main.total,
    estimatedSimplifiedDutyHighJPY: high.total,
    dutyBreakdown: main.rounded,
    dutyBreakdownRaw: main.raw,
    simplifiedDutyApplicable,
    simplifiedDutyNotes,
    notEstimated,
    cashDeclarationRequired: cash.declarationRequired,
    alcohol,
    tobacco: { ...tobacco, buckets: undefined, strictReading: tobacco.strictReading ? { ...tobacco.strictReading, buckets: undefined } : null },
    perfume,
    otherGoods: { ...goods, goods15CustomsValue: undefined, consumptionCustomsValue: undefined, generalTariff: undefined },
    cash,
    gold,
    warnings,
    notes,
    assumptions: ASSUMPTIONS,
    sources: [...SOURCES],
  };
}

export type CheckResult = ReturnType<typeof checkAllowance>;

/* ---------------- Rules table (for /api/rules) ---------------- */

export const RULES = {
  rulesAsOf: RULES_AS_OF,
  scope: "Personal effects of travelers entering Japan (accompanied and unaccompanied articles share one allowance). Per person.",
  allowancePerAdult: {
    alcohol: { bottles: ALLOWANCE.alcoholBottles, mlPerBottle: ALLOWANCE.bottleMl, totalMl: ALLOWANCE.alcoholMl },
    tobacco: {
      cigarettes: ALLOWANCE.cigarettes,
      cigars: ALLOWANCE.cigars,
      heatNotBurnPackages: ALLOWANCE.hnbPackages,
      heatNotBurnExamples: { IQOS: "200 sticks", glo: "200 sticks", "Ploom TECH / with": "50 capsules" },
      otherTobaccoGrams: ALLOWANCE.otherTobaccoGrams,
      moreThanOneKind: "total allowance 250 g",
    },
    perfume: { ounces: ALLOWANCE.perfumeOz, approxMl: ALLOWANCE.perfumeMl, note: "Eau de toilette / eau de cologne not included." },
    otherGoods: {
      totalOverseasValueJPY: ALLOWANCE.otherGoodsJPY,
      smallItemExclusionJPY: ALLOWANCE.smallItemJPY,
      smallItemRule: "An item kind whose total overseas value is ¥10,000 or less is free and not counted toward ¥200,000.",
      overLimitRule: "No allowance for an article or set worth more than ¥200,000 each: its whole value is dutiable.",
      overseasMarketValue: "General retail purchase price abroad, converted at Customs' published weekly rate.",
    },
  },
  ageRules: {
    under20: "No alcohol or tobacco allowance.",
    under6: "Only items clearly for the child (e.g. toys) are allowed duty-free.",
  },
  simplifiedRates: {
    alcoholPerLiterJPY: ALCOHOL_RATE_PER_L,
    tobaccoJPY: { cigarette: TOBACCO_RATE.cigaretteJPY, heatNotBurnStick: TOBACCO_RATE.hnbStickJPY, heatNotBurnCapsuleOrCartridge: TOBACCO_RATE.hnbCapsuleJPY },
    otherArticles: "15% of Customs value (except duty-free-tariff articles such as wristwatches and golf clubs: consumption tax 10% only)",
    customsValue: "Overseas retail price × 0.6 for travelers' souvenirs",
    notApplied: [
      "An article or set whose Customs value exceeds ¥100,000",
      "Rice",
      "Edible laver, pineapple products, konjac tubers, tobacco other than cigarettes and heat-not-burn, hunting guns",
      "When the traveler asks Customs not to use simplified rates",
    ],
    rounding: "Each tax type is truncated to ¥100 (official example total ¥19,400).",
  },
  cash: {
    thresholdJPY: CASH_THRESHOLD_JPY,
    northKoreaThresholdJPY: CASH_THRESHOLD_NORTH_KOREA_JPY,
    covers: ["cash (yen and foreign)", "checks", "travelers checks", "promissory notes", "securities"],
    goldBullion: "90%+ purity over 1 kg also declared on the same form",
    form: "Declaration of Carrying of Means of Payment, etc.",
  },
  other: {
    commercialThresholdJPY: COMMERCIAL_THRESHOLD_JPY,
    rice: "Duty-free allowance 100 kg per year with the rice import report.",
    declaration: "All passengers submit a customs declaration (paper or Visit Japan Web). Green channel only if nothing is dutiable, prohibited or restricted.",
  },
  assumptions: ASSUMPTIONS,
  sources: [...SOURCES],
  disclaimer: DISCLAIMER,
};
