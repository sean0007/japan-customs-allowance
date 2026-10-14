import type { Metadata } from "next";
import { ASSUMPTIONS, SOURCES } from "@/lib/customs";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer", description: DISCLAIMER_SHORT };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Read this</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Disclaimer</h1>
      <p className="mt-4 text-lg text-foreground">{DISCLAIMER_SHORT}</p>
      <p className="mt-2 text-muted">{HONESTY}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">What this is</h2>
          <p className="mt-2">
            A free educational checker. A dated copy of Japan Customs&apos; published duty-free allowance for travelers entering Japan, its simplified duty rates for personal effects, and the means-of-payment declaration rule returns whether what you enter is within the allowance and an estimate of the duty on the excess.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">What it is not</h2>
          <p className="mt-2">
            It is not customs, tax or legal advice and not an official calculator. Customs officers decide how your articles are classified and valued (overseas market value is converted at Customs&apos; weekly published rate), which articles are exempt, whether the simplified rates apply, and whether goods count as personal. Prohibited and restricted items (drugs, firearms, counterfeit goods, plants and animals, medicine and cosmetics over set quantities, meat products) are outside this checker. Rules can change. When in doubt, ask a Customs officer or the Customs Counselor. Not affiliated with Japan Customs (税関) or the Ministry of Finance.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Assumptions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {ASSUMPTIONS.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SOURCES.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Your data</h2>
          <p className="mt-2">What you enter stays in your browser (or in a share link you create). No login, nothing stored, no database.</p>
        </section>
      </div>
    </div>
  );
}
