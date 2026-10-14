import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calculator } from "@/components/calculator";
import { checkAllowance } from "@/lib/customs";
import { EXAMPLE_SHARED, PUBLIC_URL, isExample, ogPath, overText, parseShared, resultPath, yen } from "@/lib/share";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

type SP = Promise<Record<string, string | string[] | undefined>>;

function headline(r: ReturnType<typeof checkAllowance>) {
  if (r.withinAllowance) return r.cashDeclarationRequired ? "Within allowance, but declare your cash" : "Within Japan's duty-free allowance";
  return `About ${yen(r.estimatedSimplifiedDutyJPY)} duty: over on ${overText(r.overCategories)}`;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const shared = parseShared(await searchParams);
  if (!shared) return { title: "Your result", robots: { index: false, follow: true } };
  const r = checkAllowance(shared);
  const title = `${headline(r)} (Japan customs check)`;
  const description = `Japan Customs per-person allowance: 3 bottles, 200 cigarettes, 2 oz perfume, ¥200,000 goods. Channel: ${r.channel}. Rules as of ${r.rulesAsOf}. Estimate only; the Customs officer decides.`;
  const url = `${PUBLIC_URL}${resultPath(shared)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isExample(shared) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: `Japan Customs Allowance · ${title}`, description, type: "website", url, images: [{ url: ogPath(shared), width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title: `Japan Customs Allowance · ${title}`, description, images: [ogPath(shared)] },
  };
}

export default async function ResultPage({ searchParams }: { searchParams: SP }) {
  const shared = parseShared(await searchParams);
  if (!shared) redirect("/");
  const r = checkAllowance(shared);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Shared result · Japan Customs Allowance</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          <span className={r.withinAllowance ? "text-teal-200" : "text-amber"}>{headline(r)}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Channel: {r.channel === "red" ? "red (declare)" : "green"} · {r.travelers} traveler{r.travelers === 1 ? "" : "s"} · rules as of {r.rulesAsOf}
          {r.estimatedSimplifiedDutyHighJPY !== r.estimatedSimplifiedDutyJPY ? ` · up to ${yen(r.estimatedSimplifiedDutyHighJPY)} under the strict tobacco reading` : ""}
        </p>
        <p className="mt-4 text-sm">
          <Link href="/" className="text-muted underline underline-offset-2 hover:text-foreground">
            ← Start over
          </Link>
          {isExample(shared) ? null : (
            <>
              {" · "}
              <Link href={resultPath(EXAMPLE_SHARED)} className="text-muted underline underline-offset-2 hover:text-foreground">
                Open the example
              </Link>
            </>
          )}
        </p>
      </section>
      <section className="mt-8">
        <Calculator initial={shared} />
      </section>
      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted">
        {DISCLAIMER_SHORT} {HONESTY}
      </p>
    </div>
  );
}
