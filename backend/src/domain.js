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

export const ROLES = ["Representative", "Aide", "Intern"];

export const normalizeStatus = (s) => LEGACY_STATUS_MAP[s] ?? s;

export const isValidStatus = (s) => STATUSES.includes(s);

export const isExpired = (staff, now = new Date()) =>
  !!staff?.expiresAt && new Date(staff.expiresAt) < now;

export const hasAccess = (staff, now = new Date()) =>
  !!staff && staff.active && !isExpired(staff, now);

// Only Representative closes aduan (Resolved/Declined). Aide + Intern work
// Pending/In Progress only.
export const canSetStatus = (role, status) => {
  if (!isValidStatus(status)) return false;
  if (status === "Resolved" || status === "Declined") return role === "Representative";
  return role === "Representative" || role === "Aide" || role === "Intern";
};

// Representative + Aide reassign anyone. Intern touches own claim only.
export const canReassign = (role) => role === "Representative" || role === "Aide";

export const canManageStaff = (role) => role === "Representative";

export const canViewStaff = (role) => role === "Representative";
