// YB office staff mock. TODO: replace with real API + Google OAuth accounts.
// ERD gap: no STAFF table yet, so Aide/Intern exist only here. Names are fictional.
export const ybStaff = [
  { id: "u-wakil", name: "YB Khairul", role: "Wakil", email: "yb.khairul@parlimen.gov.my", active: true, expiresAt: null, initials: "YB" },
  { id: "u-aide", name: "Aina Rahman", role: "Aide", email: "aina@parlimen.gov.my", active: true, expiresAt: null, initials: "AR" },
  { id: "u-aide2", name: "Faizal Omar", role: "Aide", email: "faizal@parlimen.gov.my", active: true, expiresAt: null, initials: "FO" },
  { id: "u-aide3", name: "Mei Chen", role: "Aide", email: "mei@parlimen.gov.my", active: true, expiresAt: null, initials: "MC" },
  { id: "u-intern", name: "Danish Lim", role: "Intern", email: "danish@parlimen.gov.my", active: true, expiresAt: "2026-12-31", initials: "DL" },
  { id: "u-intern2", name: "Sara Ali", role: "Intern", email: "sara@parlimen.gov.my", active: true, expiresAt: "2026-12-31", initials: "SA" },
];

export const staffName = (id) => ybStaff.find((s) => s.id === id)?.name ?? "Unassigned";
