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

test("only Representative closes: Intern cannot Resolved, Representative can", async () => {
  const { srv, base } = await start();
  try {
    const intern = (await (await login(base, "danish@parlimen.gov.my")).json()).token;
    const denied = await fetch(`${base}/api/aduan/5`, {
      method: "PATCH",
      headers: { "content-type": "application/json", ...authH(intern) },
      body: JSON.stringify({ status: "Resolved" }),
    });
    assert.equal(denied.status, 403);

    const representative = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const ok = await fetch(`${base}/api/aduan/5`, {
      method: "PATCH",
      headers: { "content-type": "application/json", ...authH(representative) },
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

test("Aide reassigns, Representative manages staff; Intern manages nothing", async () => {
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

    const representative = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const created = await fetch(`${base}/api/staff`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authH(representative) },
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
    const representative = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const h = { "content-type": "application/json", ...authH(representative) };
    // Intern holds aduan 4; deactivate intern
    const off = await fetch(`${base}/api/staff/u-intern`, { method: "PATCH", headers: h, body: JSON.stringify({ active: false }) });
    assert.equal(off.status, 200);
    const item = await (await fetch(`${base}/api/aduan/4`, { headers: authH(representative) })).json();
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
    const representative = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const k = (await (await fetch(`${base}/api/kawasan`, { headers: authH(representative) })).json()).kawasan;
    assert.equal(k.kod, "N.34");
    assert.equal(k.level, "dun");
    assert.ok(k.geojsonRef.endsWith(".geojson"));
  } finally {
    srv.close();
  }
});

test("service centers: single office, staff share service_center_id", async () => {
  const { srv, base } = await start();
  try {
    const representative = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const h = { ...authH(representative) };
    const { service_centers } = await (await fetch(`${base}/api/service-centers`, { headers: h })).json();
    assert.equal(service_centers.length, 1);
    assert.equal(service_centers[0].id, "sc-bukit-gasing");
    assert.equal(service_centers[0].name, "ADUN Bukit Gasing Office");
    assert.equal(service_centers[0].constituency_kod, "N.34");
    const { staff } = await (await fetch(`${base}/api/staff`, { headers: h })).json();
    assert.equal(staff.length, 6);
    assert.ok(staff.every((s) => s.service_center_id === "sc-bukit-gasing"));
    assert.ok(staff.some((s) => s.role === "Representative"));
  } finally {
    srv.close();
  }
});

test("case groups: seed tentative, Representative confirms, Intern denied", async () => {
  const { srv, base } = await start();
  try {
    const rep = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const intern = (await (await login(base, "danish@parlimen.gov.my")).json()).token;
    const j = (t) => ({ "content-type": "application/json", ...authH(t) });
    const { case_groups } = await (await fetch(`${base}/api/case-groups`, { headers: authH(rep) })).json();
    assert.equal(case_groups.length, 2);
    const lights = case_groups.find((g) => g.id === "cg-lights");
    assert.deepEqual([...lights.memberIds].sort((a, b) => a - b), [5, 8, 15, 28, 30]);

    const denied = await fetch(`${base}/api/case-groups/cg-lights/confirm`, {
      method: "POST",
      headers: j(intern),
      body: JSON.stringify({ complaintIds: [5] }),
    });
    assert.equal(denied.status, 403);

    const ok = await fetch(`${base}/api/case-groups/cg-lights/confirm`, {
      method: "POST",
      headers: j(rep),
      body: JSON.stringify({ complaintIds: [5, 8] }),
    });
    assert.equal(ok.status, 200);
    const { confirmed } = await ok.json();
    assert.deepEqual(confirmed, [5, 8]);
    const item = await (await fetch(`${base}/api/aduan/5`, { headers: authH(rep) })).json();
    assert.equal(item.aduan.case_group_confirmed, true);
    assert.equal(item.aduan.history.at(-1).action, "group-confirm");
  } finally {
    srv.close();
  }
});
