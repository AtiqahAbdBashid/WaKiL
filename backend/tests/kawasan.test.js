import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { kodFeature, negeriView, normalizeKod } from "../src/kawasan.js";

const start = async () => {
  const { app } = createApp();
  const srv = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  return { srv, base: `http://127.0.0.1:${srv.address().port}` };
};

const login = (base) =>
  fetch(`${base}/api/auth/google`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "yb.khairul@parlimen.gov.my" }),
  }).then((r) => r.json());

test("normalizeKod accepts P105 and N34", () => {
  assert.equal(normalizeKod("P105"), "P.105");
  assert.equal(normalizeKod("P.105"), "P.105");
  assert.equal(normalizeKod("n34"), "N.34");
});

test("negeri view Selangor: 22 parlimen, 56 dun", () => {
  assert.equal(negeriView("parlimen", "Selangor").features.length, 22);
  assert.equal(negeriView("dun", "Selangor").features.length, 56);
});

test("kod lookup finds N.34 Bukit Gasing", () => {
  const f = kodFeature("dun", "N34", "Selangor");
  assert.equal(f.properties.dun, "N.34 Bukit Gasing");
  assert.equal(f.properties.state, "Selangor");
});

test("GET /api/kawasan/geojson serves negeri view + highlight", async () => {
  const { srv, base } = await start();
  try {
    const { token } = await login(base);
    const h = { authorization: `Bearer ${token}` };
    const negeri = await (
      await fetch(`${base}/api/kawasan/geojson?level=parlimen&state=Selangor`, { headers: h })
    ).json();
    assert.equal(negeri.type, "FeatureCollection");
    assert.equal(negeri.features.length, 22);

    const feat = await (
      await fetch(`${base}/api/kawasan/geojson?level=dun&kod=N.34&state=Selangor`, { headers: h })
    ).json();
    assert.equal(feat.properties.code_dun, "N.34");

    // Dun kod repeats per state: N.34 alone is ambiguous, with state it resolves.
    const dunNoState = await fetch(`${base}/api/kawasan/geojson?level=dun&kod=N.34`, { headers: h });
    assert.equal(dunNoState.status, 400);
    const dun = await (
      await fetch(`${base}/api/kawasan/geojson?level=dun&kod=N.34&state=Selangor`, { headers: h })
    ).json();
    assert.equal(dun.properties.dun, "N.34 Bukit Gasing");

    const badLevel = await fetch(`${base}/api/kawasan/geojson?level=negeri&state=Selangor`, { headers: h });
    assert.equal(badLevel.status, 400);
    const missing = await fetch(`${base}/api/kawasan/geojson?level=parlimen&kod=P.999`, { headers: h });
    assert.equal(missing.status, 404);
    const noAuth = await fetch(`${base}/api/kawasan/geojson?level=parlimen&state=Selangor`);
    assert.equal(noAuth.status, 200);
    assert.equal((await noAuth.json()).features.length, 22);
  } finally {
    srv.close();
  }
});
