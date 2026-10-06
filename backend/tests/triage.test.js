import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

const start = async () => {
  const { app } = createApp();
  const srv = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${srv.address().port}`;
  return { srv, base };
};

const login = (base, email) =>
  fetch(`${base}/api/auth/google`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });

const authH = (token) => ({ authorization: `Bearer ${token}` });

test("canonical statuses: legacy In Review maps to In Progress", async () => {
  const { srv, base } = await start();
  try {
    const token = (await (await login(base, "aina@parlimen.gov.my")).json()).token;
    const aduan = (await (await fetch(`${base}/api/aduan`, { headers: authH(token) })).json()).aduan;
    assert.equal(aduan.find((a) => a.id === 1).status, "In Progress");
    assert.equal(aduan.find((a) => a.id === 5).status, "Pending");
  } finally {
    srv.close();
  }
});

test("only Wakil closes: Intern cannot Resolved, Wakil can", async () => {
  const { srv, base } = await start();
  try {
    const intern = (await (await login(base, "danish@parlimen.gov.my")).json()).token;
    const denied = await fetch(`${base}/api/aduan/5`, {
      method: "PATCH",
      headers: { "content-type": "application/json", ...authH(intern) },
      body: JSON.stringify({ status: "Resolved" }),
    });
    assert.equal(denied.status, 403);

    const wakil = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const ok = await fetch(`${base}/api/aduan/5`, {
      method: "PATCH",
      headers: { "content-type": "application/json", ...authH(wakil) },
      body: JSON.stringify({ status: "Resolved" }),
    });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).aduan.status, "Resolved");
  } finally {
    srv.close();
  }
});

test("Intern self-claim/release allowed, reassign of others denied", async () => {
  const { srv, base } = await start();
  try {
    const intern = (await (await login(base, "danish@parlimen.gov.my")).json()).token;
    const h = { "content-type": "application/json", ...authH(intern) };
    const claimed = await fetch(`${base}/api/aduan/6`, { method: "PATCH", headers: h, body: JSON.stringify({ assigneeId: "u-intern" }) });
    assert.equal(claimed.status, 200);
    // Intern tries to hand pool aduan to someone else
    const denied = await fetch(`${base}/api/aduan/8`, { method: "PATCH", headers: h, body: JSON.stringify({ assigneeId: "u-aide" }) });
    assert.equal(denied.status, 403);
  } finally {
    srv.close();
  }
});

test("Aide reassigns, Wakil manages staff; Intern manages nothing", async () => {
  const { srv, base } = await start();
  try {
    const aide = (await (await login(base, "aina@parlimen.gov.my")).json()).token;
    const re = await fetch(`${base}/api/aduan/8`, {
      method: "PATCH",
      headers: { "content-type": "application/json", ...authH(aide) },
      body: JSON.stringify({ assigneeId: "u-intern" }),
    });
    assert.equal(re.status, 200);

    const intern = (await (await login(base, "danish@parlimen.gov.my")).json()).token;
    const forbidden = await fetch(`${base}/api/staff`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authH(intern) },
      body: JSON.stringify({ email: "x@parlimen.gov.my", role: "Intern" }),
    });
    assert.equal(forbidden.status, 403);

    const wakil = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const created = await fetch(`${base}/api/staff`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authH(wakil) },
      body: JSON.stringify({ email: "new@parlimen.gov.my", role: "Intern", expiresAt: "2026-12-31" }),
    });
    assert.equal(created.status, 201);
  } finally {
    srv.close();
  }
});

test("expiry/deactivation releases claimed aduan to pool + blocks session", async () => {
  const { srv, base } = await start();
  try {
    const wakil = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const h = { "content-type": "application/json", ...authH(wakil) };
    // Intern holds aduan 4; deactivate intern
    const off = await fetch(`${base}/api/staff/u-intern`, { method: "PATCH", headers: h, body: JSON.stringify({ active: false }) });
    assert.equal(off.status, 200);
    const item = await (await fetch(`${base}/api/aduan/4`, { headers: authH(wakil) })).json();
    assert.equal(item.aduan.assigneeId, null);
    assert.match(item.aduan.history.at(-1).detail, /released to pool/);
    // Deactivated intern cannot log in
    assert.equal((await login(base, "danish@parlimen.gov.my")).status, 401);
  } finally {
    srv.close();
  }
});

test("kawasan returns single kod + geojsonRef", async () => {
  const { srv, base } = await start();
  try {
    const wakil = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const k = (await (await fetch(`${base}/api/kawasan`, { headers: authH(wakil) })).json()).kawasan;
    assert.equal(k.kod, "P.108");
    assert.ok(k.geojsonRef.endsWith(".geojson"));
  } finally {
    srv.close();
  }
});
