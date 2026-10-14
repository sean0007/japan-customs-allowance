import { InputError } from "./agent-api";
import { RuleInputError, checkAllowance, hasAnythingToCheck, type CheckInput } from "./customs";
import { parseCheckInput, toQuery } from "./parse";

export const PUBLIC_URL = "https://japan-customs-allowance.vercel.app";

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

/** Example: 4 bottles of whisky, 1 carton of cigarettes, ¥250,000 of shopping in two items. */
export const EXAMPLE_SHARED: CheckInput = {
  ageYears: 35,
  alcohol: [{ type: "whisky", ml: 3040, bottles: 4, mlAssumed: true }],
  cigarettes: 200,
  goods: [
    { valueJPY: 120000, quantity: 1, dutyFreeTariff: false, forChild: false },
    { valueJPY: 130000, quantity: 1, dutyFreeTariff: false, forChild: false },
  ],
};

/** Parses a share link (same names as the API). Returns null when nothing valid to show. */
export function parseShared(p: Params): CheckInput | null {
  const input: Record<string, unknown> = {};
  if (p instanceof URLSearchParams) for (const [k, v] of p) input[k] = v;
  else for (const [k, v] of Object.entries(p)) if (v !== undefined) input[k] = Array.isArray(v) ? v[0] : v;
  try {
    const parsed = parseCheckInput(input);
    if (!hasAnythingToCheck(parsed)) return null;
    checkAllowance(parsed);
    return parsed;
  } catch (e) {
    if (e instanceof InputError || e instanceof RuleInputError) return null;
    throw e;
  }
}

export const sharedQuery = (s: CheckInput) => toQuery(s);
export const resultPath = (s: CheckInput) => `/r?${sharedQuery(s)}`;
export const ogPath = (s: CheckInput) => `/og?${sharedQuery(s)}`;
export const isExample = (s: CheckInput) => sharedQuery(s) === sharedQuery(EXAMPLE_SHARED);
export const yen = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;
export const overText = (cats: string[]) => cats.map((c) => (c === "otherGoods" ? "other goods" : c)).join(", ");
