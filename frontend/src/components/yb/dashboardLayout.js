// Wakil dashboard widget registry + persisted layout helpers.
// Order/hide state lives here so DashboardPage stays lean.
export const DASHBOARD_WIDGETS = [
  { id: "kawasan", label: "Kawasan map", span: "lg:col-span-6" },
  { id: "mix", label: "Aduan by status / category", span: "lg:col-span-3" },
  { id: "trend", label: "Aduan trend per week", span: "lg:col-span-3" },
  { id: "aging", label: "Aduans by aging", span: "lg:col-span-6" },
  { id: "aging-table", label: "Aging table", span: "lg:col-span-6" },
  { id: "attention", label: "Needs attention", span: "lg:col-span-4" },
  { id: "workload", label: "Staff workload", span: "lg:col-span-2" },
];

export const DEFAULT_ORDER = DASHBOARD_WIDGETS.map((w) => w.id);

export const layoutKey = (userId) => `wakil:dashboard-layout:${userId ?? "anon"}`;

function sanitize(saved) {
  const ids = new Set(DASHBOARD_WIDGETS.map((w) => w.id));
  const order = (saved?.order ?? []).filter((id) => ids.has(id));
  for (const id of DEFAULT_ORDER) if (!order.includes(id)) order.push(id);
  const hidden = (saved?.hidden ?? []).filter((id) => ids.has(id));
  return { order, hidden };
}

export function loadDashboardLayout(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { order: [...DEFAULT_ORDER], hidden: [] };
    return sanitize(JSON.parse(raw));
  } catch {
    return { order: [...DEFAULT_ORDER], hidden: [] };
  }
}

export function saveDashboardLayout(key, { order, hidden }) {
  try {
    localStorage.setItem(key, JSON.stringify(sanitize({ order, hidden })));
  } catch {
    // storage full or blocked: layout just won't persist
  }
}

export function moveId(list, id, dir) {
  const i = list.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(i, 1);
  next.splice(j, 0, item);
  return next;
}

const FULL = "lg:col-span-6";

// Derive column spans from the visible set so lone halves go full width
// instead of leaving a hole. Not persisted, recomputed at render.
export function resolveSpans(visibleIds) {
  const out = {};
  for (const id of visibleIds) out[id] = FULL;
  const halves = visibleIds.filter((id) => id === "mix" || id === "trend");
  if (halves.length === 2) {
    const [a, b] = halves.map((id) => visibleIds.indexOf(id));
    if (b === a + 1) {
      out[halves[0]] = "lg:col-span-3";
      out[halves[1]] = "lg:col-span-3";
    }
  }
  const ai = visibleIds.indexOf("attention");
  if (ai >= 0 && visibleIds[ai + 1] === "workload") {
    out.attention = "lg:col-span-4";
    out.workload = "lg:col-span-2";
  }
  return out;
}
