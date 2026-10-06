// Canonical domain: statuses follow CONTEXT.md, not the frontend mock labels.
// Mock used New/In Review/In Action/Resolved; backend canonical is
// Pending/In Progress/Resolved/Declined.
export const STATUSES = ["Pending", "In Progress", "Resolved", "Declined"];

export const LEGACY_STATUS_MAP = {
  New: "Pending",
  "In Review": "In Progress",
  "In Action": "In Progress",
  Resolved: "Resolved",
};

export const ROLES = ["Wakil", "Aide", "Intern"];

export const normalizeStatus = (s) => LEGACY_STATUS_MAP[s] ?? s;

export const isValidStatus = (s) => STATUSES.includes(s);

export const isExpired = (staff, now = new Date()) =>
  !!staff?.expiresAt && new Date(staff.expiresAt) < now;

export const hasAccess = (staff, now = new Date()) =>
  !!staff && staff.active && !isExpired(staff, now);

// Only Wakil closes aduan (Resolved/Declined). Aide + Intern work
// Pending/In Progress only.
export const canSetStatus = (role, status) => {
  if (!isValidStatus(status)) return false;
  if (status === "Resolved" || status === "Declined") return role === "Wakil";
  return role === "Wakil" || role === "Aide" || role === "Intern";
};

// Wakil + Aide reassign anyone. Intern touches own claim only.
export const canReassign = (role) => role === "Wakil" || role === "Aide";

export const canManageStaff = (role) => role === "Wakil";

export const canViewStaff = (role) => role === "Wakil";
