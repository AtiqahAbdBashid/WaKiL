// Backend API: Google session stub + staff/aduan triage + kawasan.
// Google OAuth real verify deferred: POST /api/auth/google accepts an
// allowlisted staff email as idToken stand-in and mints an opaque token
// (base64 staff id). Frontend sends it as `Authorization: Bearer <token>`.
import express from "express";
import cors from "cors";
import { canClaimGroup, canManageStaff, canReassign, canSetStatus, canViewStaff, hasAccess, isValidStatus, ROLES, STATUSES } from "./domain.js";
import { createStore } from "./store.js";
import { featureContains, kodFeature, negeriView } from "./kawasan.js";

const encodeToken = (id) => Buffer.from(id, "utf8").toString("base64");
const decodeToken = (t) => {
  try {
    return Buffer.from(t, "base64").toString("utf8");
  } catch {
    return null;
  }
};

export function createApp(store = createStore()) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Attach session from Bearer token; expired/deactivated staff get 401 so
  // the frontend drops them back to login.
  const auth = (req, res, next) => {
    const token = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "missing token" });
    const staff = store.getStaff(decodeToken(token));
    if (!hasAccess(staff)) return res.status(401).json({ error: "session expired" });
    req.user = staff;
    next();
  };

  const requireRole = (fn) => (req, res, next) => {
    if (!fn(req.user.role)) return res.status(403).json({ error: "forbidden" });
    next();
  };

  // Session: email allowlist stands in for Google idToken verify.
  app.post("/api/auth/google", (req, res) => {
    const { idToken, email } = req.body ?? {};
    const lookup = email ?? idToken;
    if (!lookup) return res.status(400).json({ error: "email or idToken required" });
    const staff = store.getStaffByEmail(lookup);
    if (!hasAccess(staff)) return res.status(401).json({ error: "no access" });
    store.sweepExpired();
    res.json({ token: encodeToken(staff.id), user: { ...staff } });
  });

  app.get("/api/me", auth, (req, res) => res.json({ user: { ...req.user } }));

  app.get("/api/staff", auth, requireRole(canViewStaff), (_req, res) => res.json({ staff: store.listStaff() }));

  app.post("/api/staff", auth, requireRole(canManageStaff), (req, res) => {
    const { email, role, expiresAt } = req.body ?? {};
    if (!email || !ROLES.includes(role) || role === "Representative")
      return res.status(400).json({ error: "email + role Aide/Intern required" });
    if (store.getStaffByEmail(email)) return res.status(409).json({ error: "exists" });
    res.status(201).json({ staff: store.addStaff({ role, email, expiresAt }) });
  });

  app.patch("/api/staff/:id", auth, requireRole(canManageStaff), (req, res) => {
    const updated = store.setStaffActive(req.params.id, req.body?.active !== false, req.user.id);
    if (!updated) return res.status(404).json({ error: "not found" });
    res.json({ staff: updated });
  });

  app.get("/api/aduan", auth, (_req, res) => res.json({ aduan: store.listAduan() }));
  app.get("/api/aduan/:id", auth, (req, res) => {
    const item = store.getAduan(req.params.id);
    if (!item) return res.status(404).json({ error: "not found" });
    res.json({ aduan: item });
  });

  // Triage: per-complaint assignment is gone (owner equals worker via
  // Case_Group.owner_staff_id). PATCH handles status + group membership only;
  // claiming/transfer happens en-bloc at the case-group endpoints below.
  app.patch("/api/aduan/:id", auth, (req, res) => {
    const item = store.getAduan(req.params.id);
    if (!item) return res.status(404).json({ error: "not found" });
    const { assigneeId, status, case_group_id } = req.body ?? {};
    const me = req.user;

    if (assigneeId !== undefined)
      return res.status(400).json({ error: "assignment via case group only" });
    if (status !== undefined) {
      if (!isValidStatus(status)) return res.status(400).json({ error: `status in ${STATUSES}` });
      if (!canSetStatus(me.role, status)) return res.status(403).json({ error: "only Representative closes" });
    }
    if (case_group_id !== undefined && case_group_id !== null && !store.getCaseGroup(case_group_id))
      return res.status(400).json({ error: "case group not found" });

    const updated = store.mutateAduan(req.params.id, (a, { audit }) => {
      if (status !== undefined && status !== item.status) {
        const from = a.status;
        a.status = status;
        audit(a, me.id, "status", `${from} → ${status}`);
      }
      if (case_group_id !== undefined) {
        a.case_group_id = case_group_id || null;
        a.case_group_confirmed = false;
        if (case_group_id) audit(a, me.id, "group-assign", `${me.name} tentatively added to ${case_group_id}`);
        else audit(a, me.id, "group-remove", `${me.name} returned to pool`);
      }
    });
    res.json({ aduan: updated });
  });

  app.get("/api/service-centers", auth, (_req, res) => res.json({ service_centers: store.listServiceCenters() }));

  // Case groups own assignment: Representative opens groups unowned (never
  // holds work); Aide/Intern create-and-claim en-bloc in one step.
  app.get("/api/case-groups", auth, (_req, res) => res.json({ case_groups: store.listCaseGroups() }));
  app.post("/api/case-groups", auth, (req, res) => {
    if (!canReassign(req.user.role) && !canClaimGroup(req.user.role))
      return res.status(403).json({ error: "forbidden" });
    const { title, category } = req.body ?? {};
    if (!title) return res.status(400).json({ error: "title required" });
    const owner_staff_id = req.user.role === "Representative" ? null : req.user.id;
    res.status(201).json({ case_group: store.createCaseGroup({ title, category, owner_staff_id }) });
  });
  app.post("/api/case-groups/:id/confirm", auth, (req, res) => {
    if (!canReassign(req.user.role)) return res.status(403).json({ error: "Representative/Aide only" });
    const group = store.getCaseGroup(req.params.id);
    if (!group) return res.status(404).json({ error: "not found" });
    const ids = req.body?.complaintIds ?? group.memberIds;
    const confirmed = [];
    for (const id of ids) {
      const item = store.getAduan(id);
      if (!item || item.case_group_id !== group.id) return res.status(400).json({ error: `complaint ${id} not in group` });
      if (item.status === "Resolved" || item.status === "Declined")
        return res.status(400).json({ error: `complaint ${id} closed` });
      store.mutateAduan(id, (a, { audit }) => {
        a.case_group_confirmed = true;
        audit(a, req.user.id, "group-confirm", `${req.user.name} confirmed in ${group.title}`);
      });
      confirmed.push(id);
    }
    res.json({ case_group: store.getCaseGroup(group.id), confirmed });
  });
  // En-bloc claim: claimant becomes group owner; every open member shares
  // that owner as single assignee. Ungrouped pool complaints are never
  // claimed directly — group first, then claim the group.
  app.post("/api/case-groups/:id/claim-all", auth, (req, res) => {
    if (!canClaimGroup(req.user.role)) return res.status(403).json({ error: "Aide/Intern only" });
    const group = store.getCaseGroup(req.params.id);
    if (!group) return res.status(404).json({ error: "not found" });
    if (group.owner_staff_id && group.owner_staff_id !== req.user.id && !canReassign(req.user.role))
      return res.status(403).json({ error: "Representative/Aide only" });
    store.setCaseGroupOwner(group.id, req.user.id);
    const claimed = [];
    for (const id of group.memberIds) {
      const item = store.getAduan(id);
      if (!item || item.status === "Resolved" || item.status === "Declined") continue;
      store.mutateAduan(id, (a, { audit }) => {
        audit(a, req.user.id, "claim", `${req.user.name} claimed en-bloc via ${group.title}`);
      });
      claimed.push(id);
    }
    res.json({ case_group: store.getCaseGroup(group.id), claimed });
  });

  // Whole-group transfer (release semantics): owner or Representative/Aide
  // moves the entire group to another Aide/Intern. No per-complaint move.
  app.patch("/api/case-groups/:id", auth, (req, res) => {
    const group = store.getCaseGroup(req.params.id);
    if (!group) return res.status(404).json({ error: "not found" });
    const next = req.body?.owner_staff_id;
    if (!next) return res.status(400).json({ error: "owner_staff_id required" });
    const target = store.getStaff(next);
    if (!hasAccess(target)) return res.status(400).json({ error: "assignee has no access" });
    if (target.role === "Representative")
      return res.status(400).json({ error: "Representative does not hold groups" });
    const isOwner = group.owner_staff_id === req.user.id;
    if (!isOwner && !canReassign(req.user.role))
      return res.status(403).json({ error: "Representative/Aide only" });
    if (group.owner_staff_id === next)
      return res.json({ case_group: store.getCaseGroup(group.id) });
    store.setCaseGroupOwner(group.id, next);
    for (const id of group.memberIds) {
      const item = store.getAduan(id);
      if (!item || item.status === "Resolved" || item.status === "Declined") continue;
      store.mutateAduan(id, (a, { audit }) => {
        audit(a, req.user.id, "reassign", `${req.user.name} transferred ${group.title} to ${target.name}`);
      });
    }
    res.json({ case_group: store.getCaseGroup(group.id) });
  });

  app.get("/api/kawasan", auth, (_req, res) => res.json({ kawasan: store.getKawasan() }));

  // Aduan pins: authed, titles staff-only. inside = point in kod boundary.
  // Dun kod repeats per state, so dun + kod requires state.
  app.get("/api/kawasan/pins", auth, (req, res) => {
    const level = String(req.query.level ?? "parlimen").toLowerCase();
    if (!["parlimen", "dun"].includes(level))
      return res.status(400).json({ error: "level is parlimen|dun" });
    const { state, kod } = req.query;
    if (!kod) return res.status(400).json({ error: "kod required" });
    if (level === "dun" && !state)
      return res.status(400).json({ error: "dun kod needs state" });
    const boundary = kodFeature(level, kod, state);
    if (!boundary) return res.status(404).json({ error: "kod not found" });
    const pins = store
      .listAduan()
      .filter((a) => a.lokasi_geojson?.type === "Point")
      .map((a) => {
        const [lng, lat] = a.lokasi_geojson.coordinates;
        return {
          id: a.id,
          title: a.title,
          status: a.status,
          lng,
          lat,
          inside: featureContains(boundary, lng, lat),
        };
      });
    return res.json({ pins });
  });

  // Kawasan geo: public CC0 boundary data, no session needed.
  // Parlimen kod is nationally unique; dun kod repeats per state, so
  // dun + kod requires state to disambiguate.
  app.get("/api/kawasan/geojson", (req, res) => {
    const level = String(req.query.level ?? "parlimen").toLowerCase();
    if (!["parlimen", "dun"].includes(level))
      return res.status(400).json({ error: "level is parlimen|dun" });
    const { state, kod } = req.query;
    if (!state && !kod)
      return res.status(400).json({ error: "pass state and/or kod" });
    if (kod) {
      if (level === "dun" && !state)
        return res.status(400).json({ error: "dun kod needs state" });
      const feat = kodFeature(level, kod, state);
      if (!feat) return res.status(404).json({ error: "kod not found" });
      res.set("cache-control", "public, max-age=86400");
      return res.json(feat);
    }
    const fc = negeriView(level, state);
    if (!fc || fc.features.length === 0)
      return res.status(404).json({ error: "state not found" });
    res.set("cache-control", "public, max-age=86400");
    return res.json(fc);
  });

  return { app, store };
}
