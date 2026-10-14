// Turns API / share-link input (query string or JSON body) into a CheckInput, and back into a short query.
import { InputError, bool, type Input } from "./agent-api";
import { ALCOHOL_TYPES, ALLOWANCE, CAPSULES_PER_HNB_PACKAGE, HNB_TYPES, ML_PER_OZ, STICKS_PER_HNB_PACKAGE, type AlcoholItem, type AlcoholType, type CheckInput, type GoodsItem, type HnbType } from "./customs";

const MAX_GOODS_LINES = 50;
const MAX_UNITS = 200;

function first(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v;
}

function present(input: Input, key: string): boolean {
  const v = first(input[key]);
  return v !== undefined && v !== null && String(v).trim() !== "";
}

function toNum(raw: unknown, key: string): number {
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[,_\s¥]/g, "").replace(/(ml|g|oz|jpy|yen|kg)$/i, ""));
  if (!Number.isFinite(n)) throw new InputError(`Not a number: ${key}`);
  return n;
}

function optNum(input: Input, key: string, { int = false, max = 1e9 } = {}): number | undefined {
  if (!present(input, key)) return undefined;
  const n = toNum(first(input[key]), key);
  if (n < 0) throw new InputError(`${key} cannot be negative`);
  if (int && !Number.isInteger(n)) throw new InputError(`${key} must be a whole number`);
  if (n > max) throw new InputError(`${key} is too large (max ${max})`);
  return n;
}

function alcoholType(v: unknown, key = "alcoholType"): AlcoholType {
  const s = String(v ?? "").trim().toLowerCase().replace(/^(whiskey|scotch|bourbon)$/, "whisky").replace(/^(cognac)$/, "brandy").replace(/^(shochu|baijiu|soju)$/, "distilled").replace(/^(sake|cider|champagne)$/, "other");
  if (!s) return "other";
  if (!(ALCOHOL_TYPES as readonly string[]).includes(s)) throw new InputError(`Invalid ${key}: "${s}". Allowed: ${ALCOHOL_TYPES.join(", ")}`);
  return s as AlcoholType;
}

/** alcohol: [{type, ml?, bottles?}] or CSV "brandy:700,whisky:2280" (type:ml) */
function parseAlcoholList(raw: unknown): AlcoholItem[] {
  const arr: unknown[] = typeof raw === "string" ? raw.split(",").filter((s) => s.trim()) : Array.isArray(raw) ? raw.flatMap((r) => (typeof r === "string" ? r.split(",").filter((s) => s.trim()) : [r])) : [raw];
  return arr.map((r, i) => {
    if (typeof r === "string") {
      const [t, ml] = r.split(":");
      const n = toNum(ml ?? "", `alcohol[${i}].ml`);
      if (n < 0 || n > 1_000_000) throw new InputError(`alcohol[${i}].ml out of range`);
      return { type: alcoholType(t, `alcohol[${i}].type`), ml: n };
    }
    if (!r || typeof r !== "object") throw new InputError(`alcohol[${i}] must be an object {type, ml} or "type:ml"`);
    const o = r as Record<string, unknown>;
    const bottles = o.bottles === undefined || o.bottles === null || o.bottles === "" ? null : toNum(o.bottles, `alcohol[${i}].bottles`);
    const ml = o.ml === undefined || o.ml === null || o.ml === "" ? null : toNum(o.ml, `alcohol[${i}].ml`);
    if (bottles === null && ml === null) throw new InputError(`alcohol[${i}] needs ml or bottles`);
    if ((bottles ?? 0) < 0 || (ml ?? 0) < 0 || (ml ?? 0) > 1_000_000 || (bottles ?? 0) > 1000) throw new InputError(`alcohol[${i}] out of range`);
    if (bottles !== null && !Number.isInteger(bottles)) throw new InputError(`alcohol[${i}].bottles must be a whole number`);
    return { type: alcoholType(o.type, `alcohol[${i}].type`), ml: ml ?? (bottles ?? 0) * ALLOWANCE.bottleMl, bottles, mlAssumed: ml === null };
  });
}

