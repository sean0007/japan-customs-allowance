// Shared helpers for the free, keyless JSON API. Same file in every tool repo.
// CORS is open, there is no key, and GET responses are CDN-cacheable.

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Access-Control-Max-Age": "86400",
};

/** Fair-use limit per IP per warm server instance. Generous on purpose. */
export const RATE_LIMIT = 120;
const WINDOW_MS = 60_000;
const hits = new Map<string, { n: number; reset: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "anon").trim();
}

export function rateLimit(req: Request): { ok: boolean; remaining: number; resetSec: number } {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const key = clientIp(req);
  const cur = hits.get(key);
  const entry = !cur || cur.reset < now ? { n: 0, reset: now + WINDOW_MS } : cur;
  entry.n += 1;
  hits.set(key, entry);
  return { ok: entry.n <= RATE_LIMIT, remaining: Math.max(0, RATE_LIMIT - entry.n), resetSec: Math.ceil((entry.reset - now) / 1000) };
}

export type Input = Record<string, unknown>;

/** Reads query parameters (GET) and a JSON or form body (POST). Body wins on conflicts. */
export async function readInput(req: Request): Promise<Input> {
  const out: Input = {};
  for (const [k, v] of new URL(req.url).searchParams) {
    const prev = out[k];
    out[k] = prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  if (req.method === "POST") {
    const type = req.headers.get("content-type") ?? "";
    try {
      if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
        const form = await req.formData();
        for (const [k, v] of form) if (typeof v === "string") out[k] = v;
      } else {
        const text = await req.text();
        if (text.trim()) {
          const body = JSON.parse(text);
          if (body && typeof body === "object" && !Array.isArray(body)) Object.assign(out, body);
        }
      }
    } catch {
      throw new InputError("Body must be a JSON object (Content-Type: application/json).");
    }
  }
  return out;
}

export class InputError extends Error {}

export function num(input: Input, key: string, fallback?: number): number {
  const raw = input[key];
  if (raw === undefined || raw === null || raw === "") {
    if (fallback !== undefined) return fallback;
    throw new InputError(`Missing number: ${key}`);
  }
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[,_\s$%¥€£]/g, ""));
  if (!Number.isFinite(n)) throw new InputError(`Not a number: ${key}`);
  return n;
}

export function str(input: Input, key: string, fallback?: string): string {
  const raw = input[key];
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === undefined || v === null || String(v).trim() === "") {
    if (fallback !== undefined) return fallback;
    throw new InputError(`Missing text: ${key}`);
  }
  return String(v).trim();
}

export function bool(input: Input, key: string, fallback: boolean): boolean {
  const raw = input[key];
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw === "boolean") return raw;
  return /^(1|true|yes|y|on)$/i.test(String(raw).trim());
}

export function oneOf<T extends string>(input: Input, key: string, allowed: readonly T[], fallback?: T): T {
  const raw = input[key];
  const v = (Array.isArray(raw) ? raw[0] : raw)?.toString().trim();
  if (!v) {
    if (fallback !== undefined) return fallback;
    throw new InputError(`Missing ${key}. Allowed: ${allowed.join(", ")}`);
  }
  if (!(allowed as readonly string[]).includes(v)) throw new InputError(`Invalid ${key}: "${v}". Allowed: ${allowed.join(", ")}`);
  return v as T;
}

export function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS, ...extra },
  });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Wraps a pure compute function as a GET+POST handler with CORS, fair-use limiting,
 * input errors as 400, and the tool's disclaimer on every response.
 */
export function apiHandler(compute: (input: Input) => unknown, meta: { disclaimer: string; docs: string; example?: string }) {
  return async function handler(req: Request): Promise<Response> {
    const rl = rateLimit(req);
    const rlHeaders = { "RateLimit-Limit": String(RATE_LIMIT), "RateLimit-Remaining": String(rl.remaining), "RateLimit-Reset": String(rl.resetSec) };
    if (!rl.ok) {
      return json({ error: "Too many requests. Please slow down and retry shortly.", disclaimer: meta.disclaimer }, 429, { ...rlHeaders, "Retry-After": String(rl.resetSec) });
    }
    try {
      const input = await readInput(req);
      const result = compute(input);
      const cache = req.method === "GET" ? { "Cache-Control": "public, max-age=300, s-maxage=86400" } : { "Cache-Control": "no-store" };
      return json({ ...(result as object), disclaimer: meta.disclaimer, docs: meta.docs }, 200, { ...rlHeaders, ...cache });
    } catch (e) {
      if (e instanceof InputError) {
        return json({ error: e.message, docs: meta.docs, example: meta.example, disclaimer: meta.disclaimer }, 400, rlHeaders);
      }
      return json({ error: "Unexpected error.", disclaimer: meta.disclaimer }, 500, rlHeaders);
    }
  };
}

