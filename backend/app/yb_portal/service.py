"""Database access for the YB portal.

Rows are returned as the dicts the frontend already reads. Values the schema
has no column for are derived: ref_no from the creation year and id, initials
from the name, a group's category from its first complaint. A user without a
name falls back to one built from the email.
"""

import re
import uuid
from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    CaseGroup,
    Category,
    Complaint,
    ComplaintUpdate,
    Constituency,
    ServiceCenter,
    User,
)

from .kawasan import feature_contains, load_geo

FALLBACK_CATEGORY = "Others"
GROUP_STATUS = "Open"


def parse_id(value) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        return None


def staff_name(email: str) -> str:
    return email.split("@")[0].replace(".", " ").replace("_", " ").title()


def display_name(name: str | None, email: str) -> str:
    return (name or "").strip() or staff_name(email)


def staff_view(user: User) -> dict:
    name = display_name(user.name, user.email)
    return {
        "id": str(user.id),
        "name": name,
        "role": user.role,
        "email": user.email,
        "active": user.is_active,
        "expiresAt": None,
        "initials": "".join(w[0] for w in name.split()[:2]).upper() or user.email[:2].upper(),
        "service_center_id": str(user.service_center_id) if user.service_center_id else None,
    }


def get_staff(db: Session, staff_id) -> User | None:
    uid = parse_id(staff_id)
    user = db.get(User, uid) if uid else None
    return user if user and user.profile == "staff" else None


def get_staff_by_email(db: Session, email: str | None) -> User | None:
    if not email:
        return None
    return db.scalar(
        select(User).where(func.lower(User.email) == email.lower(), User.profile == "staff")
    )


def list_staff(db: Session) -> list[dict]:
    rows = db.scalars(select(User).where(User.profile == "staff").order_by(User.email))
    return [staff_view(u) for u in rows]


def add_staff(db: Session, *, role: str, email: str, service_center_id, name: str | None = None) -> dict:
    user = User(
        email=email, name=(name or "").strip() or None, profile="staff", role=role,
        service_center_id=service_center_id,
    )
    db.add(user)
    db.commit()
    return staff_view(user)


def set_staff_active(db: Session, staff_id, active: bool, by_id) -> dict | None:
    user = get_staff(db, staff_id)
    if user is None:
        return None
    user.is_active = active
    if not active:
        _release_held(db, user, by_id, f"{staff_view(user)['name']} deactivated, released to pool")
    db.commit()
    return staff_view(user)


def _release_held(db: Session, owner: User, by_id, reason: str) -> None:
    for group in db.scalars(select(CaseGroup).where(CaseGroup.user_id == owner.id)):
        for complaint in db.scalars(select(Complaint).where(Complaint.case_group_id == group.id)):
            complaint.case_group_id = None
            add_update(db, complaint.id, by_id, "release", reason)
        group.user_id = None


def _split_body(body: str) -> tuple[str, str]:
    match = re.match(r"\[([\w-]+)\] (.*)", body, re.S)
    return (match.group(1), match.group(2)) if match else ("note", body)


def add_update(db: Session, complaint_id, staff_id, action: str, detail: str) -> None:
    db.add(
        ComplaintUpdate(
            complaint_id=complaint_id, user_id=staff_id, body=f"[{action}] {detail}"
        )
    )


def list_categories(db: Session) -> list[str]:
    return list(db.scalars(select(Category.name).order_by(Category.name)))


def list_service_centers(db: Session) -> list[dict]:
    rows = db.execute(
        select(ServiceCenter, Constituency).join(
            Constituency, Constituency.id == ServiceCenter.constituency_id
        )
    )
    return [
        {
            "id": str(sc.id),
            "name": sc.name,
            "address": sc.address,
            "constituency_kod": _split_constituency(c.name)[0],
        }
        for sc, c in rows
    ]


def _split_constituency(name: str) -> tuple[str, str]:
    match = re.match(r"([NP]\.\d+)\s+(.*)", name)
    return (match.group(1), match.group(2)) if match else ("", name)


# DUN codes repeat across states, so the state is found by the full "N.34 Name" label.
def _state_of_dun(label: str) -> str | None:
    dun = load_geo()["dun"]
    match = dun[dun["dun"].astype(str).str.strip().str.lower() == label.strip().lower()]
    return str(match.iloc[0]["state"]) if len(match) else None


def get_kawasan(db: Session, service_center_id) -> dict | None:
    row = db.execute(
        select(Constituency)
        .join(ServiceCenter, ServiceCenter.constituency_id == Constituency.id)
        .where(ServiceCenter.id == parse_id(service_center_id))
    ).scalar_one_or_none()
    if row is None:
        return None
    kod, name = _split_constituency(row.name)
    state = _state_of_dun(row.name)
    return {
        "level": "dun",
        "kod": kod,
        "name": name,
        "state": state,
        "dun": row.name,
        "geojsonRef": row.geojson_ref,
    }


