// Backend API: Google session stub + staff/aduan triage + kawasan.
// Google OAuth real verify deferred: POST /api/auth/google accepts an
// allowlisted staff email as idToken stand-in and mints an opaque token
// (base64 staff id). Frontend sends it as `Authorization: Bearer <token>`.
import express from "express";
import cors from "cors";
import { canManageStaff, canReassign, canSetStatus, canViewStaff, hasAccess, isValidStatus, ROLES, STATUSES } from "./domain.js";
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
    if (!email || !ROLES.includes(role) || role === "Wakil")
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

  // Triage: claim/release (self), reassign (Wakil/Aide), status (Wakil-only close).
  app.patch("/api/aduan/:id", auth, (req, res) => {
    const item = store.getAduan(req.params.id);
    if (!item) return res.status(404).json({ error: "not found" });
    const { assigneeId, status } = req.body ?? {};
    const me = req.user;

    if (assigneeId !== undefined) {
      const next = assigneeId || null;
      const selfOnly = next === me.id || next === null;
      const reassigningOther = !selfOnly && assigneeId !== item.assigneeId;
      if ((reassigningOther || (item.assigneeId && item.assigneeId !== me.id && next !== item.assigneeId)) && !canReassign(me.role))
        return res.status(403).json({ error: "Wakil/Aide only" });
      if (next && !hasAccess(store.getStaff(next)))
        return res.status(400).json({ error: "assignee has no access" });
    }
    if (status !== undefined) {
      if (!isValidStatus(status)) return res.status(400).json({ error: `status in ${STATUSES}` });
      if (!canSetStatus(me.role, status)) return res.status(403).json({ error: "only Wakil closes" });
    }

    const updated = store.mutateAduan(req.params.id, (a, { audit }) => {
      if (assigneeId !== undefined) {
        const next = assigneeId || null;
        const action = next === null ? "release" : item.assigneeId === null ? "claim" : "reassign";
        a.assigneeId = next;
        audit(a, me.id, action, `${me.name} ${action} → ${next ?? "pool"}`);
      }
      if (status !== undefined && status !== item.status) {
        const from = a.status;
        a.status = status;
        audit(a, me.id, "status", `${from} → ${status}`);
      }
    });
    res.json({ aduan: updated });
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
