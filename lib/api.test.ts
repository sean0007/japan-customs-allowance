import assert from "node:assert/strict";
import test from "node:test";
import { apiHandler, openapiDoc, preflight } from "./agent-api";
import { API_DISCLAIMER, API_INFO, ENDPOINTS, EXAMPLE_GET, PLUGIN, PUBLIC_URL } from "./api";

const e = ENDPOINTS.check;
const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });
const post = (body: unknown) => handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));

test(`GET ${EXAMPLE_GET} → over, ¥11,400, CORS, disclaimer, sharePath`, async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${EXAMPLE_GET}`));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const b = await res.json();
  assert.equal(b.disclaimer, API_DISCLAIMER);
  assert.equal(b.rulesAsOf, "2026-10-14");
  assert.equal(b.withinAllowance, false);
  assert.deepEqual(b.overCategories, ["alcohol", "otherGoods"]);
  assert.equal(b.estimatedSimplifiedDutyJPY, 11400);
  assert.equal(b.cashDeclarationRequired, false);
  assert.ok(b.sources.length >= 5);
  assert.ok(b.sharePath.startsWith("/r?"));
  assert.ok(Array.isArray(b.warnings));
});

test("POST JSON body matches GET", async () => {
  const url = new URL(`${PUBLIC_URL}${EXAMPLE_GET}`);
  const body = Object.fromEntries(url.searchParams);
  const p = await post(body);
  const g = await handler(new Request(url));
  assert.equal(p.status, 200);
  assert.deepEqual(await p.json(), await g.json());
});

test("POST with goods objects and alcohol list", async () => {
  const res = await post({ ageYears: 40, alcohol: [{ type: "whisky", ml: 3000 }], goods: [{ description: "Watch", valueJPY: 300000, dutyFreeTariff: true }], cashJPY: 1500000 });
  assert.equal(res.status, 200);
  const b = await res.json();
  assert.equal(b.cashDeclarationRequired, true);
  assert.equal(b.otherGoods.items[0].treatment, "dutiable_over_200k");
  assert.equal(b.otherGoods.items[0].rate, "consumption_tax_10%");
  assert.equal(b.dutyBreakdown.consumptionTaxJPY, 17900);
});

test("nothing to check → 400 with example and disclaimer", async () => {
  const r = await handler(new Request(`${PUBLIC_URL}${e.path}`));
  assert.equal(r.status, 400);
  const b = await r.json();
  assert.ok(b.error && b.example);
  assert.equal(b.disclaimer, API_DISCLAIMER);
});

test("bad inputs → 400", async () => {
  for (const q of ["cigarettes=-5", "cigarettes=1.5", "alcoholBottles=2&alcoholType=juice", "goods=abc", "travelers=0", "hnbSticks=10&hnbCapsules=5", "ageYears=200&cigarettes=1"]) {
    const r = await handler(new Request(`${PUBLIC_URL}${e.path}?${q}`));
    assert.equal(r.status, 400, q);
  }
  const bad = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{oops" }));
  assert.equal(bad.status, 400);
  assert.equal((await post({ goods: [{ description: "x" }] })).status, 400);
});

test("OPTIONS preflight is CORS open", () => {
  const res = preflight();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  assert.match(res.headers.get("access-control-allow-methods") ?? "", /POST/);
});

test("OpenAPI spec lists /api/check with GET and POST, goods in POST body", () => {
  const spec = openapiDoc(API_INFO, PUBLIC_URL, [e]) as { openapi: string; servers: { url: string }[]; paths: Record<string, { get: { parameters: { name: string }[] }; post: { requestBody: { content: Record<string, { schema: { properties: Record<string, unknown> } }> } } }> };
  assert.equal(spec.openapi, "3.1.0");
  assert.equal(spec.servers[0].url, PUBLIC_URL);
  const p = spec.paths["/api/check"];
  assert.ok(p?.get && p?.post);
  assert.ok(p.get.parameters.some((x) => x.name === "cigarettes"));
  assert.ok(p.post.requestBody.content["application/json"].schema.properties.goods);
});

test("plugin manifest copy fits", () => {
  assert.ok(PLUGIN.descriptionForHuman.length <= 100);
  assert.equal(PLUGIN.nameForModel, "japan_customs_allowance");
});