/** goods: [{description?, valueJPY, quantity?, dutyFreeTariff?, forChild?}] or CSV "80000,120000,150000w,3000x3,5000c" (w = duty-free-tariff article such as a watch, c = for a child under 6, xN = quantity) */
function parseGoodsList(raw: unknown): GoodsItem[] {
  const arr: unknown[] = typeof raw === "string" ? raw.split(",").filter((s) => s.trim()) : Array.isArray(raw) ? raw.flatMap((r) => (typeof r === "string" ? r.split(",").filter((s) => s.trim()) : [r])) : [raw];
  if (arr.length > MAX_GOODS_LINES) throw new InputError(`At most ${MAX_GOODS_LINES} goods lines; group identical items with quantity.`);
  const items = arr.map((r, i): GoodsItem => {
    if (typeof r === "number") r = String(r);
    if (typeof r === "string") {
      const m = /^\s*[¥]?([\d.]+)\s*(?:x(\d+))?\s*([wc]*)\s*$/i.exec(r.replace(/,/g, ""));
      if (!m) throw new InputError(`goods[${i}] "${r}" not understood. Use e.g. 80000, 3000x3 (quantity), 150000w (watch / golf clubs / PC: duty-free tariff), 5000c (for a child).`);
      const valueJPY = Number(m[1]);
      const quantity = m[2] ? Number(m[2]) : 1;
      return check({ valueJPY, quantity, dutyFreeTariff: /w/i.test(m[3]), forChild: /c/i.test(m[3]) }, i);
    }
    if (!r || typeof r !== "object") throw new InputError(`goods[${i}] must be an object {valueJPY, quantity?, description?}`);
    const o = r as Record<string, unknown>;
    const v = o.valueJPY ?? o.value ?? o.priceJPY ?? o.price;
    if (v === undefined || v === null || v === "") throw new InputError(`goods[${i}].valueJPY is required (overseas retail price of one article, in yen)`);
    const q = o.quantity ?? o.qty ?? 1;
    const flag = (x: unknown) => x === true || /^(1|true|yes)$/i.test(String(x ?? ""));
    return check(
      {
        description: o.description === undefined ? undefined : String(o.description).slice(0, 80),
        valueJPY: toNum(v, `goods[${i}].valueJPY`),
        quantity: toNum(q, `goods[${i}].quantity`),
        dutyFreeTariff: flag(o.dutyFreeTariff),
        forChild: flag(o.forChild),
      },
      i,
    );
  });
  const units = items.reduce((s, g) => s + (g.quantity ?? 1), 0);
  if (units > MAX_UNITS) throw new InputError(`At most ${MAX_UNITS} articles in total.`);
  return items;
}

function check(g: GoodsItem, i: number): GoodsItem {
  if (!(g.valueJPY > 0) || g.valueJPY > 1e9) throw new InputError(`goods[${i}].valueJPY must be a positive yen amount`);
  if (!Number.isInteger(g.quantity) || (g.quantity ?? 1) < 1 || (g.quantity ?? 1) > MAX_UNITS) throw new InputError(`goods[${i}].quantity must be a whole number from 1 to ${MAX_UNITS}`);
  return { ...g, valueJPY: Math.round(g.valueJPY) };
}

