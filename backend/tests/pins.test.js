import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { featureContains, kodFeature, pointInRing } from "../src/kawasan.js";

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

test("ray-cast: N.34 contains its centre, Shah Alam + Klang points outside", () => {
  const boundary = kodFeature("dun", "N.34", "Selangor");
  assert.ok(featureContains(boundary, 101.64432, 3.10491));
  assert.equal(featureContains(boundary, 101.486, 3.075), false);
  assert.equal(featureContains(boundary, 101.4, 3.05), false);
  assert.equal(featureContains(boundary, 101.6, 3.15), false);
  assert.equal(pointInRing(-1, -1, [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]), false);
  assert.equal(pointInRing(0.5, 0.5, [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]), true);
});

test("GET /api/kawasan/pins needs auth, flags inside/outside", async () => {
  const { srv, base } = await start();
  try {
    const noAuth = await fetch(`${base}/api/kawasan/pins?level=dun&kod=N.34&state=Selangor`);
    assert.equal(noAuth.status, 401);

    const { token } = await login(base);
    const h = { authorization: `Bearer ${token}` };

    const noKod = await fetch(`${base}/api/kawasan/pins?level=dun`, { headers: h });
    assert.equal(noKod.status, 400);
    const dunNoState = await fetch(`${base}/api/kawasan/pins?level=dun&kod=N.34`, { headers: h });
    assert.equal(dunNoState.status, 400);
    const missing = await fetch(`${base}/api/kawasan/pins?level=dun&kod=N.99&state=Selangor`, { headers: h });
    assert.equal(missing.status, 404);

    // Seed points predate the N.34 scope switch, so all fall outside.
    const { pins } = await (
      await fetch(`${base}/api/kawasan/pins?level=dun&kod=N.34&state=Selangor`, { headers: h })
    ).json();
    assert.equal(pins.length, 100);
    assert.equal(pins.filter((p) => p.inside).length, 0);
    assert.equal(pins.filter((p) => !p.inside).length, 100);
    const one = pins.find((p) => p.id === 1);
    assert.equal(one.inside, false);
    assert.ok(one.title);
  } finally {
    srv.close();
  }
});
