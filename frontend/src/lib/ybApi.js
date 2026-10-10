// Backend API client. Mock data stays default; set VITE_API_URL to use backend.
// Token stored in sessionStorage after POST /api/auth/google.
const base = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");

const headers = () => {
  const token = sessionStorage.getItem("wakil.token");
  return {
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
};

async function call(path, options = {}) {
  const res = await fetch(`${base}/api${path}`, { ...options, headers: headers() });
  if (!res.ok) throw new Error(`${options.method ?? "GET"} ${path}: ${res.status}`);
  return res.json();
}

export const ybApi = {
  async googleLogin(email) {
    const { token, user } = await call("/auth/google", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    sessionStorage.setItem("wakil.token", token);
    return user;
  },
  me: () => call("/me"),
  staff: () => call("/staff").then((r) => r.staff),
  aduan: () => call("/aduan").then((r) => r.aduan),
  patchAduan: (id, patch) =>
    call(`/aduan/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r.aduan),
  kawasan: () => call("/kawasan").then((r) => r.kawasan),
  serviceCenters: () => call("/service-centers").then((r) => r.service_centers),
  caseGroups: () => call("/case-groups").then((r) => r.case_groups),
  createCaseGroup: (payload) =>
    call("/case-groups", { method: "POST", body: JSON.stringify(payload) }).then((r) => r.case_group),
  // Future backend contract for the pull model: adding pool complaints to
  // an existing group, pulling singles between groups, and pulling a whole
  // group into another. Unused by the mock context; kept here so the UI
  // handlers have a client shape to adopt.
  addToCaseGroup: (groupId, complaintIds) =>
    call(`/case-groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ complaintIds }),
    }).then((r) => r.case_group),
  moveComplaintToGroup: (complaintId, destGroupId) =>
    call(`/aduan/${complaintId}/move`, {
      method: "POST",
      body: JSON.stringify({ dest_group_id: destGroupId }),
    }).then((r) => r.aduan),
  moveGroupToGroup: (sourceGroupId, destGroupId) =>
    call(`/case-groups/${sourceGroupId}/pull`, {
      method: "POST",
      body: JSON.stringify({ dest_group_id: destGroupId }),
    }).then((r) => r.case_group),
  kawasanGeojson: ({ level, state, kod }) => {
    const q = new URLSearchParams({ level });
    if (state) q.set("state", state);
    if (kod) q.set("kod", kod);
    return call(`/kawasan/geojson?${q}`).then((r) => r);
  },
  pins: ({ level, state, kod }) => {
    const q = new URLSearchParams({ level });
    if (state) q.set("state", state);
    if (kod) q.set("kod", kod);
    return call(`/kawasan/pins?${q}`).then((r) => r.pins);
  },
};