/* ---------- OpenAPI + plugin manifest builders ---------- */

export type Param = {
  name: string;
  type: "number" | "integer" | "string" | "boolean" | "array" | "object";
  description: string;
  required?: boolean;
  enum?: readonly string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  /** Arrays are POST-body only; give a GET alternative in the description. */
  items?: Record<string, unknown>;
  /** Hide from GET query parameters (for example, when another field covers GET). */
  postOnly?: boolean;
};

export type Endpoint = {
  path: string;
  operationId: string;
  summary: string;
  description: string;
  params: Param[];
  example: string;
  compute: (input: Input) => unknown;
};

function schemaOf(p: Param): Record<string, unknown> {
  const s: Record<string, unknown> = { type: p.type, description: p.description };
  if (p.enum) s.enum = p.enum;
  if (p.default !== undefined) s.default = p.default;
  if (p.minimum !== undefined) s.minimum = p.minimum;
  if (p.maximum !== undefined) s.maximum = p.maximum;
  if (p.items) s.items = p.items;
  return s;
}

const RESPONSES = {
  "200": { description: "Result as JSON. Always includes a `disclaimer` field.", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
  "400": { description: "Missing or invalid input. The body explains what to send and gives an example." },
  "429": { description: "Too many requests from one IP. Retry after the Retry-After seconds." },
};

export function openapiDoc(info: { title: string; description: string; version?: string }, base: string, endpoints: Endpoint[]) {
  const paths: Record<string, unknown> = {};
  for (const e of endpoints) {
    const required = e.params.filter((p) => p.required).map((p) => p.name);
    paths[e.path] = {
      get: {
        operationId: e.operationId,
        summary: e.summary,
        description: `${e.description}\n\nExample: ${base}${e.example}`,
        parameters: e.params
          .filter((p) => p.type !== "array" && p.type !== "object" && !p.postOnly)
          .map((p) => ({ name: p.name, in: "query", required: !!p.required, description: p.description, schema: schemaOf(p) })),
        responses: RESPONSES,
      },
      post: {
        operationId: `${e.operationId}Post`,
        summary: `${e.summary} (JSON body)`,
        description: e.description,
        requestBody: {
          required: required.length > 0,
          content: {
            "application/json": {
              schema: { type: "object", required, properties: Object.fromEntries(e.params.map((p) => [p.name, schemaOf(p)])) },
            },
          },
        },
        responses: RESPONSES,
      },
    };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: info.title,
      version: info.version ?? "1.0.0",
      description: `${info.description}\n\nFree, no API key, CORS open. Fair use: about ${RATE_LIMIT} requests per minute per IP. Also available as MCP tools at https://free-agent-tools.vercel.app/mcp`,
    },
    servers: [{ url: base }],
    paths,
  };
}

export function aiPluginManifest(base: string, o: { name: string; nameForModel: string; descriptionForHuman: string; descriptionForModel: string; logo: string }) {
  return {
    schema_version: "v1",
    name_for_human: o.name,
    name_for_model: o.nameForModel,
    description_for_human: o.descriptionForHuman.slice(0, 100),
    description_for_model: o.descriptionForModel,
    auth: { type: "none" },
    api: { type: "openapi", url: `${base}/openapi.json`, is_user_authenticated: false },
    logo_url: o.logo.startsWith("http") ? o.logo : `${base}${o.logo}`,
    legal_info_url: `${base}/legal/disclaimer`,
    contact_url: "https://github.com/sean0007",
  };
}

export function staticJson(data: unknown): Response {
  return json(data, 200, { "Cache-Control": "public, max-age=3600" });
}
