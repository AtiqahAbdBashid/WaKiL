"""Canonical YB-portal domain rules.

Statuses follow the 3-state lifecycle: Pending / In Progress / Resolved.
Roles stay Representative, Aide, Intern per the glossary.

ERD v3: the status vocabulary becomes the COMPLAINT.status CHECK, roles
become USER.role, and the can_* helpers become application write guards.
"""

from datetime import datetime, timezone

# Lifecycle vocabulary for the COMPLAINT.status CHECK. The legacy map only
# migrates old seeds; it is not part of the ERD.
STATUSES = ["Pending", "In Progress", "Resolved"]

LEGACY_STATUS_MAP = {
    "New": "Pending",
    "In Review": "In Progress",
    "In Action": "In Progress",
    "Resolved": "Resolved",
}

ROLES = ["Representative", "Aide", "Intern"]


# Status guards: keep writes inside the 3-state lifecycle.
def normalize_status(s: str) -> str:
    return LEGACY_STATUS_MAP.get(s, s)


def is_valid_status(s: str) -> bool:
    return s in STATUSES


def is_terminal_status(status: str) -> bool:
    return status == "Resolved"


# Session guards: expired or deactivated staff lose access; their groups
# return to the pool.
def _parse_expiry(expires_at) -> datetime | None:
    if not expires_at:
        return None
    if isinstance(expires_at, datetime):
        dt = expires_at
    else:
        try:
            dt = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def is_expired(staff: dict | None, now: datetime | None = None) -> bool:
    if not staff or not staff.get("expiresAt"):
        return False
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    expiry = _parse_expiry(staff.get("expiresAt"))
    return expiry is not None and expiry < now


def has_access(staff: dict | None, now: datetime | None = None) -> bool:
    return bool(staff) and bool(staff.get("active")) and not is_expired(staff, now)


# Triage permissions: who may change status, claim, resolve, manage staff.
def can_set_status(role: str, status: str) -> bool:
    if not is_valid_status(status):
        return False
    if status == "Resolved":
        return False
    return role in ("Representative", "Aide", "Intern")


def can_resolve_owned(owner_staff_id: str | None, requester_id: str) -> bool:
    return bool(owner_staff_id) and owner_staff_id == requester_id


def can_reassign(role: str) -> bool:
    return role in ("Representative", "Aide")


def can_claim_group(role: str) -> bool:
    return role in ("Aide", "Intern")


def can_manage_staff(role: str) -> bool:
    return role == "Representative"


def can_view_staff(role: str) -> bool:
    return role == "Representative"
