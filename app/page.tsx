import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { ALCOHOL_LABEL, ALCOHOL_RATE_PER_L, ALCOHOL_TYPES, RULES_AS_OF, SOURCES } from "@/lib/customs";
import { EXAMPLE_SHARED, PUBLIC_URL, resultPath } from "@/lib/share";

const title = "Japan customs allowance checker 2026: how much alcohol, cigarettes, perfume and shopping can you bring into Japan duty-free?";
const description =
  "Free Japan duty-free allowance checker for arrivals: 3 bottles of alcohol (760 ml each), 200 cigarettes or 10 IQOS packs, 2 oz perfume, ¥200,000 of other goods per adult. See what is over, the estimated duty in yen at Japan Customs' simplified rates, red or green channel, and whether to declare cash over ¥1,000,000. Free JSON API for AI agents. Unofficial estimate.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Japan Customs Allowance Checker",
  alternateName: ["Japan duty-free allowance calculator", "日本 免税範囲 チェッカー", "Japan customs duty calculator for travelers"],
  url: PUBLIC_URL,
  applicationCategory: "TravelApplication",
  operatingSystem: "Any",
  inLanguage: ["en", "ja"],
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  description:
    "Unofficial, free checker for Japan Customs' per-person duty-free allowance when entering Japan (alcohol, tobacco, perfume, ¥200,000 of other goods), with an estimated simplified duty in yen, red/green channel, and the cash over ¥1,000,000 declaration rule, plus a keyless JSON API. Educational estimate.",
};

const faq: FaqItem[] = [
  {
    q: "How much alcohol can I bring into Japan duty-free?",
    a: "3 bottles of about 760 ml each (2.28 L in total) per traveler aged 20 or over. Beyond that, Japan Customs' simplified rates are ¥800 per liter for whisky and brandy, ¥500 for rum, gin and vodka, ¥400 for liqueur, ¥300 for shochu and other distilled spirits, and ¥200 for wine, beer and other liquor. A fourth 750 ml bottle of whisky: 3,000 ml − 2,280 ml = 0.72 L × ¥800 = ¥576, truncated to ¥500.",
  },
  {
    q: "How many cigarettes can I bring into Japan?",
    a: "200 cigarettes (one carton) per adult, or 50 cigars, or 10 individual packages of heat-not-burn tobacco (200 IQOS or glo sticks, 50 Ploom TECH capsules), or 250 g of other tobacco. Excess cigarettes and heat-not-burn sticks are ¥15 each; capsules ¥50 each. The limit was halved on October 1, 2021, so older guides saying 400 are out of date.",
  },
  {
    q: "What if I carry more than one kind of tobacco?",
    a: "Japan Customs' English rule says the total allowance is then 250 g. Its own Japanese worked example, though, exempts only one kind in full (200 cigarettes) and taxes all the heat-not-burn capsules. This checker shows both: a low estimate under the 250 g reading and a high one under the strict reading. Ask the officer if it matters.",
  },
  {
    q: "What is the ¥200,000 duty-free allowance in Japan?",
    a: "The total overseas retail value of goods other than alcohol, tobacco and perfume must be ¥200,000 or less per person. Any kind of item whose total value is ¥10,000 or less (for example nine ¥1,000 chocolates, or two ¥5,000 ties) is free and does not count. Customs picks which items to exempt in your favor.",
  },
  {
    q: "I bought a ¥250,000 bag abroad. Is ¥200,000 of it duty-free?",
    a: "No. An article or set worth more than ¥200,000 on its own gets no duty-free allowance: the whole ¥250,000 is dutiable. Because its Customs value (about 60% of the overseas price) is over ¥100,000, the simplified 15% rate does not apply either, and the general tariff rate for that product is used.",
  },
  {
    q: "How is duty on excess shopping calculated in Japan?",
    a: "For travelers' souvenirs Customs uses a Customs value of about 60% of the overseas retail price. Most other goods pay a simplified 15% of that value (a ¥50,000 jacket → ¥30,000 × 15% = ¥4,500). Duty-free-tariff items such as wristwatches, golf clubs and PCs pay only 10% consumption tax. Each tax type is then truncated to ¥100. Japan Customs' own example of whisky, brandy, cigarettes, capsules, a bag, a ring, clothes and a watch comes to ¥19,400, which this checker reproduces.",
  },
  {
    q: "How much perfume can I bring into Japan?",
    a: "2 ounces, about 56 ml, per person. Eau de toilette and eau de cologne are not counted as perfume. Excess perfume is taxed on its value, so keep the receipt.",
  },
  {
    q: "Do I have to declare cash when entering Japan?",
    a: "Yes, if you carry cash (yen or foreign), checks, travelers checks, promissory notes or securities worth more than ¥1,000,000 in total, you must file the Declaration of Carrying of Means of Payment, etc. Exactly ¥1,000,000 does not need it. The threshold is ¥100,000 if you are leaving for North Korea. Gold bullion of 90%+ purity over 1 kg is declared on the same form.",
  },
  {
    q: "Do children get the same customs allowance in Japan?",
    a: "Travelers under 20 get no allowance for alcohol or tobacco, but still get the perfume and ¥200,000 allowances. Children under 6 get an allowance only for items clearly for the child, such as toys.",
  },
  {
    q: "Does my shipped (unaccompanied) baggage share the allowance?",
    a: "Yes. Accompanied and unaccompanied articles are added together against one allowance. Declare unaccompanied baggage on two copies of the declaration on arrival and receive it within six months.",
  },
  {
    q: "Red channel or green channel at Japan customs?",
    a: "Use the green channel only if nothing is over the allowance and you carry nothing prohibited or restricted. Otherwise use the red channel and pay at the bank counter in the Customs area. Every traveler still submits a customs declaration, on paper or through Visit Japan Web's QR code.",
  },
  {
    q: "Do I need to declare items I bought duty-free at the departure airport?",
    a: "Yes. Airport duty-free shopping is tax-free in the country you left, not in Japan. It counts toward Japan's allowance like anything else you bring in.",
  },
  {
    q: "日本入国時の免税範囲は？",
    a: "20歳以上の1人あたり、酒類3本（1本760ml）、紙巻たばこ200本（加熱式たばこ個装等10個、葉巻50本、その他250g）、香水2オンス、その他の品物は海外市価の合計20万円まで。1品目の合計が1万円以下のものは免税で合計に含めません。1個20万円を超える品物は全額課税です。",
  },
  {
    q: "免税範囲を超えたら税金はいくら？",
    a: "簡易税率でウイスキー・ブランデー800円/L、ラム・ジン・ウォッカ500円/L、リキュール400円/L、焼酎300円/L、ワイン・ビール等200円/L、紙巻たばこ・加熱式スティック15円/本、カプセル50円/個、その他の品物は課税価格（海外小売価格×0.6）の15％。腕時計・ゴルフクラブなどは消費税10％のみ。税関の計算例（合計19,400円）を再現します。",
  },
  {
    q: "Is there a free Japan customs allowance API for AI agents?",
    a: `Yes. Free, no key, CORS open: GET ${PUBLIC_URL}/api/check?alcoholBottles=4&alcoholType=whisky&cigarettes=200&goods=120000,130000 returns per-category within/over, the excess, the estimated simplified duty with a tax-type breakdown, red or green channel and the cash declaration flag. Full rules at ${PUBLIC_URL}/api/rules, OpenAPI at ${PUBLIC_URL}/openapi.json, and the japan_customs_allowance_check tool on https://free-agent-tools.vercel.app/mcp.`,
  },
];

