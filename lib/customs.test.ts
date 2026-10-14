import assert from "node:assert/strict";
import test from "node:test";
import { ALLOWANCE, RULES, RULES_AS_OF, RuleInputError, SOURCES, bestSubset, checkAllowance, checkCash } from "./customs";
import { parseCheckInput } from "./parse";

const run = (q: Record<string, unknown>) => checkAllowance(parseCheckInput(q));

test("rules are stamped 2026-10-14 and cite Japan Customs", () => {
  assert.equal(RULES_AS_OF, "2026-10-14");
  assert.equal(RULES.rulesAsOf, "2026-10-14");
  assert.ok(SOURCES.every((s) => s.startsWith("https://www.customs.go.jp/")));
  assert.equal(ALLOWANCE.alcoholMl, 2280);
  assert.equal(ALLOWANCE.perfumeMl, 56);
});

test("everything within allowance → green, ¥0", () => {
  const r = run({ ageYears: 30, alcoholBottles: 3, cigarettes: 200, perfumeOz: 2, goods: "150000,40000" });
  assert.equal(r.withinAllowance, true);
  assert.equal(r.channel, "green");
  assert.equal(r.estimatedSimplifiedDutyJPY, 0);
  assert.deepEqual(r.overCategories, []);
  assert.equal(r.alcohol.allowanceMl, 2280);
});

test("Japan Customs' own worked example (zeigaku.htm) → ¥19,400 under the strict reading", () => {
  const r = checkAllowance(
    parseCheckInput({
      alcohol: [
        { type: "whisky", bottles: 3 },
        { type: "brandy", ml: 700, bottles: 1 },
      ],
      cigarettes: 400,
      hnbPackages: 10,
      hnbType: "capsules",
      perfumeOz: 1,
      goods: [
        { description: "Handbag", valueJPY: 80000 },
        { description: "Ring", valueJPY: 120000 },
        { description: "Clothes", valueJPY: 50000 },
        { description: "Wristwatch", valueJPY: 150000, dutyFreeTariff: true },
      ],
    }),
  );
  // Liquor tax 500 (0.7 L × ¥800 = ¥560, truncated), tobacco 3,000, customs duty 7,000, consumption tax 8,900.
  assert.equal(r.alcohol.lines[1].dutyJPY, 560);
  assert.equal(r.alcohol.lines[0].excessMl, 0, "allowance goes to the whisky, brandy taxed");
  assert.equal(r.tobacco.strictReading?.exemptKind, "cigarettes");
  assert.equal(r.estimatedSimplifiedDutyHighJPY, 19400);
  const free = r.otherGoods.items.filter((i) => i.treatment === "free").map((i) => i.description);
  assert.deepEqual(free.sort(), ["Handbag", "Ring"]);
  // 250 g mixed reading gives a lower figure.
  assert.ok(r.estimatedSimplifiedDutyJPY < 19400);
  assert.equal(r.estimatedSimplifiedDutyJPY, 18800);
  assert.equal(r.perfume.withinAllowance, true);
});

test("watch-only consumption tax matches official ¥8,900", () => {
  const r = run({ goods: [{ valueJPY: 150000, dutyFreeTariff: true }, { valueJPY: 200000 }] });
  assert.equal(r.dutyBreakdown.consumptionTaxJPY, 8900);
});

test("excess whisky: 5 bottles (760 ml) → 1.52 L × ¥800 = ¥1,216 → ¥1,200", () => {
  const r = run({ alcoholBottles: 5, alcoholType: "whisky" });
  assert.equal(r.alcohol.excessMl, 1520);
  assert.equal(r.alcohol.dutyJPY, 1216);
  assert.equal(r.dutyBreakdown.alcoholJPY, 1200);
  assert.equal(r.estimatedSimplifiedDutyJPY, 1200);
  assert.equal(r.channel, "red");
  assert.deepEqual(r.overCategories, ["alcohol"]);
});

test("alcohol by ml: 2,280 ml exactly is within; 2,281 ml is over", () => {
  assert.equal(run({ alcoholMl: 2280 }).alcohol.withinAllowance, true);
  assert.equal(run({ alcoholMl: 2281 }).alcohol.withinAllowance, false);
});

