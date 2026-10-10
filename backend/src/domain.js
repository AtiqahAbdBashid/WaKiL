// Canonical domain: statuses follow the 3-state lifecycle, not the frontend mock labels.
// Mock used New/In Review/In Action/Resolved; backend canonical is
// Pending/In Progress/Resolved.
export const STATUSES = ["Pending", "In Progress", "Resolved"];

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

// Status moves between open states are role-wide: Representative, Aide and
// Intern can set Pending/In Progress. Resolved is never granted by role
// alone — only the owning Staff of the Complaint's Case Group resolves (see
// canResolveOwned); the route enforces ownership, so this returns false for
// Resolved.
export const canSetStatus = (role, status) => {
  if (!isValidStatus(status)) return false;
  if (status === "Resolved") return false;
  return role === "Representative" || role === "Aide" || role === "Intern";
};

// Owner-only resolve: requester must match Case_Group.owner_staff_id.
// Representative never owns groups, so never resolves directly. Pool
// complaints (null owner) cannot resolve — group and claim first.
export const canResolveOwned = (ownerStaffId, requesterId) =>
  !!ownerStaffId && ownerStaffId === requesterId;

// Resolved is terminal: no status change out of Resolved (no reopen).
export const isTerminalStatus = (status) => status === "Resolved";

// Representative + Aide move work between staff (group transfer, confirm,
// create). Intern claims unowned groups and works owned groups only.
export const canReassign = (role) => role === "Representative" || role === "Aide";

// En-bloc claim: only Aide/Intern become group owners. Representative opens
// groups unowned and never holds work (owner equals worker).
export const canClaimGroup = (role) => role === "Aide" || role === "Intern";

export const canManageStaff = (role) => role === "Representative";

export const canViewStaff = (role) => role === "Representative";
