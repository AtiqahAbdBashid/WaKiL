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

test("per-complaint assignment rejected: pool complaint claims via group only", async () => {
  const { srv, base } = await start();
  try {
    const intern = (await (await login(base, "danish@parlimen.gov.my")).json()).token;
    const h = { "content-type": "application/json", ...authH(intern) };
    // Direct per-complaint claim is gone.
    const rejected = await fetch(`${base}/api/aduan/6`, { method: "PATCH", headers: h, body: JSON.stringify({ assigneeId: "u-intern" }) });
    assert.equal(rejected.status, 400);
    assert.match((await rejected.json()).error, /case group only/);
    // Ungrouped pool complaint carries no per-complaint owner field.
    const item = await (await fetch(`${base}/api/aduan/6`, { headers: authH(intern) })).json();
    assert.equal(item.aduan.case_group_id, null);
    assert.ok(!("assigneeId" in item.aduan));
  } finally {
    srv.close();
  }
});

test("en-bloc claim: Representative opens unowned, Aide claims, Representative cannot", async () => {
  const { srv, base } = await start();
  try {
    const rep = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const aide = (await (await login(base, "aina@parlimen.gov.my")).json()).token;
    const j = (t) => ({ "content-type": "application/json", ...authH(t) });
    // Representative opens a group unowned (never holds work).
    const created = await fetch(`${base}/api/case-groups`, {
      method: "POST",
      headers: j(rep),
      body: JSON.stringify({ title: "Pool round" }),
    });
    assert.equal(created.status, 201);
    const group = (await created.json()).case_group;
    assert.equal(group.owner_staff_id, null);
    // Group pool complaint 6 first.
    const grouped = await fetch(`${base}/api/aduan/6`, {
      method: "PATCH",
      headers: j(rep),
      body: JSON.stringify({ case_group_id: group.id }),
    });
    assert.equal(grouped.status, 200);
    assert.equal((await grouped.json()).aduan.case_group_id, group.id);
    // Aide claims the whole group en-bloc.
    const claim = await fetch(`${base}/api/case-groups/${group.id}/claim-all`, { method: "POST", headers: j(aide) });
    assert.equal(claim.status, 200);
    const { case_group, claimed } = await claim.json();
    assert.equal(case_group.owner_staff_id, "u-aide");
    assert.deepEqual(claimed, [6]);
    // Representative never claims.
    const repClaim = await fetch(`${base}/api/case-groups/${group.id}/claim-all`, { method: "POST", headers: j(rep) });
    assert.equal(repClaim.status, 403);
  } finally {
    srv.close();
  }
});

test("whole-group transfer: owner moves group, Intern non-owner denied, Representative target rejected", async () => {
  const { srv, base } = await start();
  try {
    const aide = (await (await login(base, "aina@parlimen.gov.my")).json()).token;
    const intern2 = (await (await login(base, "sara@parlimen.gov.my")).json()).token;
    const j = (t) => ({ "content-type": "application/json", ...authH(t) });
    // cg-lights seeded owned by u-aide; owner transfers en-bloc to an Intern.
    const moved = await fetch(`${base}/api/case-groups/cg-lights`, {
      method: "PATCH",
      headers: j(aide),
      body: JSON.stringify({ owner_staff_id: "u-intern" }),
    });
    assert.equal(moved.status, 200);
    assert.equal((await moved.json()).case_group.owner_staff_id, "u-intern");
    const member = await (await fetch(`${base}/api/aduan/5`, { headers: authH(aide) })).json();
    assert.equal(member.aduan.history.at(-1).action, "reassign");
    // Intern holding nothing cannot move someone else's group.
    const denied = await fetch(`${base}/api/case-groups/cg-drainage`, {
      method: "PATCH",
      headers: j(intern2),
      body: JSON.stringify({ owner_staff_id: "u-intern2" }),
    });
    assert.equal(denied.status, 403);
    // Representative never holds groups.
    const repTarget = await fetch(`${base}/api/case-groups/cg-lights`, {
      method: "PATCH",
      headers: j(aide),
      body: JSON.stringify({ owner_staff_id: "u-representative" }),
    });
    assert.equal(repTarget.status, 400);
  } finally {
    srv.close();
  }
});

test("Representative manages staff; Intern manages nothing", async () => {
  const { srv, base } = await start();
  try {
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

test("expiry/deactivation returns owned groups to pool + blocks session", async () => {
  const { srv, base } = await start();
  try {
    const representative = (await (await login(base, "yb.khairul@parlimen.gov.my")).json()).token;
    const h = { "content-type": "application/json", ...authH(representative) };
    // u-aide owns cg-lights (members 5, 8, 15, 28, 30); deactivate owner.
    const off = await fetch(`${base}/api/staff/u-aide`, { method: "PATCH", headers: h, body: JSON.stringify({ active: false }) });
    assert.equal(off.status, 200);
    const item = await (await fetch(`${base}/api/aduan/5`, { headers: authH(representative) })).json();
    assert.equal(item.aduan.case_group_id, null);
    assert.ok(!("assigneeId" in item.aduan));
    assert.equal(item.aduan.history.at(-1).action, "release");
    assert.match(item.aduan.history.at(-1).detail, /released to pool/);
    const groups = (await (await fetch(`${base}/api/case-groups`, { headers: authH(representative) })).json()).case_groups;
    assert.equal(groups.find((g) => g.id === "cg-lights").owner_staff_id, null);
    // Deactivated aide cannot log in
    assert.equal((await login(base, "aina@parlimen.gov.my")).status, 401);
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
