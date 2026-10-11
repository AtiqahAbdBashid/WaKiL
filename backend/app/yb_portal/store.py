"""In-memory YB-portal mock store, ported from backend/src/store.js.

Seeded from the same frontend mock data. Swap for a real DB later;
the route layer only uses the methods below, so persistence can change
without touching permissions or status logic.
"""

import copy
import time
from datetime import datetime, timezone

from .seed_aduan import SEED_ADUAN

SERVICE_CENTER_ID = "sc-bukit-gasing"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _seed_service_centers() -> list[dict]:
    return [
        {
            "id": SERVICE_CENTER_ID,
            "name": "ADUN Bukit Gasing Office",
            "address": "7A, Jalan 52/8, Seksyen 52, 46200 Petaling Jaya, Selangor",
            "constituency_kod": "N.34",
        },
    ]


def _seed_staff() -> list[dict]:
    return [
        {"id": "u-representative", "name": "YB Khairul", "role": "Representative", "email": "yb.khairul@parlimen.gov.my", "active": True, "expiresAt": None, "initials": "YB", "service_center_id": SERVICE_CENTER_ID},
        {"id": "u-aide", "name": "Aina Rahman", "role": "Aide", "email": "aina@parlimen.gov.my", "active": True, "expiresAt": None, "initials": "AR", "service_center_id": SERVICE_CENTER_ID},
        {"id": "u-aide2", "name": "Faizal Omar", "role": "Aide", "email": "faizal@parlimen.gov.my", "active": True, "expiresAt": None, "initials": "FO", "service_center_id": SERVICE_CENTER_ID},
        {"id": "u-aide3", "name": "Mei Chen", "role": "Aide", "email": "mei@parlimen.gov.my", "active": True, "expiresAt": None, "initials": "MC", "service_center_id": SERVICE_CENTER_ID},
        {"id": "u-intern", "name": "Danish Lim", "role": "Intern", "email": "danish@parlimen.gov.my", "active": True, "expiresAt": "2026-12-31", "initials": "DL", "service_center_id": SERVICE_CENTER_ID},
        {"id": "u-intern2", "name": "Sara Ali", "role": "Intern", "email": "sara@parlimen.gov.my", "active": True, "expiresAt": "2026-12-31", "initials": "SA", "service_center_id": SERVICE_CENTER_ID},
    ]


def _seed_case_groups() -> list[dict]:
    return [
        {"id": "cg-lights", "title": "Street light cluster Seksyen 17 Tengah", "category": "Infrastruktur + Jalan Raya", "status": "Open", "owner_staff_id": "u-aide"},
        {"id": "cg-drainage", "title": "Seksyen 16 drainage round", "category": "Banjir + Saliran", "status": "Open", "owner_staff_id": "u-aide2"},
    ]


class YBPortalStore:
    """Single-owner store. Assignment lives solely on case-group ownership."""

    def __init__(self) -> None:
        self._staff: list[dict] = _seed_staff()
        self._service_centers: list[dict] = _seed_service_centers()
        self._case_groups: list[dict] = _seed_case_groups()
        self._aduan: list[dict] = copy.deepcopy(SEED_ADUAN)

    # Staff.
    def list_staff(self) -> list[dict]:
        return [copy.deepcopy(s) for s in self._staff]

    def get_staff(self, staff_id: str | None) -> dict | None:
        if not staff_id:
            return None
        found = next((s for s in self._staff if s["id"] == str(staff_id)), None)
        return copy.deepcopy(found) if found else None

    def get_staff_by_email(self, email: str | None) -> dict | None:
        if not email:
            return None
        found = next(
            (s for s in self._staff if s["email"].lower() == str(email).lower()),
            None,
        )
        return copy.deepcopy(found) if found else None

    def add_staff(self, *, role: str, email: str, expires_at=None) -> dict:
        staff = {
            "id": f"u-{int(time.time() * 1000)}",
            "name": str(email).split("@")[0],
            "role": role,
            "email": email,
            "active": True,
            "expiresAt": expires_at,
            "initials": str(email)[:2].upper(),
            "service_center_id": SERVICE_CENTER_ID,
        }
        self._staff.append(staff)
        return copy.deepcopy(staff)

    def set_staff_active(self, staff_id: str, active: bool, by: str) -> dict | None:
        staff = next((s for s in self._staff if s["id"] == str(staff_id)), None)
        if staff is None:
            return None
        staff["active"] = active
        if not active:
            self._release_held(staff["id"], by, f"{staff['name']} deactivated, released to pool")
        return copy.deepcopy(staff)

    def sweep_expired(self, by: str = "system", now: datetime | None = None) -> int:
        now = now or datetime.now(timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
        from .domain import is_expired

        count = 0
        for staff in self._staff:
            if is_expired(staff, now):
                owned = {g["id"] for g in self._case_groups if g["owner_staff_id"] == staff["id"]}
                held = sum(1 for a in self._aduan if a.get("case_group_id") in owned)
                self._release_held(staff["id"], by, f"{staff['name']} expired, released to pool")
                count += held
        return count

    # Release owns the group-to-pool path.
    def _audit(self, item: dict, by: str, action: str, detail: str) -> None:
        item.setdefault("history", []).append(
            {"by": by, "at": now_iso(), "action": action, "detail": detail}
        )

    def _release_held(self, staff_id: str, by: str, reason: str) -> None:
        for group in self._case_groups:
            if group["owner_staff_id"] != staff_id:
                continue
            for item in self._aduan:
                if item.get("case_group_id") == group["id"]:
                    item["case_group_id"] = None
                    item["case_group_confirmed"] = False
                    self._audit(item, by, "release", reason)
            group["owner_staff_id"] = None

    # Read surfaces.
    def list_service_centers(self) -> list[dict]:
        return copy.deepcopy(self._service_centers)

    def list_case_groups(self) -> list[dict]:
        return [self.get_case_group(g["id"]) for g in self._case_groups]

    def get_case_group(self, group_id: str) -> dict | None:
        group = next((g for g in self._case_groups if g["id"] == str(group_id)), None)
        if group is None:
            return None
        out = copy.deepcopy(group)
        out["memberIds"] = [
            a["id"] for a in self._aduan if a.get("case_group_id") == group["id"]
        ]
        return out

    def create_case_group(self, *, title: str, category: str | None, owner_staff_id: str | None) -> dict:
        group = {
            "id": f"cg-{int(time.time() * 1000)}",
            "title": title,
            "category": category or "Isu Lain",
            "status": "Open",
            "owner_staff_id": owner_staff_id,
        }
        self._case_groups.append(group)
        out = copy.deepcopy(group)
        out["memberIds"] = []
        return out

    def set_case_group_owner(self, group_id: str, owner_staff_id: str | None) -> dict | None:
        group = next((g for g in self._case_groups if g["id"] == str(group_id)), None)
        if group is None:
            return None
        group["owner_staff_id"] = owner_staff_id
        return self.get_case_group(group_id)

    def list_aduan(self) -> list[dict]:
        return copy.deepcopy(self._aduan)

    def get_aduan(self, aduan_id) -> dict | None:
        found = next((a for a in self._aduan if str(a["id"]) == str(aduan_id)), None)
        return copy.deepcopy(found) if found else None


def create_store() -> YBPortalStore:
    return YBPortalStore()


store = YBPortalStore()


def get_store() -> YBPortalStore:
    return store
