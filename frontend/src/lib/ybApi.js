// YB staff API client. Requests go to /api, which the Vite dev server proxies to
// the backend; set VITE_API_URL to call a different host.
// The signed token is kept in sessionStorage after POST /api/auth/google.
const base = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "wakil.token";

const headers = () => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  return {
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function call(path, options = {}) {
  const res = await fetch(`${base}/api${path}`, { ...options, headers: headers() });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : `${options.method ?? "GET"} ${path}: ${res.status}`;
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

const send = (path, method, payload) =>
  call(path, { method, body: JSON.stringify(payload ?? {}) });

export const ybApi = {
  async googleLogin(email) {
    const { token, user } = await send("/auth/google", "POST", { email });
    sessionStorage.setItem(TOKEN_KEY, token);
    return user;
  },
  hasToken: () => !!sessionStorage.getItem(TOKEN_KEY),
  logout: () => sessionStorage.removeItem(TOKEN_KEY),
  me: () => call("/me").then((r) => r.user),
  staff: () => call("/staff").then((r) => r.staff),
  inviteStaff: (payload) => send("/staff", "POST", payload).then((r) => r.staff),
  setStaffActive: (id, active) => send(`/staff/${id}`, "PATCH", { active }).then((r) => r.staff),
  aduan: () => call("/aduan").then((r) => r.aduan),
  patchAduan: (id, patch) => send(`/aduan/${id}`, "PATCH", patch).then((r) => r.aduan),
  resolveAduan: (id, payload) => send(`/aduan/${id}/resolve`, "POST", payload),
  addUpdate: (id, payload) => send(`/aduan/${id}/updates`, "POST", payload),
  kawasan: () => call("/kawasan").then((r) => r.kawasan),
  categories: () => call("/categories").then((r) => r.categories),
  serviceCenters: () => call("/service-centers").then((r) => r.service_centers),
  caseGroups: () => call("/case-groups").then((r) => r.case_groups),
  createCaseGroup: (payload) => send("/case-groups", "POST", payload),
  pullGroup: (sourceGroupId, destGroupId) =>
    send(`/case-groups/${sourceGroupId}/pull`, "POST", { dest_group_id: destGroupId }),
  kawasanGeojson: ({ level, state, kod }) => {
    const q = new URLSearchParams({ level });
    if (state) q.set("state", state);
    if (kod) q.set("kod", kod);
    return call(`/kawasan/geojson?${q}`);
  },
  pins: ({ level, state, kod }) => {
    const q = new URLSearchParams({ level });
    if (state) q.set("state", state);
    if (kod) q.set("kod", kod);
    return call(`/kawasan/pins?${q}`).then((r) => r.pins);
  },
};
