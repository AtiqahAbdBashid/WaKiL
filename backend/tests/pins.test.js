import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";
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

test("ray-cast: N.34 contains its centre, Taman Medan/Seri Setia points outside", () => {
  const boundary = kodFeature("dun", "N.34", "Selangor");
  assert.ok(featureContains(boundary, 101.64432, 3.10491));
  assert.equal(featureContains(boundary, 101.57741, 3.12327), false);
  assert.equal(featureContains(boundary, 101.63865, 3.07133), false);
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

    // 90 seed points inside N.34 Bukit Gasing; 10 in adjacent DUNs.
    const { pins } = await (
      await fetch(`${base}/api/kawasan/pins?level=dun&kod=N.34&state=Selangor`, { headers: h })
    ).json();
    assert.equal(pins.length, 100);
    assert.equal(pins.filter((p) => p.inside).length, 90);
    assert.equal(pins.filter((p) => !p.inside).length, 10);
    const outsiders = pins.filter((p) => !p.inside).map((p) => p.id).sort((a, b) => a - b);
    assert.deepEqual(outsiders, [11, 12, 27, 34, 44, 63, 67, 71, 85, 96]);
    const one = pins.find((p) => p.id === 1);
    assert.equal(one.inside, true);
    assert.ok(one.title);
  } finally {
    srv.close();
  }
});

test("seed integrity: body, time_of_occurrence, citizen_id", () => {
  const store = createStore();
  const aduan = store.listAduan();
  const citizens = store.listCitizens();
  assert.equal(aduan.length, 100);
  assert.equal(citizens.length, 60);

  const bodies = new Set();
  for (const a of aduan) {
    assert.ok(typeof a.body === "string" && a.body.trim().length > 0, `complaint ${a.id} body`);
    assert.ok(!bodies.has(a.body), `complaint ${a.id} body unique`);
    bodies.add(a.body);

    assert.ok(typeof a.time_of_occurrence === "string", `complaint ${a.id} time`);
    assert.match(a.time_of_occurrence, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/);
    const t = new Date(a.time_of_occurrence);
    assert.ok(!Number.isNaN(t.getTime()), `complaint ${a.id} time parses`);
    assert.ok(a.time_of_occurrence.slice(0, 10) <= a.date, `complaint ${a.id} time <= date`);
    const hour = Number(a.time_of_occurrence.slice(11, 13));
    assert.ok(hour >= 7 && hour <= 22, `complaint ${a.id} hour 07-22`);

    assert.ok(typeof a.citizen_id === "string", `complaint ${a.id} citizen_id`);
    assert.ok(store.getCitizen(a.citizen_id), `complaint ${a.id} citizen resolves`);
  }
  const uniqueCitizens = new Set(aduan.map((a) => a.citizen_id));
  assert.equal(uniqueCitizens.size, 60);
});