def _complaint_views(db: Session, complaints: list[Complaint]) -> list[dict]:
    ids = [c.id for c in complaints]
    categories = dict(db.execute(select(Category.id, Category.name)).all())
    citizens = {
        uid: display_name(name, email)
        for uid, name, email in db.execute(
            select(User.id, User.name, User.email).where(User.id.in_({c.user_id for c in complaints}))
        )
    }
    history = defaultdict(list)
    if ids:
        updates = db.scalars(
            select(ComplaintUpdate)
            .where(ComplaintUpdate.complaint_id.in_(ids))
            .order_by(ComplaintUpdate.created_at)
        )
        for u in updates:
            action, detail = _split_body(u.body)
            history[u.complaint_id].append(
                {"by": str(u.user_id), "at": u.created_at.isoformat(), "action": action, "detail": detail}
            )
    return [
        {
            "id": str(c.id),
            "ref_no": f"{c.created_at.year}-{c.id.hex[:6].upper()}",
            "title": c.title,
            "body": c.body,
            "category": categories.get(c.category_id, FALLBACK_CATEGORY),
            "locality": None,
            "constituency_kod": None,
            "citizen_id": str(c.user_id),
            "citizen_name": citizens.get(c.user_id, "Unknown citizen"),
            "time_of_occurrence": None,
            "case_group_id": str(c.case_group_id) if c.case_group_id else None,
            "case_group_confirmed": False,
            "date": c.created_at.date().isoformat(),
            "updatedAt": (history[c.id][-1]["at"] if history[c.id] else c.created_at.isoformat())[:10],
            "status": c.status,
            "needsRepresentativeAttention": c.rep_attention,
            "lokasi_geojson": None,
            "lat": c.latitude,
            "lng": c.longitude,
            "attachment": c.attachment,
            "history": history[c.id],
        }
        for c in complaints
    ]


# Every complaint with a pinned location; `inside` says whether it falls within
# the requested Kawasan boundary (the map greys out the rest).
def list_pins(db: Session, feature: dict) -> list[dict]:
    rows = db.scalars(
        select(Complaint)
        .where(Complaint.latitude.is_not(None))
        .order_by(Complaint.created_at.desc())
    )
    return [
        {
            "id": str(c.id),
            "title": c.title,
            "status": c.status,
            "lat": c.latitude,
            "lng": c.longitude,
            "inside": feature_contains(feature, c.longitude, c.latitude),
        }
        for c in rows
    ]


def list_complaints(db: Session) -> list[dict]:
    rows = list(db.scalars(select(Complaint).order_by(Complaint.created_at.desc())))
    return _complaint_views(db, rows)


def get_complaint(db: Session, complaint_id) -> Complaint | None:
    cid = parse_id(complaint_id)
    return db.get(Complaint, cid) if cid else None


def complaint_view(db: Session, complaint: Complaint) -> dict:
    return _complaint_views(db, [complaint])[0]


def group_view(db: Session, group: CaseGroup) -> dict:
    members = list(
        db.scalars(
            select(Complaint).where(Complaint.case_group_id == group.id).order_by(Complaint.created_at)
        )
    )
    category = db.scalar(select(Category.name).where(Category.id == members[0].category_id)) if members else None
    closed = bool(members) and all(m.status == "Resolved" for m in members)
    return {
        "id": str(group.id),
        "title": group.title,
        "category": category,
        "status": "Closed" if closed else GROUP_STATUS,
        "owner_staff_id": str(group.user_id) if group.user_id else None,
        "memberIds": [str(m.id) for m in members],
    }


def list_case_groups(db: Session) -> list[dict]:
    return [group_view(db, g) for g in db.scalars(select(CaseGroup).order_by(CaseGroup.title))]


def get_case_group(db: Session, group_id) -> CaseGroup | None:
    gid = parse_id(group_id)
    return db.get(CaseGroup, gid) if gid else None


def create_case_group(db: Session, title: str, owner_id) -> CaseGroup:
    group = CaseGroup(title=title.strip()[:200], user_id=owner_id)
    db.add(group)
    db.commit()
    return group


def open_members(db: Session, group: CaseGroup) -> list[Complaint]:
    return list(
        db.scalars(
            select(Complaint).where(
                Complaint.case_group_id == group.id, Complaint.status != "Resolved"
            )
        )
    )


# Joining a group is final: the complaint moves to In Progress under the group owner.
def join_group(db: Session, complaint: Complaint, group: CaseGroup, actor: dict, detail: str) -> None:
    previous = db.get(CaseGroup, complaint.case_group_id) if complaint.case_group_id else None
    actor_id = parse_id(actor["id"])
    complaint.case_group_id = group.id
    if complaint.status == "Pending":
        complaint.status = "In Progress"
    add_update(db, complaint.id, actor_id, "group-assign", detail)
    verb = "reassign" if previous else "claim"
    add_update(db, complaint.id, actor_id, verb, f"{actor['name']} {verb}ed via {group.title}")
