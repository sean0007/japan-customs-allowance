"use client";

import { useState } from "react";
import { CardDisclaimer } from "@/components/card-disclaimer";
import { ShareBar } from "@/components/share-bar";
import { ALCOHOL_LABEL, ALCOHOL_TYPES, RuleInputError, checkAllowance, type AlcoholType, type CheckInput } from "@/lib/customs";
import { parseCheckInput, toQuery } from "@/lib/parse";
import { EXAMPLE_SHARED, PUBLIC_URL, overText, yen } from "@/lib/share";

const field = "mt-2 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber";

type Row = { description: string; value: string; quantity: string; watch: boolean; child: boolean };

function rowsFrom(i: CheckInput): Row[] {
  const rows = (i.goods ?? []).map((g) => ({ description: g.description ?? "", value: String(g.valueJPY), quantity: String(g.quantity ?? 1), watch: !!g.dutyFreeTariff, child: !!g.forChild }));
  return rows.length ? rows : [{ description: "", value: "", quantity: "1", watch: false, child: false }];
}

const s = (n: number | undefined | null) => (n ? String(n) : "");

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm ${ok ? "border-teal-200/30 text-teal-100" : "border-red-400/40 bg-red-400/10 text-red-200"}`}>
      <span>{label}</span>
      <span className="font-mono text-xs uppercase">{ok ? "within" : "over"}</span>
    </li>
  );
}

export function Calculator({ initial }: { initial?: CheckInput }) {
  const start = initial ?? EXAMPLE_SHARED;
  const a0 = start.alcohol?.[0];
  const [age, setAge] = useState(start.ageYears === undefined || start.ageYears === null ? "" : String(start.ageYears));
  const [travelers, setTravelers] = useState(String(start.travelers ?? 1));
  const [bottles, setBottles] = useState(a0?.bottles ? String(a0.bottles) : "");
  const [ml, setMl] = useState(a0 && !a0.mlAssumed ? String(a0.ml) : "");
  const [alcoholType, setAlcoholType] = useState<AlcoholType>(a0?.type ?? "whisky");
  const [cigarettes, setCigarettes] = useState(s(start.cigarettes));
  const [cigars, setCigars] = useState(s(start.cigars));
  const [hnb, setHnb] = useState(s(start.hnbUnits));
  const [hnbType, setHnbType] = useState(start.hnbType ?? "sticks");
  const [otherTobacco, setOtherTobacco] = useState(s(start.otherTobaccoGrams));
  const [perfume, setPerfume] = useState(s(start.perfumeMl));
  const [rows, setRows] = useState<Row[]>(rowsFrom(start));
  const [cash, setCash] = useState(s((start.cashJPY ?? 0) + (start.paymentInstrumentsJPY ?? 0)));

  const clean = (v: string) => v.replace(/[,¥\s]/g, "");
  const raw: Record<string, unknown> = {
    ageYears: clean(age),
    travelers: clean(travelers) || "1",
    alcoholBottles: clean(bottles),
    alcoholMl: clean(ml),
    alcoholType,
    cigarettes: clean(cigarettes),
    cigars: clean(cigars),
    [hnbType === "capsules" ? "hnbCapsules" : "hnbSticks"]: clean(hnb),
    otherTobaccoGrams: clean(otherTobacco),
    perfumeMl: clean(perfume),
    goods: rows.filter((r) => Number(clean(r.value)) > 0).map((r) => ({ description: r.description || undefined, valueJPY: clean(r.value), quantity: clean(r.quantity) || "1", dutyFreeTariff: r.watch, forChild: r.child })),
    cashJPY: clean(cash),
    // Extra drinks from a shared multi-drink link are kept as-is.
    alcohol: (start.alcohol ?? []).slice(1).map((a) => ({ type: a.type, ml: a.ml })),
  };
  let error: string | null = null;
  let parsed: CheckInput | null = null;
  let result: ReturnType<typeof checkAllowance> | null = null;
  try {
    parsed = parseCheckInput(raw);
    result = checkAllowance(parsed);
  } catch (e) {
    error = e instanceof RuleInputError ? "Enter what you are bringing into Japan." : e instanceof Error ? e.message : "Check the numbers.";
  }
  const path = parsed && result ? `/r?${toQuery(parsed)}` : "/";
  const shareUrl = `${PUBLIC_URL}${path}`;
  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));


  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">What you are bringing into Japan</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Age</span>
            <span className="mt-0.5 block text-xs text-muted">Under 20: no alcohol / tobacco allowance</span>
            <input inputMode="numeric" value={age} placeholder="35" onChange={(e) => setAge(e.target.value)} className={`${field} font-mono`} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Travelers (same age band)</span>
            <span className="mt-0.5 block text-xs text-muted">Multiplies the per-person allowance</span>
            <input inputMode="numeric" value={travelers} onChange={(e) => setTravelers(e.target.value)} className={`${field} font-mono`} />
          </label>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-foreground">Alcohol · 3 bottles (2,280 ml) per adult</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-muted">
              Bottles
              <input inputMode="numeric" value={bottles} placeholder="0" onChange={(e) => setBottles(e.target.value)} className={`${field} font-mono`} />
            </label>
            <label className="block text-xs text-muted">
              Total ml (optional)
              <input inputMode="numeric" value={ml} placeholder="760 per bottle" onChange={(e) => setMl(e.target.value)} className={`${field} font-mono`} />
            </label>
            <label className="block text-xs text-muted">
              Type
              <select value={alcoholType} onChange={(e) => setAlcoholType(e.target.value as AlcoholType)} className={field}>
                {ALCOHOL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ALCOHOL_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-foreground">Tobacco · 200 cigarettes or 50 cigars or 10 heat-not-burn packs or 250 g</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            <label className="block text-xs text-muted">
              Cigarettes
              <input inputMode="numeric" value={cigarettes} placeholder="0" onChange={(e) => setCigarettes(e.target.value)} className={`${field} font-mono`} />
            </label>
            <label className="block text-xs text-muted">
              Cigars
              <input inputMode="numeric" value={cigars} placeholder="0" onChange={(e) => setCigars(e.target.value)} className={`${field} font-mono`} />
            </label>
            <label className="block text-xs text-muted">
              Heat-not-burn
              <input inputMode="numeric" value={hnb} placeholder="0" onChange={(e) => setHnb(e.target.value)} className={`${field} font-mono`} />
              <select value={hnbType} onChange={(e) => setHnbType(e.target.value as "sticks" | "capsules")} className={`${field} mt-1 text-xs`}>
                <option value="sticks">sticks (IQOS / glo)</option>
                <option value="capsules">capsules (Ploom TECH)</option>
              </select>
            </label>
            <label className="block text-xs text-muted">
              Other tobacco (g)
              <input inputMode="numeric" value={otherTobacco} placeholder="0" onChange={(e) => setOtherTobacco(e.target.value)} className={`${field} font-mono`} />
            </label>
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-foreground">Perfume · 2 oz (about 56 ml)</legend>
          <label className="mt-2 block text-xs text-muted">
            Perfume ml (eau de toilette / cologne not counted)
            <input inputMode="numeric" value={perfume} placeholder="0" onChange={(e) => setPerfume(e.target.value)} className={`${field} font-mono sm:max-w-48`} />
          </label>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-foreground">Other goods · ¥200,000 total (overseas price)</legend>
          <p className="mt-1 text-xs text-muted">One row per kind of item. Price of one item in yen. A kind worth ¥10,000 or less in total is free and not counted.</p>
          <div className="mt-2 space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_7rem_4rem] gap-2 sm:grid-cols-[1fr_8rem_4rem_auto]">
                <input aria-label="Item" value={r.description} placeholder="Item (e.g. handbag)" onChange={(e) => setRow(i, { description: e.target.value })} className={field} />
                <input aria-label="Price of one (¥)" inputMode="numeric" value={r.value} placeholder="¥ each" onChange={(e) => setRow(i, { value: e.target.value })} className={`${field} font-mono`} />
                <input aria-label="Quantity" inputMode="numeric" value={r.quantity} onChange={(e) => setRow(i, { quantity: e.target.value })} className={`${field} font-mono`} />
                <div className="col-span-3 flex items-center gap-3 text-xs text-muted sm:col-span-1 sm:mt-2">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={r.watch} onChange={(e) => setRow(i, { watch: e.target.checked })} /> watch / golf / PC
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={r.child} onChange={(e) => setRow(i, { child: e.target.checked })} /> for child
                  </label>
                  <button type="button" onClick={() => setRows(rows.length > 1 ? rows.filter((_, j) => j !== i) : rowsFrom({}))} className="text-muted underline hover:text-foreground">
                    remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setRows([...rows, { description: "", value: "", quantity: "1", watch: false, child: false }])} className="mt-3 rounded-full border border-line px-4 py-1.5 text-sm text-muted hover:border-amber/60">
            + Add item
          </button>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-foreground">Cash and checks · declare over ¥1,000,000</legend>
          <label className="mt-2 block text-xs text-muted">
            Cash, travelers checks, securities you carry (¥)
            <input inputMode="numeric" value={cash} placeholder="0" onChange={(e) => setCash(e.target.value)} className={`${field} font-mono sm:max-w-60`} />
          </label>
        </fieldset>
      </div>

      <article data-testid="result-card" className="relative flex flex-col overflow-hidden rounded-3xl border border-line bg-black/50 lg:sticky lg:top-16 lg:self-start">
        <div className="p-5 sm:p-7">
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Japan Customs allowance · rules {result?.rulesAsOf ?? "2026-10-14"}</p>
          {result ? (
            <>
              <h2 className={`mt-2 font-display text-5xl ${result.withinAllowance ? "text-teal-200" : "text-amber"}`}>{result.withinAllowance ? "Within allowance" : `≈ ${yen(result.estimatedSimplifiedDutyJPY)} duty`}</h2>
              <p className="mt-2 text-sm text-muted">
                {result.withinAllowance ? "Nothing over the duty-free allowance." : `Over on: ${overText(result.overCategories)}.`}{" "}
                {result.estimatedSimplifiedDutyHighJPY !== result.estimatedSimplifiedDutyJPY ? `Up to ${yen(result.estimatedSimplifiedDutyHighJPY)} under the strict tobacco reading. ` : ""}
                Channel: <span className="font-mono text-foreground">{result.channel === "red" ? "RED (declare)" : "GREEN"}</span>
                {result.notEstimated.length ? ` · not in the yen figure: ${result.notEstimated.join("; ")}` : ""}
              </p>
              <ul className="mt-4 space-y-2" data-testid="status">
                {result.alcohol.declaredMl > 0 && <Status ok={result.alcohol.withinAllowance} label={`Alcohol ${result.alcohol.declaredMl.toLocaleString()} ml / ${result.alcohol.allowanceMl.toLocaleString()} ml`} />}
                {result.tobacco.kinds.length > 0 && <Status ok={result.tobacco.withinAllowance} label={`Tobacco: ${result.tobacco.kinds.map((k) => `${k.quantity} ${k.unit}`).join(" + ")}`} />}
                {result.perfume.declaredMl > 0 && <Status ok={result.perfume.withinAllowance} label={`Perfume ${result.perfume.declaredMl} ml / ${result.perfume.allowanceMl} ml`} />}
                {result.otherGoods.mode !== "none" && <Status ok={result.otherGoods.withinAllowance} label={`Other goods ${yen(result.otherGoods.countedValueJPY)} counted / ${yen(result.otherGoods.allowanceJPY)}`} />}
                {result.cash.totalJPY > 0 && <Status ok={!result.cashDeclarationRequired} label={`Cash ${yen(result.cash.totalJPY)} ${result.cashDeclarationRequired ? "→ declare on the form" : "(no form)"}`} />}
              </ul>
              {!result.withinAllowance && (
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Liquor tax", result.dutyBreakdown.alcoholJPY],
                    ["Tobacco tax", result.dutyBreakdown.tobaccoTaxJPY],
                    ["Customs duty (15%)", result.dutyBreakdown.customsDutyJPY],
                    ["Consumption tax", result.dutyBreakdown.consumptionTaxJPY],
                  ].map(([k, v]) => (
                    <div key={k as string} className="rounded-2xl border border-line p-3">
                      <dt className="text-xs text-muted">{k}</dt>
                      <dd className="font-mono text-foreground">{yen(v as number)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {result.otherGoods.items.length > 0 && (
                <ul className="mt-4 space-y-1 text-xs text-muted">
                  {result.otherGoods.items.map((it, i) => (
                    <li key={i}>
                      {it.description} {yen(it.unitValueJPY)}
                      {it.quantity > 1 ? ` × ${it.quantity}` : ""}: <span className="text-foreground">{it.treatment.replace(/_/g, " ")}</span>
                      {it.estimatedTaxJPY ? ` (≈ ${yen(it.estimatedTaxJPY)})` : ""}
                    </li>
                  ))}
                </ul>
              )}
              <ul className="mt-5 space-y-1.5 text-xs leading-relaxed text-muted">
                {[...result.warnings, ...result.simplifiedDutyNotes, ...result.notes].map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="text-amber">·</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-line pt-4" data-testid="share-result">
                <p className="text-xs text-muted">Share this result. The link carries only these numbers; nothing is stored.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ShareBar url={shareUrl} text={result.withinAllowance ? "My Japan customs check: within the duty-free allowance. Free checker:" : `My Japan customs check: about ${yen(result.estimatedSimplifiedDutyJPY)} duty on the excess. Free checker:`} />
                  <a href={path} className="text-sm text-muted underline underline-offset-2 hover:text-foreground">
                    Open result page
                  </a>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">{error}</p>
          )}
        </div>
        <CardDisclaimer />
      </article>
    </div>
  );
}