test("mixed alcohol: allowance goes to the highest rate first", () => {
  const r = run({ alcohol: "wine:1500,whisky:1500" });
  const whisky = r.alcohol.lines.find((l) => l.type === "whisky")!;
  const wine = r.alcohol.lines.find((l) => l.type === "wine")!;
  assert.equal(whisky.excessMl, 0);
  assert.equal(wine.excessMl, 720);
  assert.equal(wine.dutyJPY, 144);
});

test("4 small bottles within 2,280 ml → within, with a bottle-count warning", () => {
  const r = run({ alcoholBottles: 4, alcoholMl: 2000 });
  assert.equal(r.alcohol.withinAllowance, true);
  assert.ok(r.warnings.some((w) => w.includes("4 bottles")));
});

test("under 20: no alcohol or tobacco allowance, perfume and goods still allowed", () => {
  const r = run({ ageYears: 19, alcoholBottles: 1, alcoholType: "beer", cigarettes: 20, perfumeMl: 30, goods: "50000" });
  assert.equal(r.ageBand, "minor");
  assert.equal(r.alcohol.allowanceMl, 0);
  assert.equal(r.alcohol.excessMl, 760);
  assert.equal(r.tobacco.withinAllowance, false);
  assert.equal(r.tobacco.kinds[0].excess, 20);
  assert.equal(r.perfume.withinAllowance, true);
  assert.equal(r.otherGoods.withinAllowance, true);
  assert.ok(r.warnings.some((w) => w.includes("Under 20")));
});

test("age 20 exactly is an adult", () => {
  assert.equal(run({ ageYears: 20, cigarettes: 200 }).tobacco.withinAllowance, true);
});

test("under 6: only items for the child are free", () => {
  const r = run({ ageYears: 4, goods: "8000c,8000" });
  assert.equal(r.ageBand, "child_under_6");
  assert.equal(r.otherGoods.items[0].treatment, "excluded_under_10k");
  assert.equal(r.otherGoods.items[1].treatment, "dutiable");
  assert.equal(r.otherGoods.withinAllowance, false);
});

test("¥10,000 exclusion: small item kinds don't count toward ¥200,000", () => {
  const r = run({ goods: "195000,9000,5000x2" });
  assert.equal(r.otherGoods.excludedSmallItemsJPY, 19000);
  assert.equal(r.otherGoods.countedValueJPY, 195000);
  assert.equal(r.otherGoods.withinAllowance, true);
  // 3 × ¥5,000 = ¥15,000 for one kind → counted.
  const r2 = run({ goods: "195000,5000x3" });
  assert.equal(r2.otherGoods.withinAllowance, false);
});

test("article over ¥200,000 by itself → whole value dutiable, general tariff (no simplified rate)", () => {
  const r = run({ goods: [{ description: "Bag", valueJPY: 250000 }] });
  assert.equal(r.otherGoods.items[0].treatment, "dutiable_over_200k");
  assert.equal(r.otherGoods.dutiableValueJPY, 250000);
  assert.equal(r.simplifiedDutyApplicable, false);
  assert.ok(r.simplifiedDutyNotes[0].includes("¥100,000"));
  assert.ok(r.warnings.some((w) => w.includes("over ¥200,000 by itself")));
});

test("15% applies to Customs value (price × 0.6): ¥50,000 clothes over the allowance → ¥4,500", () => {
  const r = run({ goods: "200000,50000" });
  assert.equal(r.dutyBreakdown.customsDutyJPY, 4500);
  assert.equal(r.simplifiedDutyApplicable, true);
});

test("article with Customs value over ¥100,000 (price > ¥166,667) excess is not simplified", () => {
  const r = run({ goods: "190000,180000" });
  assert.equal(r.simplifiedDutyApplicable, false);
  assert.equal(r.otherGoods.items.filter((i) => i.rate === "general_tariff").length, 1);
});

test("single tobacco kinds: 50 cigars, 10 IQOS packs, 250 g pipe tobacco are within", () => {
  assert.equal(run({ cigars: 50 }).tobacco.withinAllowance, true);
  assert.equal(run({ hnbPackages: 10 }).tobacco.withinAllowance, true);
  assert.equal(run({ hnbSticks: 201 }).tobacco.withinAllowance, false);
  assert.equal(run({ hnbCapsules: 50 }).tobacco.withinAllowance, true);
  assert.equal(run({ otherTobaccoGrams: 250 }).tobacco.withinAllowance, true);
});

