import { apiHandler, preflight } from "@/lib/agent-api";
import { API_DISCLAIMER, ENDPOINTS, PUBLIC_URL } from "@/lib/api";

const e = ENDPOINTS.check;
const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });

export const GET = handler;
export const POST = handler;
export const OPTIONS = preflight;
