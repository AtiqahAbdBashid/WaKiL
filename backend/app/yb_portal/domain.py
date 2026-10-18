"""Canonical YB-portal domain rules.

Statuses follow the 3-state lifecycle: Pending / In Progress / Resolved.
Roles stay Representative, Aide, Intern per the glossary.

ERD v3: the status vocabulary becomes the COMPLAINT.status CHECK, roles
become USER.role, and the can_* helpers become application write guards.
"""

# Lifecycle vocabulary for the COMPLAINT.status CHECK.
STATUSES = ["Pending", "In Progress", "Resolved"]

ROLES = ["Representative", "Aide", "Intern"]


# Status guards: keep writes inside the 3-state lifecycle.
def is_valid_status(s: str) -> bool:
    return s in STATUSES


def is_terminal_status(status: str) -> bool:
    return status == "Resolved"


# Session guard: deactivated staff lose access and their groups return to the pool.
def has_access(staff: dict | None) -> bool:
    return bool(staff) and bool(staff.get("active"))


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