test("400 cigarettes → 200 excess × ¥15 = ¥3,000", () => {
  const r = run({ cigarettes: 400 });
  assert.equal(r.tobacco.kinds[0].excess, 200);
  assert.equal(r.dutyBreakdown.tobaccoTaxJPY, 3000);
  assert.equal(r.estimatedSimplifiedDutyHighJPY, 3000);
});

test("mixed tobacco: 250 g pooled vs strict reading", () => {
  const r = run({ cigarettes: 200, cigars: 10 });
  // 10 cigars × 5 g = 50 g + 200 cigarettes × 1 g = 250 g → within under the 250 g reading.
  assert.equal(r.tobacco.mixedKinds, true);
  assert.equal(r.tobacco.mixedGramsUsed, 250);
  assert.equal(r.tobacco.withinAllowance, true);
  assert.equal(r.tobacco.strictReading?.withinAllowance, false);
  assert.equal(r.tobacco.strictReading?.exemptKind, "cigars");
  assert.equal(r.estimatedSimplifiedDutyHighJPY, 3000);
  assert.ok(r.warnings.some((w) => w.includes("more than one kind")));
});

test("excess cigars → simplifiedDutyApplicable false", () => {
  const r = run({ cigars: 60 });
  assert.equal(r.tobacco.withinAllowance, false);
  assert.equal(r.simplifiedDutyApplicable, false);
  assert.ok(r.notEstimated.some((n) => n.includes("cigars")));
});

test("perfume 3 oz → 28 ml over, not estimated", () => {
  const r = run({ perfumeOz: 3 });
  assert.equal(r.perfume.excessMl, 28);
  assert.ok(r.notEstimated.some((n) => n.includes("perfume")));
});

test("travelers scale the allowance", () => {
  const r = run({ travelers: 2, alcoholBottles: 6, cigarettes: 400, goods: "150000,150000" });
  assert.equal(r.withinAllowance, true);
  assert.equal(r.alcohol.allowanceMl, 4560);
});

test("cash: exactly ¥1,000,000 no declaration; ¥1,000,001 declaration", () => {
  assert.equal(checkCash(1_000_000).declarationRequired, false);
  assert.equal(checkCash(1_000_001).declarationRequired, true);
  assert.equal(checkCash(600_000, 500_000).declarationRequired, true, "cash and checks add up");
  const r = run({ cashJPY: 1_200_000 });
  assert.equal(r.cashDeclarationRequired, true);
  assert.equal(r.withinAllowance, true);
  assert.equal(r.channel, "red");
});

test("bound for North Korea: threshold ¥100,000", () => {
  assert.equal(checkCash(100_000, 0, true).declarationRequired, false);
  assert.equal(checkCash(100_001, 0, true).declarationRequired, true);
  assert.equal(run({ cashJPY: 150000, boundForNorthKorea: "true" }).cash.thresholdJPY, 100000);
});

test("gold over 1 kg needs the means-of-payment declaration", () => {
  const r = run({ goldBullionKg: 1.5 });
  assert.equal(r.gold?.declarationRequired, true);
  assert.equal(r.channel, "red");
});

test("nothing to check → RuleInputError", () => {
  assert.throws(() => run({ ageYears: 30 }), RuleInputError);
});

test("bestSubset picks the most tax-saving set within the cap", () => {
  const pick = bestSubset(
    [
      { value: 80000, tax: 7200 },
      { value: 120000, tax: 10800 },
      { value: 50000, tax: 4500 },
      { value: 150000, tax: 9000 },
    ],
    200000,
  );
  assert.deepEqual(pick, [true, true, false, false]);
  // Large input uses coarser DP but never exceeds the cap.
  const many = Array.from({ length: 150 }, (_, i) => ({ value: 10001 + i * 997, tax: (10001 + i * 997) * 0.09 }));
  const p = bestSubset(many, 2_000_000);
  assert.ok(many.reduce((s, u, i) => s + (p[i] ? u.value : 0), 0) <= 2_000_000);
});

test("goodsTotalJPY approximate mode", () => {
  const r = run({ goodsTotalJPY: 300000 });
  assert.equal(r.otherGoods.mode, "total");
  assert.equal(r.otherGoods.dutiableValueJPY, 100000);
  assert.equal(r.dutyBreakdown.customsDutyJPY, 9000);
});
