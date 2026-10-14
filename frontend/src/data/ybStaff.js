// YB office staff mock. TODO: replace with real API + Google OAuth accounts.
// All staff share the single ADUN Bukit Gasing service center. Names are fictional.
export const SERVICE_CENTER_ID = "sc-bukit-gasing";

export const ybStaff = [
  { id: "u-representative", name: "YB Khairul", role: "Representative", email: "yb.khairul@parlimen.gov.my", active: true, expiresAt: null, initials: "YB", service_center_id: SERVICE_CENTER_ID },
  { id: "u-aide", name: "Aina Rahman", role: "Aide", email: "aina@parlimen.gov.my", active: true, expiresAt: null, initials: "AR", service_center_id: SERVICE_CENTER_ID },
  { id: "u-aide2", name: "Faizal Omar", role: "Aide", email: "faizal@parlimen.gov.my", active: true, expiresAt: null, initials: "FO", service_center_id: SERVICE_CENTER_ID },
  { id: "u-aide3", name: "Mei Chen", role: "Aide", email: "mei@parlimen.gov.my", active: true, expiresAt: null, initials: "MC", service_center_id: SERVICE_CENTER_ID },
  { id: "u-intern", name: "Danish Lim", role: "Intern", email: "danish@parlimen.gov.my", active: true, expiresAt: "2026-12-31T23:59:59+08:00", initials: "DL", service_center_id: SERVICE_CENTER_ID },
  { id: "u-intern2", name: "Sara Ali", role: "Intern", email: "sara@parlimen.gov.my", active: true, expiresAt: "2026-12-31T23:59:59+08:00", initials: "SA", service_center_id: SERVICE_CENTER_ID },
];

export const ybServiceCenter = {
  id: SERVICE_CENTER_ID,
  name: "ADUN Bukit Gasing Office",
  address: "7A, Jalan 52/8, Seksyen 52, 46200 Petaling Jaya, Selangor",
  constituency_kod: "N.34",
};

// Backlog seeds: one open group per staff holding their existing queue.
export const ybCaseGroups = [
  { id: "cg-lights", title: "Street light cluster Taman Sri Muda", category: "Infrastruktur + Jalan Raya", status: "Open", owner_staff_id: "u-aide" },
  { id: "cg-drainage", title: "Seksyen 31 drainage round", category: "Banjir + Saliran", status: "Open", owner_staff_id: "u-aide2" },
  { id: "cg-backlog-u-aide", title: "Backlog #2026-10-0001", category: "Mixed", status: "Open", owner_staff_id: "u-aide" },
  { id: "cg-backlog-u-aide2", title: "Backlog #2026-10-0002", category: "Mixed", status: "Open", owner_staff_id: "u-aide2" },
  { id: "cg-backlog-u-intern", title: "Backlog #2026-10-0003", category: "Mixed", status: "Open", owner_staff_id: "u-intern" },
  { id: "cg-backlog-u-aide3", title: "Backlog #2026-10-0004", category: "Mixed", status: "Open", owner_staff_id: "u-aide3" },
  { id: "cg-backlog-u-intern2", title: "Backlog #2026-10-0005", category: "Mixed", status: "Open", owner_staff_id: "u-intern2" },
];

export const staffName = (id) => ybStaff.find((s) => s.id === id)?.name ?? "Unassigned";