const allowanceRows = [
  ["Alcohol", "3 bottles (≈ 760 ml each, 2.28 L)", "Age 20+ only"],
  ["Cigarettes", "200", "Or one other kind below; mixed kinds 250 g total"],
  ["Heat-not-burn", "10 packages (200 IQOS / glo sticks, 50 Ploom TECH capsules)", "Age 20+ only"],
  ["Cigars", "50", ""],
  ["Other tobacco", "250 g", ""],
  ["Perfume", "2 oz (≈ 56 ml)", "Eau de toilette / cologne not counted"],
  ["Other goods", "¥200,000 total overseas value", "Kinds ≤ ¥10,000 total excluded; any article > ¥200,000 fully dutiable"],
  ["Cash / checks / securities", "Declare over ¥1,000,000", "¥100,000 if bound for North Korea"],
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Free · Arriving in Japan · Customs 税関</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Japan customs allowance checker: is your duty-free haul OK?</h1>
        <p className="mt-4 max-w-2xl text-lg font-medium text-foreground sm:text-xl">3 bottles, 200 cigarettes, 2 oz perfume and ¥200,000 of shopping per adult.</p>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Enter what is in your bag. You see what is over, the duty Japan Customs&apos; simplified rates would charge in yen, red or green channel, and whether your cash needs the declaration form.
        </p>
      </section>

      <section className="mt-8">
        <Calculator />
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Duty-free allowance per person (as of {RULES_AS_OF})</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-panel/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Allowance</th>
                <th className="px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {allowanceRows.map(([a, b, c]) => (
                <tr key={a}>
                  <td className="px-4 py-3 text-foreground">{a}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b}</td>
                  <td className="px-4 py-3 text-xs text-muted">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">
          Simplified duty on the excess: {ALCOHOL_TYPES.filter((t) => !["brandy", "gin", "vodka", "beer", "other"].includes(t)).map((t) => `${ALCOHOL_LABEL[t].replace(" (shochu etc.)", "")} ¥${ALCOHOL_RATE_PER_L[t]}/L`).join(" · ")} · cigarettes and heat-not-burn sticks ¥15 each · capsules ¥50 · other goods 15% of 60% of the price. Example:{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_SHARED)}>
            4 bottles of whisky, a carton, ¥120,000 + ¥130,000 of shopping → about ¥11,400
          </a>
          .
        </p>
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Agent-callable JSON API</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          Free, no key, CORS open.{" "}
          <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-xs text-foreground">GET {PUBLIC_URL}/api/check?alcoholBottles=4&amp;alcoholType=whisky&amp;cigarettes=200&amp;goods=120000,130000</code> or POST JSON with goods as{" "}
          <code className="font-mono text-xs">[{"{"}valueJPY, quantity, dutyFreeTariff{"}"}]</code>. Also{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href="/api/rules">/api/rules</a>,{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href="/openapi.json">/openapi.json</a>,{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href="/llms.txt">/llms.txt</a>, and the MCP tool on{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href="https://free-agent-tools.vercel.app/" target="_blank" rel="noopener noreferrer">
            free-agent-tools
          </a>
          .
        </p>
        <p className="mt-3 text-xs text-muted">
          Official sources:{" "}
          {SOURCES.slice(0, 5).map((s, i) => (
            <span key={s}>
              {i > 0 ? " · " : ""}
              <a className="underline underline-offset-2 hover:text-foreground" href={s} target="_blank" rel="noopener noreferrer">
                {s.replace(/^https:\/\/www\./, "")}
              </a>
            </span>
          ))}
        </p>
      </section>

      <FaqSection items={faq} heading="Japan customs allowance questions" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
