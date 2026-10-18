export const SITE_NAME = "Japan Customs Allowance Checker";

export const SITE_TAGLINE =
  "Arriving in Japan with duty-free shopping? Check the per-person customs allowance (3 bottles of alcohol, 200 cigarettes, 2 oz perfume, ¥200,000 of other goods), see what is over, the estimated simplified duty in yen, and whether you must declare cash over ¥1,000,000.";

export const DISCLAIMER_SHORT = "Educational estimate, not customs or legal advice. Not affiliated with Japan Customs; the officer's assessment at the airport is final.";

export const HONESTY =
  "Rules as of 2026-10-14 from Japan Customs (税関) pages 7104, 7105, 7106 and the official duty calculation example. Not affiliated with Japan Customs or the Ministry of Finance.";

export const SIBLING_TOOLS = [
  { href: "https://japan-tax-free-refund.vercel.app", label: "Japan Tax-Free Refund" },
  { href: "https://japan-luggage.vercel.app", label: "Japan Luggage Check" },
  { href: "https://japan-visa-fee.vercel.app", label: "Japan Visa Fee Calculator" },
  { href: "https://japan-tb-screening.vercel.app", label: "Japan TB Screening (JPETS)" },
  { href: "https://japan-dual-pricing.vercel.app", label: "Japan Dual Pricing" },
  { href: "https://japan-alert-decoder.vercel.app", label: "Japan Alert Decoder" },
  { href: "https://japan-pr-check.vercel.app", label: "Japan PR Guideline Check" },
  { href: "https://kyushu-travel-discount.vercel.app", label: "Kyushu Travel Discount" },
  { href: "https://japan-trip-brain.vercel.app", label: "Japan Trip Brain" },
  { href: "https://hotel-ota-calculator.vercel.app", label: "Hotel OTA Calculator" },
  { href: "https://free-agent-tools.vercel.app", label: "Free Agent Tools MCP" },
] as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  return "https://japan-customs-allowance.vercel.app";
}
