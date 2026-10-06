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
