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

test("normalizeKod accepts P108 and P.108", () => {
  assert.equal(normalizeKod("P108"), "P.108");
  assert.equal(normalizeKod("P.108"), "P.108");
  assert.equal(normalizeKod("n40"), "N.40");
});

test("negeri view Selangor: 22 parlimen, 56 dun", () => {
  assert.equal(negeriView("parlimen", "Selangor").features.length, 22);
  assert.equal(negeriView("dun", "Selangor").features.length, 56);
});

test("kod lookup finds P.108 Shah Alam", () => {
  const f = kodFeature("parlimen", "P108");
  assert.equal(f.properties.parlimen, "P.108 Shah Alam");
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
      await fetch(`${base}/api/kawasan/geojson?level=parlimen&kod=P.108`, { headers: h })
    ).json();
    assert.equal(feat.properties.code_parlimen, "P.108");

    // Dun kod repeats per state: N.40 alone is ambiguous, with state it resolves.
    const dunNoState = await fetch(`${base}/api/kawasan/geojson?level=dun&kod=N.40`, { headers: h });
    assert.equal(dunNoState.status, 400);
    const dun = await (
      await fetch(`${base}/api/kawasan/geojson?level=dun&kod=N.40&state=Selangor`, { headers: h })
    ).json();
    assert.equal(dun.properties.dun, "N.40 Kota Anggerik");

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
