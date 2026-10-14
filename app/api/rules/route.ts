import { preflight, staticJson } from "@/lib/agent-api";
import { PUBLIC_URL } from "@/lib/api";
import { RULES } from "@/lib/customs";

function handler() {
  return staticJson({ ...RULES, docs: `${PUBLIC_URL}/openapi.json`, calculator: `${PUBLIC_URL}/api/check` });
}
export const GET = handler;
export const POST = handler;
export const OPTIONS = preflight;
