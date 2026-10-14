import assert from "node:assert/strict";
import test from "node:test";
import { computeCheck } from "./api";
import { EXAMPLE_SHARED, isExample, ogPath, parseShared, resultPath, sharedQuery } from "./share";

test("example shared round-trips", () => {
  const back = parseShared(new URLSearchParams(sharedQuery(EXAMPLE_SHARED)));
  assert.deepEqual(back, EXAMPLE_SHARED);
  assert.ok(back && isExample(back));
  assert.equal(resultPath(EXAMPLE_SHARED), "/r?ageYears=35&alcoholBottles=4&alcoholType=whisky&cigarettes=200&goods=120000,130000");
  assert.ok(ogPath(EXAMPLE_SHARED).startsWith("/og?"));
});

test("API sharePath opens the same result", () => {
  const api = computeCheck({ alcohol: "wine:1500,whisky:1500", hnbPackages: "12", perfumeOz: "3", goods: "80000,150000w,3000x3", cashJPY: "1200000", travelers: "2" });
  const shared = parseShared(new URLSearchParams(api.sharePath.slice(3)));
  assert.ok(shared);
  const again = computeCheck(Object.fromEntries(new URLSearchParams(api.sharePath.slice(3))));
  assert.equal(again.estimatedSimplifiedDutyJPY, api.estimatedSimplifiedDutyJPY);
  assert.equal(again.sharePath, api.sharePath);
});

test("parseShared rejects junk and empty links", () => {
  assert.equal(parseShared({}), null);
  assert.equal(parseShared({ ageYears: "30" }), null);
  assert.equal(parseShared({ cigarettes: "-1" }), null);
  assert.equal(parseShared({ goods: "abc" }), null);
});

test("overText humanizes categories", async () => {
  const { overText } = await import("./share");
  assert.equal(overText(["alcohol", "otherGoods"]), "alcohol, other goods");
});
