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

test("ray-cast: inside P.108, outside Klang points", () => {
  const boundary = kodFeature("parlimen", "P.108");
  assert.ok(featureContains(boundary, 101.486, 3.075));
  assert.equal(featureContains(boundary, 101.4, 3.05), false);
  assert.equal(featureContains(boundary, 101.6, 3.15), false);
  assert.equal(pointInRing(-1, -1, [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]), false);
  assert.equal(pointInRing(0.5, 0.5, [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]), true);
});

test("GET /api/kawasan/pins needs auth, flags inside/outside", async () => {
  const { srv, base } = await start();
  try {
    const noAuth = await fetch(`${base}/api/kawasan/pins?level=parlimen&kod=P.108`);
    assert.equal(noAuth.status, 401);

    const { token } = await login(base);
    const h = { authorization: `Bearer ${token}` };

    const noKod = await fetch(`${base}/api/kawasan/pins?level=parlimen`, { headers: h });
    assert.equal(noKod.status, 400);
    const dunNoState = await fetch(`${base}/api/kawasan/pins?level=dun&kod=N.40`, { headers: h });
    assert.equal(dunNoState.status, 400);
    const missing = await fetch(`${base}/api/kawasan/pins?level=parlimen&kod=P.999`, { headers: h });
    assert.equal(missing.status, 404);

    const { pins } = await (
      await fetch(`${base}/api/kawasan/pins?level=parlimen&kod=P.108&state=Selangor`, { headers: h })
    ).json();
    assert.equal(pins.length, 100);
    assert.equal(pins.filter((p) => p.inside).length, 92);
    assert.equal(pins.filter((p) => !p.inside).length, 8);
    const one = pins.find((p) => p.id === 1);
    assert.equal(one.inside, true);
    assert.ok(one.title);
  } finally {
    srv.close();
  }
});