export function parseCheckInput(input: Input): CheckInput {
  const out: CheckInput = {};
  const age = optNum(input, "ageYears", { max: 120 }) ?? optNum(input, "age", { max: 120 });
  if (age !== undefined) out.ageYears = age;
  const t = optNum(input, "travelers", { int: true, max: 20 });
  if (t !== undefined) {
    if (t < 1) throw new InputError("travelers must be at least 1");
    out.travelers = t;
  }

  // Alcohol: flat fields and/or list.
  const alcohol: AlcoholItem[] = [];
  const bottles = optNum(input, "alcoholBottles", { int: true, max: 1000 });
  const ml = optNum(input, "alcoholMl", { max: 1_000_000 });
  if (bottles !== undefined || ml !== undefined) {
    const type = alcoholType(first(input.alcoholType));
    if ((bottles ?? 0) > 0 || (ml ?? 0) > 0) alcohol.push({ type, ml: ml ?? (bottles ?? 0) * ALLOWANCE.bottleMl, bottles: bottles ?? null, mlAssumed: ml === undefined });
  }
  if (input.alcohol !== undefined && input.alcohol !== null && input.alcohol !== "") alcohol.push(...parseAlcoholList(input.alcohol).filter((a) => a.ml > 0));
  if (alcohol.length) out.alcohol = alcohol;

  // Tobacco.
  const cig = optNum(input, "cigarettes", { int: true, max: 100_000 });
  if (cig) out.cigarettes = cig;
  const cigars = optNum(input, "cigars", { int: true, max: 10_000 });
  if (cigars) out.cigars = cigars;
  const other = optNum(input, "otherTobaccoGrams", { max: 100_000 });
  if (other) out.otherTobaccoGrams = other;
  const packs = optNum(input, "hnbPackages", { int: true, max: 5000 }) ?? 0;
  const sticks = optNum(input, "hnbSticks", { int: true, max: 100_000 }) ?? 0;
  const caps = optNum(input, "hnbCapsules", { int: true, max: 100_000 }) ?? 0;
  const rawType = first(input.hnbType);
  let hnbType: HnbType = "sticks";
  if (rawType !== undefined && rawType !== null && String(rawType).trim() !== "") {
    const v = String(rawType).trim().toLowerCase();
    if (!(HNB_TYPES as readonly string[]).includes(v)) throw new InputError(`Invalid hnbType: "${v}". Allowed: ${HNB_TYPES.join(", ")}`);
    hnbType = v as HnbType;
  }
  if (caps > 0 && sticks > 0) throw new InputError("Send heat-not-burn as either hnbSticks (IQOS / glo) or hnbCapsules (Ploom TECH / with), not both.");
  if (caps > 0) hnbType = "capsules";
  const units = packs * (hnbType === "capsules" ? CAPSULES_PER_HNB_PACKAGE : STICKS_PER_HNB_PACKAGE) + sticks + caps;
  if (units > 0) {
    out.hnbUnits = units;
    out.hnbType = hnbType;
  }

  // Perfume.
  const pMl = optNum(input, "perfumeMl", { max: 100_000 });
  const pOz = optNum(input, "perfumeOz", { max: 5000 });
  const perfume = (pMl ?? 0) + (pOz ?? 0) * ML_PER_OZ;
  if (perfume > 0) out.perfumeMl = Math.round(perfume * 10) / 10;

  // Other goods.
  if (input.goods !== undefined && input.goods !== null && input.goods !== "") {
    const goods = parseGoodsList(input.goods);
    if (goods.length) out.goods = goods;
  }
  const gt = optNum(input, "goodsTotalJPY", { max: 1e10 });
  if (gt && !out.goods) out.goodsTotalJPY = Math.round(gt);

  // Cash and gold.
  const cash = optNum(input, "cashJPY", { max: 1e12 });
  if (cash) out.cashJPY = Math.round(cash);
  const pi = optNum(input, "paymentInstrumentsJPY", { max: 1e12 });
  if (pi) out.paymentInstrumentsJPY = Math.round(pi);
  if (bool(input, "boundForNorthKorea", false)) out.boundForNorthKorea = true;
  const gold = optNum(input, "goldBullionKg", { max: 10_000 });
  if (gold) out.goldBullionKg = gold;
  return out;
}

/** Canonical short query for share links (/r?...) and sharePath. Uses the API's own parameter names. */
export function toQuery(i: CheckInput): string {
  const q = new URLSearchParams();
  if (i.ageYears !== undefined && i.ageYears !== null) q.set("ageYears", String(i.ageYears));
  if (i.travelers && i.travelers !== 1) q.set("travelers", String(i.travelers));
  if (i.alcohol?.length) {
    if (i.alcohol.length === 1 && i.alcohol[0].mlAssumed && i.alcohol[0].bottles) {
      q.set("alcoholBottles", String(i.alcohol[0].bottles));
      if (i.alcohol[0].type !== "other") q.set("alcoholType", i.alcohol[0].type);
    } else if (i.alcohol.length === 1) {
      q.set("alcoholMl", String(i.alcohol[0].ml));
      if (i.alcohol[0].type !== "other") q.set("alcoholType", i.alcohol[0].type);
    } else q.set("alcohol", i.alcohol.map((a) => `${a.type}:${a.ml}`).join(","));
  }
  if (i.cigarettes) q.set("cigarettes", String(i.cigarettes));
  if (i.cigars) q.set("cigars", String(i.cigars));
  if (i.hnbUnits) q.set(i.hnbType === "capsules" ? "hnbCapsules" : "hnbSticks", String(i.hnbUnits));
  if (i.otherTobaccoGrams) q.set("otherTobaccoGrams", String(i.otherTobaccoGrams));
  if (i.perfumeMl) q.set("perfumeMl", String(i.perfumeMl));
  if (i.goods?.length) q.set("goods", i.goods.map((g) => `${g.valueJPY}${(g.quantity ?? 1) > 1 ? `x${g.quantity}` : ""}${g.dutyFreeTariff ? "w" : ""}${g.forChild ? "c" : ""}`).join(","));
  else if (i.goodsTotalJPY) q.set("goodsTotalJPY", String(i.goodsTotalJPY));
  if (i.cashJPY) q.set("cashJPY", String(i.cashJPY));
  if (i.paymentInstrumentsJPY) q.set("paymentInstrumentsJPY", String(i.paymentInstrumentsJPY));
  if (i.boundForNorthKorea) q.set("boundForNorthKorea", "true");
  if (i.goldBullionKg) q.set("goldBullionKg", String(i.goldBullionKg));
  return q.toString().replace(/%2C/g, ",").replace(/%3A/g, ":");
}
